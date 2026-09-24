#!/usr/bin/env node
/* Fase 1 · motor ELÉCTRICO (elec) · casos calculados a mano, INDEPENDIENTES de index.html.
   Uso: node parches/casos-a-mano/elec.calc.mjs   → imprime los esperados de parches/casos-a-mano/elec.csv por id.
   Fuente primaria: NOM-001-SEDE-2012 (texto del DOF en parches/normas-texto/NOM-001-SEDE-2012_DOF_texto.txt, marcas
   =====PAG n=====). Cada tabla va transcrita aquí con su página. Lo que no es norma se declara «criterio de la casa»
   (regla que hoy aplica la suite y que la hoja marca como vigente) o «memoria».
   Nada de aquí lee la suite, cifrasMotor ni el esperado de regresión. */

/* ---------- Tabla 310-15(b)(16), columna 75 °C, no más de tres portadores, 30 °C (p. 190) ---------- */
const ORD = ["14", "12", "10", "8", "6", "4", "3", "2", "1", "1/0", "2/0", "3/0", "4/0", "250", "300", "350", "400", "500", "600", "750"];
const AMP75_CU = { "14": 20, "12": 25, "10": 35, "8": 50, "6": 65, "4": 85, "3": 100, "2": 115, "1": 130, "1/0": 150, "2/0": 175, "3/0": 200, "4/0": 230, "250": 255, "300": 285, "350": 310, "400": 335, "500": 380, "600": 420, "750": 475 };
/* Aluminio: la tabla empieza en 6 AWG (13.3 mm²); 14, 12, 10 y 8 AWG traen «—» (p. 190) y la Tabla 310-106(a) (p. 216)
   fija 6 AWG como tamaño mínimo de aluminio para 0-2000 V. */
const AMP75_AL = { "6": 50, "4": 65, "3": 75, "2": 90, "1": 100, "1/0": 120, "2/0": 135, "3/0": 155, "4/0": 180, "250": 205, "300": 230, "350": 250, "400": 270, "500": 310, "600": 340, "750": 385 };
/* ---------- Tabla 310-15(b)(2)(a), columna 75 °C (p. 186) ---------- */
const F_TEMP_75 = [[10, 1.20], [15, 1.15], [20, 1.11], [25, 1.05], [30, 1.00], [35, 0.94], [40, 0.88], [45, 0.82], [50, 0.75], [55, 0.67], [60, 0.58], [65, 0.47], [70, 0.33]];
const fTemp = (t) => { const x = F_TEMP_75.find(([lim]) => t <= lim); if (!x) throw new Error("fuera de la Tabla 310-15(b)(2)(a)"); return x[1]; };
/* ---------- Tabla 310-15(b)(3)(a) (p. 187) ---------- */
const fGrupo = (n) => (n <= 3 ? 1.00 : n <= 6 ? 0.80 : n <= 9 ? 0.70 : n <= 20 ? 0.50 : n <= 30 ? 0.45 : n <= 40 ? 0.40 : 0.35);
/* ---------- 240-6(a) valores normalizados (p. 104) ---------- */
const OCPD = [15, 16, 20, 25, 30, 32, 35, 40, 45, 50, 60, 63, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];
/* La suite no lista 16, 32 ni 63 A (son valores IEC que el DOF incluye) ni nada arriba de 2000 A; para los casos vigentes
   se usa la lista sin 16/32/63 (criterio de la casa, declarado) y para la fila fase2:H-185 la lista completa. */
