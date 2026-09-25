#!/usr/bin/env node
/* Casos a mano del motor CONTRA INCENDIO (fuego) · Fase 1, rev 2.9.24.
   Cálculo INDEPENDIENTE: no carga index.html ni usa ninguna función de la suite. Calcula cada caso en las unidades
   de NFPA 13 / NFPA 20 (gpm, ft², psi, pulgadas) con la conversión declarada abajo, y en paralelo reproduce la
   aritmética SI que la suite declara en su tabla RIESGO (index.html:10007-10023), ROCIADOR (10031-10035),
   TUB_FUEGO (10041-10047), DIAM_FUEGO (10049-10052), sizeFuego (10058-10065), hazen SI (9775-9778) y
   computeFuego (10089-10190), citando línea (numeración de la rev 2.9.24 en master, commit 2185dcd).

   Regla del esperado (PROMPTS-FASE1.md §fuego: «tolerancia 0.5 % o aritmética SI declarada»):
   - si el valor en unidades US difiere de la aritmética SI declarada en 0.5 % o menos, el esperado es el valor US y la
     tolerancia 0.5 % (el esperado NO sale de las constantes redondeadas de la suite);
   - si difiere más (K80 ≠ K5.6 = 80.7 L/min/√bar; 4.1 mm/min ≠ 0.10 gpm/ft² = 4.07), el esperado es la aritmética SI
     declarada con tolerancia 0.1 % y la fórmula dice cuánto da la norma en US y por qué difiere.
   - enteros (rociadores, HP, lista de bombas) van con tolerancia 0.
   Filas «fase2:H-nnn»: el valor correcto por norma que hoy la suite NO da (sólo se exigen con CM_FASE2=1).

   Uso: node parches/casos-a-mano/fuego.calc.mjs            → tabla legible por caso (US, SI, esperado elegido)
        node parches/casos-a-mano/fuego.calc.mjs --csv      → la hoja parches/casos-a-mano/fuego.csv por stdout

   Carácter de las fuentes: NFPA 13 y NFPA 20 NO están en parches/normas-texto (memoria), salvo NFPA 20 §4.9
   (capacidades nominales de bomba) que está publicado en up.codes:
   https://up.codes/viewer/california/nfpa-20-2016/chapter/4/general-requirements#4.9  (Table 4.9 Fire Pump Capacities) */

/* ---------- conversiones declaradas ---------- */
const GAL = 3.785411784;          // L por galón US (exacto)
const FT = 0.3048;                // m por pie (exacto)
const FT2 = FT * FT;              // m² por ft² = 0.09290304
const IN = 25.4;                  // mm por pulgada (exacto)
const PSI_BAR = 0.0689475729;     // bar por psi
const PSI_M = 0.7030696;          // m de columna de agua (4 °C) por psi = 0.0689475729 bar × 10.19716 m/bar
const M_BAR = 10.19716;           // m de columna de agua por bar (ρ 1000 kg/m³, g 9.80665); la suite usa 10.2 (index.html:10148)
const GPMFT2_MMMIN = GAL / FT2;   // 1 gpm/ft² = 40.746 mm/min

/* ---------- NFPA 13 en unidades US (memoria: curva densidad-área cap. 19 (2016) / Tabla 19.3.3.1.1; cobertura y
   espaciamiento máximos por clase Tablas 10.2.4.2.1(a)/(b) (ligero 225 ft², ordinario 130 ft², extra 100 ft²);
   manguera y duración Tabla 11.2.3.1.2 (2016) / 19.3.3.1.2 (2019)) ---------- */
const NFPA13_US = {
  ligero: { d: 0.10, A: 1500, Amax: 3000, cov: 225, spac: 15, hose: 100, dur: [30, 30] },
  ord1:   { d: 0.15, A: 1500, Amax: 4000, cov: 130, spac: 15, hose: 250, dur: [60, 90] },
  ord2:   { d: 0.20, A: 1500, Amax: 4000, cov: 130, spac: 15, hose: 250, dur: [60, 90] },
  extra1: { d: 0.30, A: 2500, Amax: 5000, cov: 100, spac: 12, hose: 500, dur: [90, 120] },
  extra2: { d: 0.40, A: 2500, Amax: 5000, cov: 100, spac: 12, hose: 500, dur: [90, 120] },
};
/* Factor K en US (gpm/√psi) y presión mínima de descarga 7 psi (NFPA 13 §23.4.4.7 / norma de producto) */
const ROC_US = { k80: 5.6, k115: 8.0, k160: 11.2 };
const PMIN_PSI = 7;
/* Diámetro interior acero cédula 40, pulgadas (ASME B36.10; NFPA 13 Tabla A.6.3.2 / 23.4.3.1.1) */
const SCH40_IN = [[1.049, '1"'], [1.380, '1 1/4"'], [1.610, '1 1/2"'], [2.067, '2"'], [2.469, '2 1/2"'], [3.068, '3"'], [4.026, '4"'], [5.047, '5"'], [6.065, '6"'], [7.981, '8"']];
const V_MAX_FPS = 20;             // 20 ft/s (la suite: 6.1 m/s, index.html:10054)
/* NFPA 20-2016 Tabla 4.9 capacidades nominales de bomba, gpm (up.codes, URL arriba) */
const NFPA20_GPM = [25, 50, 100, 150, 200, 250, 300, 400, 450, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
/* Potencias normalizadas de motor NEMA MG-1 (memoria) */
const NEMA_HP = [5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 125, 150, 200, 250, 300];

/* ---------- aritmética SI que la suite declara (para las filas vigentes cuando US difiere > 0.5 %) ---------- */
const SI = {   // index.html:10007-10023 (tabla RIESGO): densidad mm/min, área de operación m², cobertura m², espaciamiento m, manguera L/min, duración min
  ligero: { dens: 4.1,  areaMin: 139, areaMax: 279, cobertura: 20.9, espac: 4.6, manguera: 380,  dur: 30 },
  ord1:   { dens: 6.1,  areaMin: 139, areaMax: 372, cobertura: 12.1, espac: 4.6, manguera: 950,  dur: 60, durMax: 90 },
  ord2:   { dens: 8.1,  areaMin: 139, areaMax: 372, cobertura: 12.1, espac: 4.6, manguera: 950,  dur: 60, durMax: 90 },
  extra1: { dens: 12.2, areaMin: 232, areaMax: 465, cobertura: 9.3,  espac: 3.7, manguera: 1900, dur: 90 },
  extra2: { dens: 16.3, areaMin: 232, areaMax: 465, cobertura: 9.3,  espac: 3.7, manguera: 1900, dur: 120 },
};
const ROC_SI = { k80: 80, k115: 115, k160: 160 }, PMIN_BAR = 0.5;        // index.html:10031-10035
const DIAM_SI = [[26.6, '1"'], [35.1, '1 1/4"'], [40.9, '1 1/2"'], [52.5, '2"'], [62.7, '2 1/2"'], [77.9, '3"'], [102.3, '4"'], [128.2, '5"'], [154.1, '6"'], [202.7, '8"']]; // 10049-10052 (acero cédula 40 para todo material)
const C_SI = { acero_neg: 120, acero_gal: 120, cobre: 150, cpvc: 150 };  // 10041-10047
const V_MAX_SI = 6.1, SOBRE = 1.15, ACC = 1.3, MCA_BAR_SUITE = 10.2, ETA = 0.65, ESTATICA_EXTRA = 1; // 10056, 10126, 10137-10138, 10141, 10155, 10139
const LISTA_BOMBAS_SUITE = [500, 750, 1000, 1500, 2000, 2500, 3000, 3800, 5000];                     // 10153
const PRECIO = { rociador: 2850, bombaFuego: 385000, cisternaM3: 9500 };                             // 4774, 4775, 4765 (sin fuente: H-212, H-206)

/* Hazen-Williams SI como la declara la suite (index.html:9775-9778): hf/L = 10.67 Q^1.852 / (C^1.852 D^4.87), Q m³/s, D m */
const hazenSI = (Q_ls, D_mm, C) => 10.67 * Math.pow(Q_ls / 1000, 1.852) / (Math.pow(C, 1.852) * Math.pow(D_mm / 1000, 4.87));
const velSI = (Q_ls, D_mm) => (Q_ls / 1000) / (Math.PI * Math.pow(D_mm / 1000, 2) / 4);
/* Hazen-Williams NFPA 13 (§23.4.2.1 / 27.2.2.1): p = 4.52 Q^1.85 / (C^1.85 d^4.87) psi/ft, Q gpm, d pulgadas */
const hazenUS = (Q_gpm, d_in, C) => 4.52 * Math.pow(Q_gpm, 1.85) / (Math.pow(C, 1.85) * Math.pow(d_in, 4.87));
const velUS = (Q_gpm, d_in) => 0.4085 * Q_gpm / (d_in * d_in);                       // ft/s

/* ---------- cálculo SI declarado (misma secuencia que computeFuego, escrita aquí) ---------- */
function calcSI({ riesgo, area, altura, Lram, Lmon, K = "k80", C = 120, fuente = "cisterna", presFuente = 30, areaDiseno = 0, alturaMax = null, durAlta = false }) {
  const r = SI[riesgo], Kf = ROC_SI[K];
  const sinArea = !(area > 0);
  const areaDis = Math.min(Math.max(areaDiseno || r.areaMin, r.areaMin), r.areaMax);
  const nDiseno = sinArea ? 0 : Math.ceil(areaDis / r.cobertura);
  const nTotal = Math.ceil(area / r.cobertura);
  const espaciamiento = Math.min(r.espac, Math.sqrt(r.cobertura));
  const qRoc = r.dens * r.cobertura;
  const pRoc = Math.pow(qRoc / Kf, 2);
  const pDiseno = Math.max(PMIN_BAR, pRoc);
  const qReal = Kf * Math.sqrt(pDiseno);
  const qRociadores = nDiseno * qReal * SOBRE;
  const qManguera = sinArea ? 0 : r.manguera;
  const qTotal = qRociadores + qManguera;
  const size = (Q_lpm) => { for (const [d, nom] of DIAM_SI) if (velSI(Q_lpm / 60, d) <= V_MAX_SI) return { d, nom, V: velSI(Q_lpm / 60, d) }; const [d, nom] = DIAM_SI[9]; return { d, nom, V: velSI(Q_lpm / 60, d) }; };
  const ram = size(qRociadores), mon = size(qTotal);
  const hfRam = hazenSI(qRociadores / 60, ram.d, C) * Lram * ACC;
  const hfMon = hazenSI(qTotal / 60, mon.d, C) * Lmon * ACC;
  const estatica = (alturaMax != null ? alturaMax : altura) + ESTATICA_EXTRA;
  const mcaRoc = pDiseno * MCA_BAR_SUITE;
  const mcaTotal = mcaRoc + hfRam + hfMon + estatica;
  const barTotal = mcaTotal / MCA_BAR_SUITE;
  const alcanza = presFuente >= mcaTotal;
  const qBomba = sinArea ? 0 : LISTA_BOMBAS_SUITE.find((x) => x >= qTotal) || 5000;
  const presBomba = Math.max(0, mcaTotal - (fuente === "municipal" ? presFuente : 0));
  const kWbomba = 9.81 * (qBomba / 60 / 1000) * presBomba / ETA;
  const hpBomba = Math.ceil(kWbomba / .746 / 5) * 5;
  /* durAlta: valor alto del rango de NFPA 13 (fila fase2:H-207); la tabla SI de la suite sólo trae durMax en ordinario */
  const reserva = qTotal * (durAlta ? NFPA13_US[riesgo].dur[1] : r.dur);
  const partidaRoc = nTotal * PRECIO.rociador;
  const partidaBomba = fuente === "municipal" ? 0 : PRECIO.bombaFuego + PRECIO.cisternaM3 * reserva / 1000;
  return { areaDis, nDiseno, nTotal, espaciamiento, qRoc, pRoc, pDiseno, qReal, qRociadores, qManguera, qTotal, ramD: ram.d, monD: mon.d, ramNom: ram.nom, monNom: mon.nom, ramV: ram.V, monV: mon.V,
    hfRam, hfMon, estatica, mcaRoc, mcaTotal, barTotal, alcanza: alcanza ? 1 : 0, noCubre: qBomba < qTotal ? 1 : 0, qBomba, presBomba, kWbomba, hpBomba, reserva, partidaRoc, partidaBomba };
}

/* ---------- cálculo en unidades US de NFPA, convertido a las unidades de la suite ---------- */
function calcUS({ riesgo, area, altura, Lram, Lmon, K = "k80", C = 120, fuente = "cisterna", presFuente = 30, areaDiseno = 0, alturaMax = null, durAlta = false }) {
  const c = NFPA13_US[riesgo], Kf = ROC_US[K];
  const sinArea = !(area > 0);
  const areaFt2 = area / FT2, areaDisFt2 = Math.min(Math.max((areaDiseno || 0) / FT2 || c.A, c.A), c.Amax);
  const nDiseno = sinArea ? 0 : Math.ceil(areaDisFt2 / c.cov);
  const nTotal = Math.ceil(areaFt2 / c.cov);
  const espaciamientoFt = Math.min(c.spac, Math.sqrt(c.cov));
  const q1 = c.d * c.cov;                                   // gpm por rociador
  const p1 = Math.pow(q1 / Kf, 2);                          // psi
  const pDis = Math.max(PMIN_PSI, p1);
  const q1r = Kf * Math.sqrt(pDis);
  const qRoc = nDiseno * q1r * SOBRE;                       // gpm (mismo 1.15 declarado por la suite)
  const hose = sinArea ? 0 : c.hose;
  const qTot = qRoc + hose;
  const size = (Q) => { for (const [d, nom] of SCH40_IN) if (velUS(Q, d) <= V_MAX_FPS) return { d, nom, V: velUS(Q, d) }; const [d, nom] = SCH40_IN[9]; return { d, nom, V: velUS(Q, d) }; };
  const ram = size(qRoc), mon = size(qTot);
  const pRam = hazenUS(qRoc, ram.d, C) * (Lram / FT) * ACC;   // psi
  const pMon = hazenUS(qTot, mon.d, C) * (Lmon / FT) * ACC;
  const estatica = (alturaMax != null ? alturaMax : altura) + ESTATICA_EXTRA;   // m (criterio de la casa +1 m)
  const mcaRoc = pDis * PSI_M;
  const mcaTotal = mcaRoc + pRam * PSI_M + pMon * PSI_M + estatica;
  const barTotal = mcaTotal / M_BAR;
  const alcanza = presFuente >= mcaTotal;
  const ratedGpm = sinArea ? 0 : NFPA20_GPM.find((x) => x >= qTot) || null;        // NFPA 20 Tabla 4.9
  const presBomba = Math.max(0, mcaTotal - (fuente === "municipal" ? presFuente : 0));
  const whp = (Qg, Hm) => Qg * (Hm / FT) / 3960;                                    // HP hidráulicos: gpm × ft / 3960
  const bhpNFPA20 = ratedGpm ? whp(ratedGpm, presBomba) / ETA : 0;
  const nemaHP = ratedGpm ? NEMA_HP.find((x) => x >= bhpNFPA20) : 0;
  const listaSuiteLpm = sinArea ? 0 : LISTA_BOMBAS_SUITE.find((x) => x >= qTot * GAL) || 5000;   // para comparar HP con la lista de hoy
  const kWlista = 9.81 * (listaSuiteLpm / 60 / 1000) * presBomba / ETA;
  const hpLista = Math.ceil(kWlista / .746 / 5) * 5;
  const dur = durAlta ? c.dur[1] : c.dur[0];
  const reservaL = qTot * GAL * dur;
  return { areaDis: areaDisFt2 * FT2, nDiseno, nTotal, espaciamiento: espaciamientoFt * FT, qRoc: q1 * GAL, pRoc: p1 * PSI_BAR, pDiseno: pDis * PSI_BAR, qReal: q1r * GAL,
    qRociadores: qRoc * GAL, qManguera: hose * GAL, qTotal: qTot * GAL, ramD: ram.d * IN, monD: mon.d * IN, ramNom: ram.nom, monNom: mon.nom, ramV: ram.V * FT, monV: mon.V * FT,
    hfRam: pRam * PSI_M, hfMon: pMon * PSI_M, estatica, mcaRoc, mcaTotal, barTotal, alcanza: alcanza ? 1 : 0,
    qBombaNFPA20_gpm: ratedGpm, qBombaNFPA20: ratedGpm ? ratedGpm * GAL : 0, bhpNFPA20, hpNEMA: nemaHP, noCubre: listaSuiteLpm < qTot * GAL ? 1 : 0,
    qBomba: listaSuiteLpm, presBomba, kWbomba: kWlista, hpBomba: hpLista, reserva: reservaL, dur };
}

/* ---------- casos ---------- */
const CASOS = [
  /* H-205 (cerrado 25-sep-2026, fuego v3): la altura heredada es la MÁXIMA de las zonas (rociador más alto); alturaProm documenta
     el promedio ponderado que la suite heredaba antes, para dejar visible el salto. */
  { n: 1, tag: "R", titulo: "proyecto de regresión: ordinario 2, 700 m² y 6 m (máxima) heredados de 4 zonas (400/6, 100/3, 120/3, 80/3), cabezal 30 m, montante 12 m, K80, acero negro C 120, cisterna",
    in: { riesgo: "ord2", area: 700, altura: 6, Lram: 30, Lmon: 12, K: "k80", C: 120, fuente: "cisterna", presFuente: 30 }, alturaProm: 4.71, quote: true },
  { n: 2, tag: "R13", titulo: "nave con almacén alto: zonas Oficinas 2000 m²/3 m + Almacén 200 m²/13 m (heredado 2200 m², 13 m máxima), ordinario 2, 30 m + 12 m, cisterna",
    in: { riesgo: "ord2", area: 2200, altura: 13, Lram: 30, Lmon: 12, K: "k80", C: 120, fuente: "cisterna", presFuente: 30 }, alturaProm: 3.91 },
  { n: 3, tag: "A", titulo: "riesgo ligero 300 m², 3.5 m, cabezal 20 m, montante 6 m, K80, red municipal 35 mca",
    in: { riesgo: "ligero", area: 300, altura: 3.5, Lram: 20, Lmon: 6, K: "k80", C: 120, fuente: "municipal", presFuente: 35 }, quote: true },
  { n: 4, tag: "A2", titulo: "riesgo ligero 300 m², 3.5 m, 20 m + 6 m, rociador K160: rige la presión mínima de descarga",
    in: { riesgo: "ligero", area: 300, altura: 3.5, Lram: 20, Lmon: 6, K: "k160", C: 120, fuente: "cisterna", presFuente: 30 } },
  { n: 5, tag: "B", titulo: "riesgo extra 1, 1,000 m², 8 m, cabezal 40 m, montante 15 m, K80, cisterna",
    in: { riesgo: "extra1", area: 1000, altura: 8, Lram: 40, Lmon: 15, K: "k80", C: 120, fuente: "cisterna", presFuente: 30 } },
  { n: 6, tag: "E", titulo: "arranque en ceros: ordinario 2 con 600 m² capturados y altura, cabezal y montante en 0 (H-210)",
    in: { riesgo: "ord2", area: 600, altura: 0, Lram: 0, Lmon: 0, K: "k80", C: 120, fuente: "cisterna", presFuente: 0 } },
  { n: 7, tag: "D", titulo: "área protegida menor que el área de operación: ordinario 2, 50 m², 4 m, 10 m + 5 m (piso de la curva)",
    in: { riesgo: "ord2", area: 50, altura: 4, Lram: 10, Lmon: 5, K: "k80", C: 120, fuente: "cisterna", presFuente: 30 } },
  { n: 8, tag: "I", titulo: "área de diseño capturada arriba del máximo de la curva: ordinario 2, 2,000 m², 6 m, 30 m + 12 m, areaDiseno 500 m²",
    in: { riesgo: "ord2", area: 2000, altura: 6, Lram: 30, Lmon: 12, K: "k80", C: 120, fuente: "cisterna", presFuente: 30, areaDiseno: 500 } },
  { n: 9, tag: "J", titulo: "riesgo ordinario 1, 400 m², 4 m, 15 m + 5 m, rociador K115, red de COBRE (C 150; la suite usa los DI de acero cédula 40 para todo material), red municipal 20 mca",
    in: { riesgo: "ord1", area: 400, altura: 4, Lram: 15, Lmon: 5, K: "k115", C: 150, fuente: "municipal", presFuente: 20 } },
  { n: 10, tag: "C", titulo: "riesgo extra 2, 1,000 m², 8 m, 40 m + 15 m, K80, cisterna (duración 120 min sin rango)",
    in: { riesgo: "extra2", area: 1000, altura: 8, Lram: 40, Lmon: 15, K: "k80", C: 120, fuente: "cisterna", presFuente: 30 } },
];

/* ---------- filas de la hoja ---------- */
const r4 = (x) => Math.abs(x) >= 1000 ? +x.toFixed(2) : +x.toFixed(4);
const pct = (a, b) => b === 0 ? 0 : Math.abs(a - b) / Math.abs(b) * 100;
const FUENTE_NFPA13 = "NFPA 13-2016 cap. 19 curva densidad-área (Tabla 19.3.3.1.1) y Tabla 10.2.4.2.1 coberturas; densidad/área/cobertura SI de la suite index.html:10007-10023";
const CALC = "parches/casos-a-mano/fuego.calc.mjs";
const filas = [];
const fila = (id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado) =>
  filas.push({ id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado, calculado_por: CALC });
/* Elige el esperado entre US y SI según la regla del encabezado; devuelve [esperado, tolerancia, nota] */
function elegir(us, si, entero = false) {
  if (entero) return us === si ? [us, "0", `US ${us} = SI ${si}`] : [si, "0", `US da ${us}; SI declarada ${si} (difiere por el redondeo de la tabla SI de la suite)`];
  const d = pct(us, si);
  if (d <= 0.5) return [r4(us), "0.5%", `US ${r4(us)} (SI declarada ${r4(si)}, difiere ${d.toFixed(2)} %)`];
  return [r4(si), "0.1%", `aritmética SI declarada ${r4(si)}; en US da ${r4(us)} (difiere ${d.toFixed(2)} % por las constantes redondeadas de la suite: K80 ≠ K5.6 = 80.7 L/min/√bar, 4.1 mm/min ≠ 0.10 gpm/ft² = 4.07)`];
}
const entradasDe = (c) => `riesgo ${c.in.riesgo}; área ${c.in.area} m²; altura ${c.in.altura} m; cabezal ${c.in.Lram} m; montante ${c.in.Lmon} m; ${c.in.K}; C ${c.in.C}; fuente ${c.in.fuente}${c.in.fuente === "municipal" ? ` ${c.in.presFuente} mca` : ""}${c.in.areaDiseno ? `; areaDiseno ${c.in.areaDiseno} m²` : ""}`;

for (const c of CASOS) {
  const us = calcUS(c.in), si = calcSI(c.in), E = entradasDe(c), P = `CM.fuego.${c.n}`;
  const rUS = NFPA13_US[c.in.riesgo], rSI = SI[c.in.riesgo];
  const V = (letra, desc, formula, fuente, caracter, expr, usV, siV, entero, estado = "vigente") => {
    const [esp, tol, nota] = elegir(usV, siV, entero);
    fila(`${P}.${letra}`, desc, E, `${formula} → ${nota}`, fuente, caracter, expr, esp, tol, estado);
  };
  /* --- cantidad de rociadores y densidad --- */
  if (c.in.areaDiseno) V("a", "área de operación acotada al máximo de la curva", `min(max(${c.in.areaDiseno}, ${rSI.areaMin}), ${rSI.areaMax}) m²; US min(max(${(c.in.areaDiseno / FT2).toFixed(0)}, ${rUS.A}), ${rUS.Amax}) ft² × 0.0929`, FUENTE_NFPA13, "memoria", "FUEGO.areaDis", us.areaDis, si.areaDis, false);
  else if (c.in.area < rSI.areaMin) V("a", "área de operación no baja del mínimo de la curva aunque el área protegida sea menor (piso de norma)", `max(${rSI.areaMin}, área ${c.in.area}) = ${rSI.areaMin} m²; US ${rUS.A} ft² × 0.0929`, FUENTE_NFPA13, "memoria", "FUEGO.areaDis", us.areaDis, si.areaDis, false);
  V("b", "rociadores en el área de diseño", `ceil(${rUS.A} ft² / ${rUS.cov} ft²) = ${us.nDiseno}; SI ceil(${si.areaDis} / ${rSI.cobertura})`, FUENTE_NFPA13, "memoria", "FUEGO.nDiseno", us.nDiseno, si.nDiseno, true);
  V("c", "rociadores en toda el área protegida", `ceil(${(c.in.area / FT2).toFixed(1)} ft² / ${rUS.cov} ft²) = ${us.nTotal}; SI ceil(${c.in.area} / ${rSI.cobertura})`, FUENTE_NFPA13, "memoria", "FUEGO.nTotal", us.nTotal, si.nTotal, true);
  if (c.n === 1) V("d", "retícula de rociadores: mínimo entre espaciamiento máximo y raíz de la cobertura", `min(${rUS.spac} ft, √${rUS.cov} ft²) = ${us.espaciamiento.toFixed(3)} m; SI min(${rSI.espac}, √${rSI.cobertura})`, FUENTE_NFPA13, "memoria", "FUEGO.espaciamiento", us.espaciamiento, si.espaciamiento, false);
  V("e", "caudal pedido al rociador más desfavorable: densidad × cobertura", `${rUS.d} gpm/ft² × ${rUS.cov} ft² = ${(rUS.d * rUS.cov).toFixed(2)} gpm × 3.7854; SI ${rSI.dens} mm/min × ${rSI.cobertura} m²`, FUENTE_NFPA13, "memoria", "FUEGO.qRoc", us.qRoc, si.qRoc, false);
  V("f", "presión de diseño en la boquilla: máx(mínimo de descarga, (Q/K)²)", `max(${PMIN_PSI} psi, (${(rUS.d * rUS.cov).toFixed(2)} / K${ROC_US[c.in.K]})²) = ${(us.pDiseno / PSI_BAR).toFixed(2)} psi × 0.068948; SI max(${PMIN_BAR}, (${si.qRoc.toFixed(2)} / ${ROC_SI[c.in.K]})²)`, "NFPA 13-2016 §23.4.4.7 presión mínima 7 psi (0.5 bar en la suite, index.html:10032); K por norma de producto (UL 199)", "memoria", "FUEGO.pDiseno", us.pDiseno, si.pDiseno, false);
  V("g", "caudal real descargado por rociador: K √P", `K${ROC_US[c.in.K]} × √${(us.pDiseno / PSI_BAR).toFixed(2)} psi = ${(us.qReal / GAL).toFixed(2)} gpm × 3.7854; SI ${ROC_SI[c.in.K]} × √${si.pDiseno.toFixed(4)}`, "NFPA 13-2016 §23.4.4 (Q = K√P)", "memoria", "FUEGO.qReal", us.qReal, si.qReal, false);
  V("h", "demanda total: n × q × 1.15 de sobredescarga (criterio de la casa) + manguera de la clase", `${us.nDiseno} × ${(us.qReal / GAL).toFixed(2)} × 1.15 + ${rUS.hose} gpm = ${(us.qTotal / GAL).toFixed(2)} gpm × 3.7854; SI ${si.nDiseno} × ${si.qReal.toFixed(2)} × 1.15 + ${rSI.manguera}`, "NFPA 13-2016 Tabla 11.2.3.1.2 manguera por clase; 1.15 criterio de la casa (index.html:10126)", "memoria", "FUEGO.qTotal", us.qTotal, si.qTotal, false);
  /* --- hidráulica --- */
  V("i", "cabezal: primer diámetro cédula 40 con V ≤ 20 ft/s (6.1 m/s), DI en mm", `${(us.qRociadores / GAL).toFixed(1)} gpm → ${us.ramNom} (${SCH40_IN.find((x) => x[1] === us.ramNom)[0]} in × 25.4)`, "ASME B36.10 cédula 40; velocidad máxima criterio de la casa (index.html:10056)", "memoria", "FUEGO.ram.d", us.ramD, si.ramD, false);
  V("j", "montante: primer diámetro cédula 40 con V ≤ 20 ft/s (6.1 m/s), DI en mm", `${(us.qTotal / GAL).toFixed(1)} gpm → ${us.monNom} (${SCH40_IN.find((x) => x[1] === us.monNom)[0]} in × 25.4)`, "ASME B36.10 cédula 40; velocidad máxima criterio de la casa (index.html:10056)", "memoria", "FUEGO.mon.d", us.monD, si.monD, false);
  V("k", "pérdida en el cabezal por Hazen-Williams con 30 % de accesorios (criterio de la casa)", `4.52 × ${(us.qRociadores / GAL).toFixed(1)}^1.85 / (${c.in.C}^1.85 × ${SCH40_IN.find((x) => x[1] === us.ramNom)[0]}^4.87) psi/ft × ${(c.in.Lram / FT).toFixed(2)} ft × 1.3 = ${(us.hfRam / PSI_M).toFixed(3)} psi × 0.70307 m/psi; SI 10.67 Q^1.852/(C^1.852 D^4.87) × ${c.in.Lram} × 1.3`, "NFPA 13-2016 §23.4.2.1 (Hazen-Williams); C por material Tabla 23.4.4.8; 30 % accesorios criterio de la casa (index.html:10134-10137)", "memoria", "FUEGO.hfRam", us.hfRam, si.hfRam, false);
  V("l", "pérdida en el montante por Hazen-Williams con 30 % de accesorios", `4.52 × ${(us.qTotal / GAL).toFixed(1)}^1.85 / (${c.in.C}^1.85 × ${SCH40_IN.find((x) => x[1] === us.monNom)[0]}^4.87) × ${(c.in.Lmon / FT).toFixed(2)} ft × 1.3 = ${(us.hfMon / PSI_M).toFixed(3)} psi × 0.70307`, "NFPA 13-2016 §23.4.2.1; 30 % accesorios criterio de la casa (index.html:10138)", "memoria", "FUEGO.hfMon", us.hfMon, si.hfMon, false);
  V("m", `altura estática: altura libre ${c.alturaProm != null ? "MÁXIMA heredada (rociador más alto; H-205)" : "capturada"} + 1 m (criterio de la casa)`, `${c.in.altura} + 1`, "criterio de la casa (index.html:10139)", "memoria", "FUEGO.estatica", us.estatica, si.estatica, false);
  V("n", `presión requerida en la base del montante, m de columna de agua${c.alturaProm != null ? " (con la altura máxima heredada; H-205)" : ""}`, `${(us.pDiseno / PSI_BAR).toFixed(2)} psi × 0.70307 + ${us.hfRam.toFixed(3)} + ${us.hfMon.toFixed(3)} + ${us.estatica} = ${us.mcaTotal.toFixed(3)} m; SI ${si.pDiseno.toFixed(4)} bar × 10.2 + ${si.hfRam.toFixed(3)} + ${si.hfMon.toFixed(3)} + ${si.estatica}`, "NFPA 13-2016 §23.4 (suma de presiones de la trayectoria); 1 bar = 10.2 mca criterio de la casa (index.html:10141)", "memoria", "FUEGO.mcaTotal", us.mcaTotal, si.mcaTotal, false);
  if (c.in.fuente === "municipal") {
    V("o", "la red municipal alcanza (1) o no (0) la presión requerida", `${c.in.presFuente} ≥ ${us.mcaTotal.toFixed(2)} → ${us.alcanza}`, "comparación directa (index.html:10146)", "memoria", "Number(FUEGO.alcanza)", us.alcanza, si.alcanza, true);
    V("p", "presión que debe aportar la bomba de refuerzo: requerida − municipal", `${us.mcaTotal.toFixed(3)} − ${c.in.presFuente}`, "criterio de la casa (index.html:10154)", "memoria", "FUEGO.presBomba", us.presBomba, si.presBomba, false);
  }
  /* --- bomba y reserva (hoy) --- */
  if (c.in.area > 0) {
    V("q", `bomba nominal de la lista de prediseño de la suite (hoy; cambia con H-208)${us.noCubre ? " — tope de lista, NO cubre la demanda" : ""}`, `primer valor de [500, 750, 1000, 1500, 2000, 2500, 3000, 3800, 5000] ≥ ${si.qTotal.toFixed(1)} L/min, o 5000`, "lista de la suite sin norma (index.html:10153); NFPA 20 en la fila fase2:H-208", "memoria", "FUEGO.qBomba", us.qBomba, si.qBomba, true);
    if (us.noCubre) V("q2", "la lista de prediseño no cubre la demanda (1 = no cubre)", `${us.qBomba} < ${si.qTotal.toFixed(1)} → 1`, "comparación directa (index.html:10157)", "memoria", "Number(FUEGO.qBomba < FUEGO.qTotal)", us.noCubre, si.noCubre, true);
    V("r", "potencia al eje con la bomba de lista: ρ g Q H / η, η 0.65 (hoy; cambia con H-208/H-209)", `9.81 × ${us.qBomba}/60000 × ${us.presBomba.toFixed(3)} / 0.65 = ${si.kWbomba.toFixed(3)} kW; US ${us.qBomba / GAL > 0 ? (us.qBomba / GAL).toFixed(1) : 0} gpm × ${(us.presBomba / FT).toFixed(2)} ft / 3960 / 0.65 = ${(us.kWbomba / .746).toFixed(2)} hp × 0.746`, "η 0.65 y punto nominal: criterio de la casa sin fuente (index.html:10155; H-209)", "memoria", "FUEGO.kWbomba", us.kWbomba, si.kWbomba, false);
    V("s", "HP de la bomba redondeados a múltiplo de 5 (hoy; cambia con H-209)", `ceil(${si.kWbomba.toFixed(3)} / 0.746 / 5) × 5`, "redondeo criterio de la casa (index.html:10156); NEMA en la fila fase2:H-209", "memoria", "FUEGO.hpBomba", us.hpBomba, si.hpBomba, true);
    V("t", `reserva de agua: demanda × duración ${rUS.dur[0]} min (valor bajo del rango; hoy, cambia con H-207)`, `${(us.qTotal / GAL).toFixed(2)} gpm × ${rUS.dur[0]} min × 3.7854 L/gal; SI ${si.qTotal.toFixed(2)} × ${rSI.dur}`, "NFPA 13-2016 Tabla 11.2.3.1.2 duración por clase", "memoria", "FUEGO.reserva", us.reserva, si.reserva, false);
  }
  /* --- cotización (hoy) --- */
  if (c.quote) {
    V("u", "partida de rociadores en la cotización: nTotal × 2,850 MXN (precio sin fuente, H-212; hoy)", `${si.nTotal} × 2,850`, "precio de referencia interno sin fuente (index.html:4774; H-212)", "memoria", 'QUOTE.aux.filter((a) => a.mot === "fuego" && a.un === "PIEZA").reduce((s, a) => s + a.total, 0)', si.partidaRoc, si.partidaRoc, false);
    if (c.in.fuente !== "municipal") V("v", "partida de bomba y cisterna: 385,000 fijos + 9,500 MXN/m³ × reserva (hoy; cambia con H-206)", `385,000 + 9,500 × ${(si.reserva / 1000).toFixed(3)} m³`, "precios fijos sin fuente (index.html:4775, 4765; H-206, H-212)", "memoria", 'QUOTE.aux.filter((a) => a.mot === "fuego" && a.un === "LOTE").reduce((s, a) => s + a.total, 0)', si.partidaBomba, si.partidaBomba, false);
    else V("v", "con red municipal la cotización no lleva partida de bomba ni cisterna con importe (0 partidas LOTE; hoy y tras H-211, cuando la bomba y la cisterna pasen a pendientes «Por cotizar»)", "sin partida", "index.html:8431 (sólo con fuente ≠ municipal)", "memoria", 'QUOTE.aux.filter((a) => a.mot === "fuego" && a.un === "LOTE").length', 0, 0, true);
  }
  /* --- H-205 (vigente desde el 25-sep-2026): la estática al rociador más alto; el promedio de antes queda como referencia --- */
  if (c.alturaProm != null) {
    const siP = calcSI({ ...c.in, alturaMax: c.alturaProm });
    fila(`${P}.F1`, `H-205 · estática con la zona MÁS ALTA (${c.in.altura} m), no el promedio ponderado ${c.alturaProm} m que se heredaba antes`, E, `${c.in.altura} + 1 = ${si.estatica}`, "PLAN-CRITICOS.md §4 (regla del dueño: rociador más alto y área más remota); NFPA 13 cálculo al rociador más remoto (memoria)", "memoria", "FUEGO.estatica", si.estatica, "0.01");
    const [esp2, tol2, nota2] = elegir(us.mcaTotal, si.mcaTotal);
    fila(`${P}.F2`, `H-205 · presión requerida con la altura máxima ${c.in.altura} m (+${(si.mcaTotal - siP.mcaTotal).toFixed(2)} m sobre el promedio de antes)`, E, `${siP.mcaTotal.toFixed(3)} − ${siP.estatica} + ${si.estatica} → ${nota2}`, "PLAN-CRITICOS.md §4 (regla del dueño); NFPA 13 (memoria)", "memoria", "FUEGO.mcaTotal", esp2, tol2);
    if (siP.hpBomba !== si.hpBomba) fila(`${P}.F3`, `H-205 · HP con la altura máxima (antes ${siP.hpBomba} HP con el promedio)`, E, `ceil(9.81 × ${si.qBomba}/60000 × ${si.mcaTotal.toFixed(3)} / 0.65 / 0.746 / 5) × 5`, "PLAN-CRITICOS.md §4 (regla del dueño)", "memoria", "FUEGO.hpBomba", si.hpBomba, "0");
    if (c.in.altura > 12) fila(`${P}.F4`, "H-205 · con 13 m de altura real el aviso de almacenamiento en rack (> 12 m) sale (1 = sale); antes no salía porque el promedio era 3.91 m", E, "altura máxima 13 > 12 → aviso", "NFPA 13 cap. 12/20 almacenamiento (memoria); index.html:10186", "memoria", 'Number(FUEGO.avisos.some((a) => /rack/.test(a.msg)))', 1, "0");
  }
  if (c.n === 1) {
    fila(`${P}.F5`, "H-206 · el importe de la bomba no es fijo: queda «Por cotizar» con capacidad y potencia declaradas (1 = hay pendiente de bomba en la cotización)", E, "pendiente en QUOTE.pendientes con mot fuego y «bomba»", "PLAN-CRITICOS.md §4 H-206 y decisión 6 (H-252)", "memoria", 'Math.min(1, (QUOTE.pendientes || []).filter((p) => p.mot === "fuego" && /[Bb]omba/.test(p.desc)).length)', 1, "0", "fase2:H-206");
  }
  if (rUS.dur[1] !== rUS.dur[0] && c.in.area > 0 && (c.n === 1 || c.n === 5)) {
    const usA = calcUS({ ...c.in, durAlta: true }), siA = calcSI({ ...c.in, durAlta: true });
    const [espA, tolA, notaA] = elegir(usA.reserva, siA.reserva);
    fila(`${P}.F6`, `H-207 · reserva con el valor ALTO del rango de duración (${rUS.dur[1]} min) por omisión, salvo supervisión declarada (hoy ${rUS.dur[0]} min)`, E, `${(usA.qTotal / GAL).toFixed(2)} gpm × ${rUS.dur[1]} min × 3.7854 → ${notaA}`, "NFPA 13-2016 §11.2.3.1.3 / Tabla 11.2.3.1.2 (memoria)", "memoria", "FUEGO.reserva", espA, tolA, "fase2:H-207");
  }
  if (c.in.area > 0 && (c.n === 1 || c.n === 3 || c.n === 5)) {
    fila(`${P}.F7`, `H-208 · bomba nominal de la tabla de NFPA 20: ${us.qBombaNFPA20_gpm} gpm (hoy ${si.qBomba} L/min de una lista sin norma)`, E, `primer valor de Tabla 4.9 ≥ ${(us.qTotal / GAL).toFixed(1)} gpm = ${us.qBombaNFPA20_gpm} gpm × 3.7854 L/gal`, "NFPA 20-2016 Tabla 4.9 · https://up.codes/viewer/california/nfpa-20-2016/chapter/4/general-requirements#4.9", "primaria", "FUEGO.qBomba", r4(us.qBombaNFPA20), "0.01%", "fase2:H-208");
  }
  if (c.n === 1) {
    fila(`${P}.F8`, `H-209 · potencia del motor en tamaño NEMA con la bomba de NFPA 20 (${us.qBombaNFPA20_gpm} gpm): ${us.hpNEMA} HP (hoy ${si.hpBomba} HP, que no es tamaño NEMA)`, E, `${us.qBombaNFPA20_gpm} gpm × ${(us.presBomba / FT).toFixed(2)} ft / 3960 / 0.65 = ${us.bhpNFPA20.toFixed(2)} bhp → NEMA inmediato superior`, "NFPA 20-2019 §4.7.6 (motor para la potencia máxima de la curva; memoria); NEMA MG-1 (memoria); depende de H-208", "memoria", "FUEGO.hpBomba", us.hpNEMA, "0", "fase2:H-209");
  }
  if (c.n === 3) {
    fila(`${P}.F9`, "H-211 · red municipal que no alcanza: bomba y cisterna quedan «Por cotizar» en la cotización (1 = hay pendiente de fuego); hoy 0", E, `35 mca < ${si.mcaTotal.toFixed(1)} → pendiente`, "PLAN-CRITICOS.md / AUDITORIA H-211; regla 6 de CLAUDE.md (nada se estima)", "memoria", 'Math.min(1, (QUOTE.pendientes || []).filter((p) => p.mot === "fuego").length)', 1, "0", "fase2:H-211");
  }
  if (c.n === 6) {
    fila(`${P}.F10`, "H-210 · con altura, cabezal y montante en 0 no se dimensiona bomba: HP = 0 (pendiente), hoy 15 HP", E, "sin altura ni trayectoria capturadas → sin bomba", "AUDITORIA H-210; regla 6 de CLAUDE.md (nada se estima)", "memoria", "Number(FUEGO.hpBomba) || 0", 0, "0", "fase2:H-210");
    fila(`${P}.F11`, "H-210 · el motor avisa con error que faltan altura y trayectoria (1 = hay aviso err); hoy 0", E, "aviso lvl err", "AUDITORIA H-210", "memoria", 'Math.min(1, FUEGO.avisos.filter((a) => a.lvl === "err").length)', 1, "0", "fase2:H-210");
    fila(`${P}.F12`, "H-210 · el semáforo de contra incendio marca «incompleta», no «datos» (1 = incompleta); hoy 0", E, "semáforo", "AUDITORIA H-210", "memoria", 'Number((semaforoSuite().find((x) => x.id === "fuego") || {}).nivel === "incompleta")', 1, "0", "fase2:H-210");
  }
}

/* ---------- salida ---------- */
const csv = (v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const COLS = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
if (process.argv.includes("--csv")) {
  console.log(COLS.join(","));
  filas.forEach((f) => console.log(COLS.map((k) => csv(f[k])).join(",")));
} else {
  for (const c of CASOS) {
    const us = calcUS(c.in), si = calcSI(c.in);
    console.log(`\n===== CM.fuego.${c.n} (${c.tag}) ${c.titulo}`);
    const ks = ["areaDis", "nDiseno", "nTotal", "espaciamiento", "qRoc", "pDiseno", "qReal", "qRociadores", "qTotal", "ramD", "monD", "ramV", "monV", "hfRam", "hfMon", "estatica", "mcaTotal", "barTotal", "alcanza", "qBomba", "presBomba", "kWbomba", "hpBomba", "reserva"];
    console.log("  ".padEnd(16) + "US→SI".padStart(14) + "SI declarada".padStart(14) + "  dif %");
    for (const k of ks) console.log(`  ${k.padEnd(14)}${(+us[k]).toFixed(4).padStart(14)}${(+si[k]).toFixed(4).padStart(14)}  ${pct(us[k], si[k]).toFixed(2)}`);
    console.log(`  NFPA 20: ${us.qBombaNFPA20_gpm} gpm = ${us.qBombaNFPA20.toFixed(1)} L/min · bhp ${us.bhpNFPA20.toFixed(2)} → NEMA ${us.hpNEMA} HP · reserva alta ${(calcUS({ ...c.in, durAlta: true }).reserva / 1000).toFixed(1)} m³`);
    if (c.alturaMax != null) { const s2 = calcSI({ ...c.in, alturaMax: c.alturaMax }); console.log(`  con altura máxima ${c.alturaMax} m: estática ${s2.estatica} · H ${s2.mcaTotal.toFixed(3)} m (+${(s2.mcaTotal - si.mcaTotal).toFixed(2)}) · ${s2.hpBomba} HP`); }
  }
  console.log(`\n${filas.length} filas (vigentes ${filas.filter((f) => f.estado === "vigente").length}, fase2 ${filas.filter((f) => /^fase2/.test(f.estado)).length}). Con --csv imprime la hoja.`);
  filas.forEach((f) => console.log(`  ${f.id.padEnd(16)} ${String(f.esperado).padStart(14)} ±${f.tolerancia.padEnd(6)} ${f.estado.padEnd(12)} ${f.expresion}`));
}