const OCPD_CASA = OCPD.filter((x) => ![16, 32, 63].includes(x) && x <= 2000);
const arriba = (I, lista = OCPD_CASA) => lista.find((x) => x >= I - 1e-9);
const abajo = (I, lista = OCPD_CASA) => [...lista].reverse().find((x) => x <= I);
/* ---------- Tabla 250-122 (p. 151) ---------- */
const TIERRA_CU = [[15, "14"], [20, "12"], [60, "10"], [100, "8"], [200, "6"], [300, "4"], [400, "2"], [500, "2"], [600, "1"], [800, "1/0"], [1000, "2/0"], [1200, "3/0"], [1600, "4/0"], [2000, "250"], [2500, "350"], [3000, "400"], [4000, "500"], [5000, "700"], [6000, "800"]];
const TIERRA_AL = [[200, "4"], [300, "2"], [400, "1"], [500, "1/0"], [600, "2/0"], [800, "3/0"], [1000, "4/0"], [1200, "250"], [1600, "350"], [2000, "400"], [2500, "600"], [3000, "600"], [4000, "750"], [5000, "1200"], [6000, "1200"]];
const tierraDe = (ocpd, T = TIERRA_CU) => { const x = T.find(([lim]) => ocpd <= lim); if (!x) throw new Error("fuera de la Tabla 250-122"); return x[1]; };
/* H-183: la columna de aluminio trae «—» en 15, 20, 60 y 100 A (p. 151): ahí la tabla sólo da el tamaño de cobre. */
const tierraMat = (ocpd, mat) => (mat === "aluminio" && ocpd > 100 ? tierraDe(ocpd, TIERRA_AL) : tierraDe(ocpd, TIERRA_CU));
/* ---------- 240-4(d) conductores pequeños de cobre (p. 102) ---------- */
const TOPE_CHICO = { "14": 15, "12": 20, "10": 30 };
/* ---------- Capítulo 10, Tabla 5 (p. 1006-1007), área total con aislamiento, mm² ---------- */
/* Renglón «TW, THW, THHW, THW-2» (la suite lo usa para THW-LS/THHW-LS, equivalencia declarada, H-192). El DOF trae
   «55.68» para 10 AWG: errata (diámetro 4.470 mm → π/4·4.47² = 15.69 mm²; NEC Tabla 5: 15.68). */
const AREA_THW = { "14": 8.968, "12": 11.68, "10": 15.68, "8": 28.19, "6": 46.84, "4": 62.77, "3": 73.16, "2": 86.00, "1": 122.60, "1/0": 143.40, "2/0": 169.30, "3/0": 201.10, "4/0": 239.90, "250": 296.50, "300": 340.70, "350": 384.40, "400": 427.00, "500": 509.70, "600": 627.7, "750": 751.7 };
const AREA_THHN = { "14": 6.258, "12": 8.581, "10": 13.61, "8": 23.61, "6": 32.71, "4": 53.16, "3": 62.77, "2": 74.71, "1": 100.8, "1/0": 119.7, "2/0": 143.4, "3/0": 172.8, "4/0": 208.8, "250": 256.1, "300": 297.3, "350": 338.2, "400": 378.3, "500": 456.3, "600": 559.7, "750": 677.2 };
/* Área del conductor de cobre (mm²) de la propia Tabla 250-122 / 310-15(b)(16), para la razón de 250-122(b). */
const MM2 = { "14": 2.08, "12": 3.31, "10": 5.26, "8": 8.37, "6": 13.3, "4": 21.2, "3": 26.7, "2": 33.6, "1": 42.4, "1/0": 53.5, "2/0": 67.4, "3/0": 85.0, "4/0": 107, "250": 127, "300": 152, "350": 177, "400": 203, "500": 253, "600": 304, "750": 380 };
/* ---------- Capítulo 10, Tabla 4, tubo conduit metálico ligero EMT, área total mm² (p. 1002); Tabla 1 relleno (p. 1001) ---------- */
const EMT = [[16, 196], [21, 343], [27, 556], [35, 968], [41, 1314], [53, 2165], [63, 3783], [78, 5701], [91, 7451], [103, 9521]];
const relleno = (n) => (n === 1 ? 0.53 : n === 2 ? 0.31 : 0.40);
const tuboPara = (areas) => { const s = areas.reduce((a, b) => a + b, 0), r = relleno(areas.length); const t = EMT.find(([, A]) => A * r >= s); if (!t) throw new Error("no cabe en 4\""); return { mm: t[0], area: t[1], ocupado: s }; };
/* ---------- Capítulo 10, Tabla 9 (p. 1011): R y XL en ohm/km, 75 °C, tres conductores en tubo ---------- */
const R_CU_PVC = { "14": 10.2, "12": 6.6, "10": 3.9, "8": 2.56, "6": 1.61, "4": 1.02, "3": 0.82, "2": 0.62, "1": 0.49, "1/0": 0.39, "2/0": 0.33, "3/0": 0.253, "4/0": 0.203, "250": 0.171, "300": 0.144, "350": 0.125, "400": 0.108, "500": 0.089, "600": 0.075, "750": 0.062 };
const R_CU_ACERO = { "14": 10.2, "12": 6.6, "10": 3.9, "8": 2.56, "6": 1.61, "4": 1.02, "3": 0.82, "2": 0.66, "1": 0.52, "1/0": 0.39, "2/0": 0.33, "3/0": 0.259, "4/0": 0.207, "250": 0.177, "300": 0.148, "350": 0.128, "400": 0.115, "500": 0.095, "600": 0.082, "750": 0.069 };
const R_AL_PVC = { "6": 2.66, "4": 1.67, "3": 1.31, "2": 1.05, "1": 0.82, "1/0": 0.66, "2/0": 0.52, "3/0": 0.43, "4/0": 0.33, "250": 0.279, "300": 0.233, "350": 0.200, "400": 0.177, "500": 0.141, "600": 0.118, "750": 0.095 };
const X_ACERO = { "14": 0.240, "12": 0.223, "10": 0.207, "8": 0.213, "6": 0.210, "4": 0.197, "3": 0.194, "2": 0.187, "1": 0.187, "1/0": 0.180, "2/0": 0.177, "3/0": 0.171, "4/0": 0.167, "250": 0.171, "300": 0.167, "350": 0.164, "400": 0.161, "500": 0.157, "600": 0.157, "750": 0.157 };
const X_CASA = 0.19;   // criterio de la casa (index.html X_KM): reactancia fija «del orden de 0.19-0.20 en acero»
/* ---------- Tabla 430-250 (p. 442-443), motores trifásicos de inducción, amperes ---------- */
/* Columnas 230 V y 460 V. El DOF trae «44» en 10 hp/575 V (errata, no se usa esa columna). */
const T430_250 = { /* hp: [kW de la tabla, 230 V, 460 V] */
  0.5: [0.37, 2.2, 1.1], 0.75: [0.56, 3.2, 1.6], 1: [0.75, 4.2, 2.1], 1.5: [1.12, 6, 3], 2: [1.5, 6.8, 3.4], 3: [2.25, 9.6, 4.8],
  5: [3.75, 15.2, 7.6], 7.5: [5.6, 22, 11], 10: [7.5, 28, 14], 15: [11.2, 42, 21], 20: [14.9, 54, 27], 25: [18.7, 68, 34],
  30: [22.4, 80, 40], 40: [29.8, 104, 52], 50: [37.3, 130, 65], 60: [44.8, 154, 77], 75: [56, 192, 96], 100: [75, 248, 124],
  125: [93, 312, 156], 150: [112, 360, 180], 200: [150, 480, 240],
};
/* ---------- Tabla 430-52 (p. 422): interruptor de tiempo inverso 250 % de la corriente a plena carga; Exc. 1: valor
   normalizado inmediato superior ---------- */
const PCT_MOTOR = 2.5;

/* ============ selección de conductor «como la casa» (criterios declarados) ============ */
/* Reglas: (1) 210-19(a)(1)/215-2(a)(1)/430-22: carga continua al 125 %; la casa exige base·ft·fg ≥ 1.25·I (compone los
   factores con el 125 %, más conservador que la letra). (2) caída de tensión: recomendación de la nota 4 de 210-19
   (3 % derivado, 5 % acumulado) aplicada como criterio duro de la casa, con la Ze = R·fp + X·senφ de la nota 2 de la
   Tabla 9. (3) 240-4(b): siguiente normalizado sin rebasar la ampacidad salvo el redondeo ≤ 800 A, no en motores.
   (4) Tabla 430-52: 250 % + Exc. 1 en motores. (5) 240-4(d). (6) Tabla 250-122. (7) Tabla 1/4/5 del Cap. 10 con
   3 fases + neutro (la casa cuenta neutro en todo circuito trifásico, H-191) + tierra. */
function sel(o) {
  const { I, V, ph, L, fp, mat = "cobre", ais = "thw", tempAmb = 40, nCond = 3, dvMax = 3, continua = true, motor = false, Idis: IdisIn, neutro = true, R = null, X = X_CASA, ocpdLista = OCPD_CASA } = o;
  const AMP = mat === "aluminio" ? AMP75_AL : AMP75_CU, AREAS = ais === "thhn" ? AREA_THHN : AREA_THW;
  const RT = R || (mat === "aluminio" ? R_AL_PVC : R_CU_PVC);
  const ft = fTemp(tempAmb), fg = fGrupo(nCond);
  const Idis = IdisIn ?? I * (continua ? 1.25 : 1);
  const sen = Math.sqrt(1 - fp * fp), k = ph === 3 ? Math.sqrt(3) : 2;
  const dvDe = (a) => (k * I * (L / 1000) * (RT[a] * fp + (typeof X === "number" ? X : X[a]) * sen)) / V * 100;
  let awg = ORD.find((a) => AMP[a] && AMP[a] * ft * fg >= Idis), rige = "ampacidad", paralelo = 1;
  if (!awg) awg = "750";
  let dv = dvDe(awg);
  if (dv > dvMax) { rige = "caída de tensión"; awg = ORD.slice(ORD.indexOf(awg)).find((a) => AMP[a] && dvDe(a) <= dvMax) || "750"; dv = dvDe(awg); }
  if (awg === "750") {
    const ampU = AMP["750"] * ft * fg;
    paralelo = Math.max(1, Math.ceil(Idis / ampU), Math.ceil(dvDe("750") / dvMax - 1e-9));
    if (paralelo > 1) awg = ORD.slice(ORD.indexOf("1/0")).find((a) => AMP[a] && AMP[a] * ft * fg * paralelo >= Idis && dvDe(a) / paralelo <= dvMax) || "750";
  }
  const ampBase = AMP[awg], ampCorr = ampBase * ft * fg * paralelo;
  let ocpd = arriba(Idis, ocpdLista);
  if (ocpd > ampCorr && !motor) { const ab = abajo(ampCorr, ocpdLista); ocpd = ab >= Idis ? ab : arriba(ampCorr, ocpdLista); }
  if (motor) ocpd = Math.max(ocpd, arriba(I * PCT_MOTOR, ocpdLista));
  if (!motor && TOPE_CHICO[awg] && ocpd > TOPE_CHICO[awg]) ocpd = TOPE_CHICO[awg];
  const tierra = tierraMat(ocpd, mat);
  const cond = []; for (let i = 0; i < (ph === 3 ? 3 : 2); i++) cond.push(AREAS[awg]); if (neutro && ph === 3) cond.push(AREAS[awg]); cond.push(AREAS[tierra]);
  const tubo = tuboPara(cond);
  return { I, Idis, ft, fg, awg, idx: ORD.indexOf(awg), ampBase, ampCorr, dv: dvDe(awg) / paralelo, ocpd, tierra, tierraIdx: ORD.indexOf(tierra), tubo, paralelo, rige };
}
const r = (x, d = 4) => +Number(x).toFixed(d);
const out = [];
const fila = (id, valor, nota) => { out.push([id, valor, nota]); };

/* ===================== CM.elec.1 · motor 15 kW, 220 V, 3F, fp 0.85, L 30 m, 40 °C, 3 portadores, THW-LS ===================== */
{
  const I = 15000 / (Math.sqrt(3) * 220 * 0.85);                  // criterio de la casa (H-178): I = P/(√3·V·fp), sin eficiencia
  const c = sel({ I, V: 220, ph: 3, L: 30, fp: 0.85, motor: true });
  fila("CM.elec.1.a", r(I, 2), "I = 15000/(√3·220·0.85)");
  fila("CM.elec.1.b", r(c.Idis, 2), "Idis = 1.25·I (430-22)");
  fila("CM.elec.1.c", c.ampBase, "Tabla 310-15(b)(16) 4 AWG 75 °C");
  fila("CM.elec.1.d", c.ft, "Tabla 310-15(b)(2)(a) 36-40 °C");
  fila("CM.elec.1.e", c.fg, "Tabla 310-15(b)(3)(a) ≤ 3");
  fila("CM.elec.1.f", r(c.ampCorr, 2), "85·0.88·1.00");
  fila("CM.elec.1.g", c.idx, `awg ${c.awg} (índice en 14…750)`);
  fila("CM.elec.1.h", r(c.dv, 3), "caída % con R 1.02 (PVC), X 0.19, senφ 0.5268");
  fila("CM.elec.1.i", c.ocpd, "250 %·46.31 = 115.8 → 125 (Tabla 430-52 + Exc. 1)");
  fila("CM.elec.1.j", c.tierraIdx, `tierra ${c.tierra} (Tabla 250-122, ≤ 200 A)`);
  fila("CM.elec.1.k", r(c.tubo.ocupado, 2), "4·62.77 + 46.84 (Tabla 5 THW)");
  fila("CM.elec.1.l", c.tubo.area, `EMT ${c.tubo.mm} mm (Tabla 4; relleno 40 % Tabla 1)`);
  /* fase2:H-178 · decisión 2: hp de placa; con sólo kW, hp normalizado inmediato superior y corriente de Tabla 430-250.
     15 kW ↔ 20 hp según la equivalencia del prompt de Fase 1 (renglón «14.9 kW · 20 hp» de la tabla). NOTA en
     elec.pendientes.md: la lectura estricta de la decisión 2 (15/0.746 = 20.1 hp → 25 hp → 68 A) da otro resultado. */
  const I2 = T430_250[20][1];
  const c2 = sel({ I: I2, V: 220, ph: 3, L: 30, fp: 0.85, motor: true });
  fila("CM.elec.1.m", I2, "Tabla 430-250, 20 hp, 230 V (p. 443)");
  fila("CM.elec.1.n", r(c2.Idis, 2), "1.25·54 (430-22)");
  fila("CM.elec.1.o", c2.ocpd, "250 %·54 = 135 → 150 (Tabla 430-52 + Exc. 1)");
  fila("CM.elec.1.p", r(c2.dv, 3), `caída % con I 54 A, ${c2.awg} AWG`);
  /* Lectura estricta de la decisión 2 (sólo informativa, no va a la hoja): */
  const c3 = sel({ I: T430_250[25][1], V: 220, ph: 3, L: 30, fp: 0.85, motor: true });
  fila("(info) 15 kW → 25 hp", `${T430_250[25][1]} A, Idis ${r(c3.Idis, 1)}, ${c3.awg} AWG, ocpd ${c3.ocpd}`, "si el dueño lee «inmediato superior» al pie de la letra");
}

/* ===================== CM.elec.2 · alumbrado 9.5 kW, 127 V, 1F, fp 0.95, L 40 m ===================== */
{
  const I = 9500 / (127 * 0.95);
  const c = sel({ I, V: 127, ph: 1, L: 40, fp: 0.95 });
  fila("CM.elec.2.a", r(I, 2), "I = 9500/(127·0.95)");
  fila("CM.elec.2.b", r(c.Idis, 2), "1.25·I (210-19(a)(1))");
  const dv2awg = 2 * I * 0.040 * (R_CU_PVC["2"] * 0.95 + X_CASA * Math.sqrt(1 - 0.95 * 0.95)) / 127 * 100;
  fila("CM.elec.2.c", c.idx, `awg ${c.awg}, rige ${c.rige} (por ampacidad bastaba 2 AWG: 115·0.88 = 101.2 ≥ 98.43, pero daría ${r(dv2awg, 3)} % > 3 %)`);
  fila("CM.elec.2.d", r(c.dv, 3), "caída % con R 0.49 (1 AWG, PVC), X 0.19, senφ 0.3122, k = 2");
  fila("CM.elec.2.e", c.ocpd, "arriba(98.42) = 100 ≤ 130·0.88");
  fila("CM.elec.2.f", c.tierraIdx, `tierra ${c.tierra} (Tabla 250-122, ≤ 100 A)`);
  fila("CM.elec.2.g", r(c.tubo.ocupado, 2), "2·122.60 + 28.19");
  fila("CM.elec.2.h", c.tubo.area, `EMT ${c.tubo.mm} mm`);
  /* fase2:H-182 · 250-122(b): fase subió de 2 AWG (33.6 mm²) a 1 AWG (42.4 mm²) por caída → tierra 8.37·42.4/33.6 */
  const areaT = MM2["8"] * MM2["1"] / MM2["2"];
  const tierraB = ORD.find((a) => MM2[a] >= areaT);
  fila("CM.elec.2.i", ORD.indexOf(tierraB), `tierra ≥ ${r(areaT, 2)} mm² → ${tierraB} AWG (250-122(b))`);
  /* fase2:H-190 · Tabla 9 columna de tubo de ACERO (EMT): R 0.52, XL 0.187 para 1 AWG */
  const cA = sel({ I, V: 127, ph: 1, L: 40, fp: 0.95, R: R_CU_ACERO, X: X_ACERO });
  fila("CM.elec.2.j", r(cA.dv, 3), `caída % con R 0.52 y XL 0.187 (acero), ${cA.awg} AWG`);
}

/* ===================== CM.elec.3 · alimentador del proyecto de regresión: motor 15 kW + alumbrado 9.5 kW, 3F4H-220, trafo 300 kVA Z 4 %, Ltablero 30 m, fp objetivo 0.95 ===================== */
{
  const kVAm = 15 / 0.85, kVAa = 9.5 / 0.95;
  const conectada = kVAm + kVAa, extra = 0.25 * kVAm, demanda = kVAm + kVAa + extra;   // 430-24(1)+(2); alumbrado al 100 % (art. 220)
  const Itab = demanda * 1000 / (Math.sqrt(3) * 220);
  const IdisAlim = Itab * (demanda + 0.25 * kVAa) / demanda;                             // 215-2(a)(1): 125 % de la carga continua no motor
  const a = sel({ I: Itab, V: 220, ph: 3, L: 30, fp: 0.95, Idis: IdisAlim, dvMax: 2 });
  fila("CM.elec.3.a", r(conectada, 3), "15/0.85 + 9.5/0.95");
  fila("CM.elec.3.b", r(demanda, 3), "17.647 + 10 + 0.25·17.647 (430-24)");
  fila("CM.elec.3.c", r(extra, 3), "0.25·17.647");
  fila("CM.elec.3.d", r(Itab, 2), "kVA·1000/(√3·220)");
  fila("CM.elec.3.e", r(IdisAlim, 2), "Itab·(32.059 + 2.5)/32.059");
  fila("CM.elec.3.f", a.idx, `alimentador ${a.awg} AWG`);
  fila("CM.elec.3.g", r(a.ampCorr, 2), "115·0.88");
  fila("CM.elec.3.h", r(a.dv, 3), "caída % con R 0.62, X 0.19, senφ 0.3122");
  fila("CM.elec.3.i", a.ocpd, "arriba(90.69) = 100 ≤ 101.2");
  fila("CM.elec.3.j", a.tierraIdx, `tierra ${a.tierra}`);
  fila("CM.elec.3.k", r(a.tubo.ocupado, 2), "4·86.00 + 28.19");
  fila("CM.elec.3.l", a.tubo.area, `EMT ${a.tubo.mm} mm`);
  const ocpdMotor = 125;   // CM.elec.1.i
  fila("CM.elec.3.m", Math.max(a.ocpd, ocpdMotor), "principal = mayor(alim.ocpd, ocpd del motor mayor) · criterio de la casa (H-188)");
  const Icc = 300 * 1000 / (Math.sqrt(3) * 220) / 0.04;
  fila("CM.elec.3.n", r(Icc, 0), "Icc = S/(√3·V·Z) bus infinito (memoria)");
  fila("CM.elec.3.o", [10, 14, 18, 22, 25, 35, 42, 65, 100].find((x) => x * 1000 >= Icc), "lista de kAIC de la casa");
  /* fase2:H-188 · 430-63: principal ≥ protección del motor (430-52) + la otra carga (alumbrado 10 kVA a 220 V 3F) */
  const Iotra = kVAa * 1000 / (Math.sqrt(3) * 220);
  fila("CM.elec.3.p", arriba(ocpdMotor + Iotra), `125 + ${r(Iotra, 2)} = ${r(ocpdMotor + Iotra, 2)} → normalizado (430-63); con el ramal de H-178 (150 A) sería ${arriba(150 + Iotra)}`);
  fila("CM.elec.3.q", 0, "balanceo: motor 3F a tercios; alumbrado 1F repartido en 3 circuitos iguales → desbalance 0 %");
}

/* ===================== CM.elec.4 · Tabla 250-122 directa ===================== */
for (const [id, A] of [["CM.elec.4.a", 300], ["CM.elec.4.b", 400], ["CM.elec.4.c", 100], ["CM.elec.4.d", 1000], ["CM.elec.4.e", 2500], ["CM.elec.4.f", 200]]) {
  const t = tierraDe(A); fila(id, ORD.indexOf(t), `tierraDe(${A}) = ${t} (p. 151)`);
}
/* H-183: renglones arriba de 2000 A (kcmil como número) y columna de aluminio. */
fila("CM.elec.4.g", Number(tierraDe(5000)), "5000 A → 355 mm² = 700 kcmil (p. 151)");
fila("CM.elec.4.h", Number(tierraDe(6000)), "6000 A → 405 mm² = 800 kcmil (p. 151)");
fila("CM.elec.4.i", ORD.indexOf(tierraMat(400, "aluminio")), `aluminio 400 A → ${tierraMat(400, "aluminio")} (p. 151)`);
fila("CM.elec.4.j", ORD.indexOf(tierraMat(200, "aluminio")), `aluminio 200 A → ${tierraMat(200, "aluminio")} (p. 151)`);
fila("CM.elec.4.k", Number(tierraMat(2000, "aluminio")), `aluminio 2000 A → ${tierraMat(2000, "aluminio")} kcmil (p. 151)`);
fila("CM.elec.4.l", ORD.indexOf(tierraMat(100, "aluminio")), `aluminio 100 A: «—» en la columna de aluminio → cobre ${tierraMat(100, "aluminio")} (p. 151)`);

/* ===================== CM.elec.5 · equipo HVAC con MOP (fase2:H-177) ===================== */
{
  /* 40VMA-240: 20 TR · kWe estimado 0.95 kW/TR = 19 kW · 3F 220 V fp 0.85 (reglas de la casa en elecOf) */
  const fla = Math.round(19000 / (Math.sqrt(3) * 220 * 0.85) * 10) / 10, rla = Math.round(fla * 0.85 * 10) / 10;
  const mop = arriba(rla * 1.75);
  const hoy = sel({ I: 19000 / (Math.sqrt(3) * 220 * 0.85), V: 220, ph: 3, L: 45, fp: 0.85, motor: true }).ocpd;
  fila("CM.elec.5.a", 1, `40VMA-240: FLA ${fla}, RLA ${rla}, MOP 175 % = ${r(rla * 1.75, 1)} → ${mop} A (440-22(a)); protección hoy ${hoy} A → indicador ocpd ≤ MOP`);
  const fla2 = Math.round(1900 / (220 * 0.9) * 10) / 10, rla2 = Math.round(fla2 * 0.85 * 10) / 10, mop2 = arriba(rla2 * 1.75);
  const hoy2 = sel({ I: 1900 / (220 * 0.9), V: 220, ph: 1, L: 45, fp: 0.9, motor: true }).ocpd;
  fila("CM.elec.5.b", 1, `40MBC-24: FLA ${fla2}, RLA ${rla2}, MOP → ${mop2} A; hoy ${hoy2} A → indicador ocpd ≤ MOP`);
  fila("(info) MOPs", `${mop} / ${mop2}`, "valores de mop que la hoja captura en la fila");
}

/* ===================== CM.elec.6 · aislamiento y canalización, I 100 A, 220 V 3F, L 25, fp 0.9, 40 °C ===================== */
{
  const a = sel({ I: 100, V: 220, ph: 3, L: 25, fp: 0.9, ais: "thw" }), b = sel({ I: 100, V: 220, ph: 3, L: 25, fp: 0.9, ais: "thhn" });
  fila("CM.elec.6.a", r(a.tubo.ocupado, 2), "4·143.40 + 46.84 (THW)");
  fila("CM.elec.6.b", a.tubo.area, `EMT ${a.tubo.mm} mm`);
  fila("CM.elec.6.c", r(b.tubo.ocupado, 2), "4·119.7 + 32.71 (THHN)");
  fila("CM.elec.6.d", b.tubo.area, `EMT ${b.tubo.mm} mm`);
  fila("CM.elec.6.e", a.idx, `awg ${a.awg}: 1.25·100 = 125 ≤ 150·0.88 = 132`);
  fila("CM.elec.6.f", a.ocpd, "arriba(125) = 125 ≤ 132");
}

/* ===================== CM.elec.7 · aluminio ===================== */
{
  const a = sel({ I: 100, V: 220, ph: 3, L: 5, fp: 0.9, mat: "aluminio", tempAmb: 30 });
  fila("CM.elec.7.a", a.idx, `awg ${a.awg} Al: 125 A ≤ 135`);
  fila("CM.elec.7.b", a.ampBase, "Tabla 310-15(b)(16) aluminio 75 °C, 2/0");
  fila("CM.elec.7.d", a.tierraIdx, `tierra ${a.tierra} de aluminio (ocpd ${a.ocpd} A, Tabla 250-122 p. 151)`);
  fila("CM.elec.7.c", ORD.indexOf("6"), "I 15 A aluminio: mínimo 6 AWG (Tabla 310-106(a), p. 216; Tabla 310-15(b)(16) sin renglón < 6 AWG en Al)");
}

/* ===================== CM.elec.8 · > 800 A, 240-4(c) ===================== */
{
  const c = sel({ I: 660, V: 440, ph: 3, L: 5, fp: 0.9, dvMax: 2 });
  fila("CM.elec.8.a", r(c.ampCorr, 2), `${c.paralelo} × ${c.awg}: 475·0.88·${c.paralelo}`);
  fila("CM.elec.8.b", c.paralelo, "conductores por fase (310-10(h))");
  fila("CM.elec.8.c", 1, `240-4(c): con protección > 800 A la ampacidad debe ser ≥ la protección; hoy ocpd ${c.ocpd} > ${r(c.ampCorr, 0)} → indicador ocpd ≤ ampCorr`);
  const d = sel({ I: 1900, V: 440, ph: 3, L: 10, fp: 0.9, dvMax: 2, ocpdLista: OCPD });
  fila("CM.elec.8.d", d.ocpd, `Idis 2375 → normalizado 240-6(a) ${d.ocpd} (${d.paralelo} × ${d.awg}, ampCorr ${r(d.ampCorr, 0)}); hoy la lista se corta en 2000`);
}

/* ===================== CM.elec.9 · 220-44 contactos 27 kW fp 0.9 = 30 kVA ===================== */
{
  const kVA = 27 / 0.9, dem = Math.min(10, kVA) + Math.max(0, kVA - 10) * 0.5;
  fila("CM.elec.9.a", r(dem, 3), "10 + 20·0.5 (Tabla 220-44, p. 69)");
  fila("CM.elec.9.b", r(dem, 3), "kVAdemanda = sólo contactos, sin motores");
}

/* ===================== CM.elec.10 · 240-4(d) ===================== */
{
  const a = sel({ I: 17, V: 220, ph: 1, L: 5, fp: 1, tempAmb: 30 });
  fila("CM.elec.10.a", a.ocpd, `${a.awg} AWG, Idis 21.25 → arriba 25, tope 20 (240-4(d))`);
  fila("CM.elec.10.b", sel({ I: 26, V: 220, ph: 1, L: 5, fp: 1, tempAmb: 30 }).ocpd, "10 AWG, Idis 32.5 → arriba 35, tope 30");
  fila("CM.elec.10.c", a.idx, `awg ${a.awg}`);
  /* 240-4(b): ≤ 800 A se permite el normalizado inmediato superior a la ampacidad cuando ninguno cae entre Idis y ampCorr */
  const d = sel({ I: 34, V: 220, ph: 3, L: 5, fp: 0.9 });
  fila("CM.elec.10.d", d.ocpd, `${d.awg} AWG ampCorr ${r(d.ampCorr, 1)}, Idis 42.5: arriba 45 > 44; abajo 40 < 42.5 → normalizado superior a la ampacidad = 45 (240-4(b))`);
}

/* ===================== CM.elec.11 · factores de las Tablas 310-15(b)(2)(a) y (3)(a) ===================== */
{
  const a = sel({ I: 67.2, V: 220, ph: 3, L: 5, fp: 0.9, nCond: 6 });
  fila("CM.elec.11.a", a.idx, `awg ${a.awg}: Idis 84; 2 AWG 115·0.88·0.80 = 80.96 < 84; 1 AWG 130·0.88·0.80 = 91.52`);
  fila("CM.elec.11.b", a.fg, "4-6 conductores → 0.80");
  fila("CM.elec.11.c", fGrupo(9), "7-9 → 0.70");
  fila("CM.elec.11.d", fTemp(50), "46-50 °C → 0.75");
  fila("CM.elec.11.e", fTemp(65), "61-65 °C → 0.47 (hoy la suite da 0.33)");
  fila("CM.elec.11.f", fTemp(20), "16-20 °C → 1.11 (hoy la suite da 1.00)");
  fila("CM.elec.11.g", r(a.ampCorr, 2), "130·0.88·0.80");
}

/* ===================== CM.elec.12 · corriente de falla (memoria) ===================== */
{
  fila("CM.elec.12.a", r(75000 / 220 / 0.02, 0), "1F: Icc = S/(V·Z) = 75000/220/0.02 (hoy la suite divide entre √3)");
  const Icc = 2500 * 1000 / (Math.sqrt(3) * 220) / 0.0575;
  fila("CM.elec.12.b", r(Icc, 0), "3F 2500 kVA Z 5.75 %");
  fila("CM.elec.12.c", 1, `110-9: capacidad interruptiva ≥ corriente de falla (${r(Icc / 1000, 1)} kA); hoy la lista se tope en 100 kA → indicador`);
}

/* ===================== CM.elec.13 · 3F3H-440 sin neutro, motor 22 kW 440 V (fase2:H-191) ===================== */
{
  const I = 22000 / (Math.sqrt(3) * 440 * 0.85);
  const con = sel({ I, V: 440, ph: 3, L: 20, fp: 0.85, motor: true }), sin = sel({ I, V: 440, ph: 3, L: 20, fp: 0.85, motor: true, neutro: false });
  fila("CM.elec.13.a", r(I, 2), "22000/(√3·440·0.85)");
  fila("CM.elec.13.b", con.idx, `awg ${con.awg}`);
  fila("CM.elec.13.c", con.ocpd, "250 %·33.96 = 84.9 → 90");
  fila("CM.elec.13.d", r(sin.tubo.ocupado, 2), `3·28.19 + 28.19 sin neutro (hoy ${r(con.tubo.ocupado, 2)} con neutro)`);
  fila("CM.elec.13.e", sin.tubo.area, `EMT ${sin.tubo.mm} mm sin neutro (hoy ${con.tubo.area})`);
}

for (const [id, v, nota] of out) console.log(`${id.padEnd(14)} ${String(v).padEnd(12)} ${nota}`);
