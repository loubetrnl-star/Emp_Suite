#!/usr/bin/env node
/* Casos calculados a mano · motor CARGA TÉRMICA (`load`, v3) · Fase 1, rev 2.9.24.
   Cálculo INDEPENDIENTE: no carga index.html ni pruebas.mjs. Imprime los esperados y, con --csv, escribe load.csv.
   Uso: node parches/casos-a-mano/load.calc.mjs [--csv]

   Fuentes (carácter entre corchetes):
   · Psicrometría: ASHRAE Handbook—Fundamentals 2017, cap. 1, ec. 3 (presión barométrica por altitud), ec. 5-6 (presión de
     saturación sobre agua líquida, Hyland-Wexler), ec. 20 y 22 (razón de humedad) y ec. 33/35 (razón de humedad desde bulbo
     húmedo), tal como las reproduce PsychroLib (Meyer y Thevenard, 2019, licencia MIT; constantes cotejadas el 23-sep-2026):
     https://raw.githubusercontent.com/psychrometrics/psychrolib/master/src/js/psychrolib.js  [secundaria]
     (index.html cita la edición 2021; el texto de ASHRAE no está en parches/normas-texto).
   · ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s), parches/normas-texto/ASHRAE-62.1-2016_Addendum-s_Tabla-6.2.2.1.txt:
     Office space Rp 2.5 L/s·pers / Ra 0.3 L/s·m²; Warehouses 5 / 0.3; Classrooms (9+) 5 / 0.6; General manufacturing 5 / 0.9.
     Ec. 6.2.2.1 Vbz = Rp·Pz + Ra·Az; 1 L/s = 3.6 m³/h.  [primaria]
   · Corrección CLTD por sitio (H-120): ASHRAE Fundamentals 1997 cap. 28, reproducida por el curso CED M06-004
     (parches/normas-texto/ASHRAE-1997_CLTD-correccion_extracto-curso-CED.txt): CLTDc = CLTD + (78 − TR) + (TM − 85) °F,
     TM = Tmax − DR/2. En SI con la conversión exacta: (25.556 − tr) + (tm − 29.444) K.  [secundaria]
     OJO: la tabla DET de la suite se declara «Carrier» (sin edición); aplicarle la corrección de la tabla CLTD de ASHRAE
     supone la misma condición base (78/85 °F). La Tabla 20A de Carrier no está en texto: queda por ratificar (PLAN-CRITICOS §4.8).
   · Clima: SITES de index.html:3115 (Tijuana, ASHRAE 2021 WMO 760013) y 3125 (Mexicali, WMO 760053), decisión del dueño.
   · Criterios de la casa (index.html, rev 2.9.24), transcritos como DATOS; la aritmética es propia:
     P 2982-2987 (70/45 W por persona, 0.34/0.83, Tab.45 30 m³/h·pers y 1.8 m³/h·m², 3517 W/TR, COLOR_B 0.78, 16 h);
     HAP 2989-2990 (ventilador 2.6 %, conductos 3 %, margen 5 %, BF 0.15, particiones 12 %·1.5, piso 10 %·0.8);
     DET_SHADE 7.8 / DET_ROOF_SUN 23.9 (2992); almacenamiento SOLAR_ST/LIGHT_ST/PEOPLE_ST/EQUIP_ST (2994-2996);
     diversidades SPACES (2997-3013); materiales RAW.mats (874: light_block_20 K 0.849 · 176 kg/m²; roof_concrete_insul
     0.55 · 320; glass_dgu 2.8 · 25) y SHGC (876: glass_dgu 0.70); DET_SUN (877) y SOLAR (878), declaradas «Carrier» sin
     edición ni tabla; SUN_H/ROOF_H (3243-3253), DRANGE_H (3262), DET_PEAK (3290), atraso 0.6/0.4 (3273) y 0.55/0.45 (3330):
     estimación propia de EMP (H-122); masa por m² de piso con vidrio a 25 kg/m² (3352) y umbrales 150/350 (3353);
     estratificación (3368); ADP sobre la recta ESHF con pendiente 1.006·(1−f)/(f·2450) (3083), acotado a [−6, ti−0.5]
     (3086), pisos 1.7/4.4 °C (3076, 3483-3489); salida del serpentín ADP + BF·(ti − ADP) (3491); ΔT mínimo 6 K (3500);
     CFM = m³/h ÷ 1.699 (3511); barrido 8–18 h con pico ≥ 0.998·máx y la hora más cercana a las 15 (3546-3548);
     dos casos ASHRAE para control de humedad y modos «todo»/«oa» (10594-10693, decisiones del dueño rev 2.9.20/2.9.21).
   · Variantes FASE 2 (opciones de `zona()`): pisoDW=false (H-123: ΔW = máx(0, real)), particiones=false (H-121: sin
     ganancias no capturadas), cltd=true (H-120), bdZona=false (H-141, decisión del dueño §4.1: la diversidad del edificio
     sólo en planta), rp621=true (H-157: Rp de 62.1 en almacén). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ---------------- Psicrometría (ASHRAE Fundamentals 2017 cap. 1 vía PsychroLib) ---------------- */
const pAtm = (z) => 101.325 * Math.pow(1 - 2.25577e-5 * z, 5.2559);                        // kPa · ec. 3
const pws = (t) => { const T = t + 273.15;                                                   // kPa · ec. 5-6 (agua líquida)
  return Math.exp(-5.8002206e3 / T + 1.3914993 - 4.8640239e-2 * T + 4.1764768e-5 * T * T - 1.4452093e-8 * T ** 3 + 6.5459673 * Math.log(T)) / 1000; };
const Wpw = (pw, p) => 0.621945 * pw / (p - pw);                                             // kg/kg · ec. 20
const Wsat = (t, p) => Wpw(pws(t), p);
const Wrh = (t, rh, p) => Wpw(rh * pws(t), p);                                               // ec. 22 + 20
const Wwb = (t, twb, p) => ((2501 - 2.326 * twb) * Wsat(twb, p) - 1.006 * (t - twb)) / (2501 + 1.86 * t - 4.186 * twb); // ec. 33/35
/* Punto de rocío de una razón de humedad: Newton sobre Wsat (método propio; la suite usa bisección). */
function tRocio(W, p) {
  let t = 10;
  for (let k = 0; k < 60; k++) { const f = Wsat(t, p) - W, d = (Wsat(t + 1e-4, p) - Wsat(t - 1e-4, p)) / 2e-4, dt = f / d; t -= dt; if (Math.abs(dt) < 1e-12) break; }
  return t;
}

/* ---------------- Datos de la casa (index.html, transcritos) ---------------- */
const TI = 24, RH_I = 0.5;
const OCC_S = 70, OCC_L = 45, QS0 = 0.34, QL0 = 0.83, OA_PERS = 30, OA_M2 = 1.8, W_TON = 3517, COLOR_B = 0.78;
const FAN = 0.026, DUCT = 0.03, SAFETY = 0.05, BF = 0.15, PART_FRAC = 0.12, PART_U = 1.5, FLOOR_FRAC = 0.1, FLOOR_U = 0.8;
const DET_SHADE = 7.8, DET_ROOF_SUN = 23.9;
const SOLAR_ST = { 12: { light: .72, medium: .58, heavy: .48 }, 16: { light: .8, medium: .66, heavy: .55 }, 24: { light: .88, medium: .78, heavy: .7 } };
const LIGHT_ST = { 12: { light: .55, medium: .5, heavy: .45 }, 16: { light: .75, medium: .7, heavy: .65 }, 24: { light: 1, medium: .95, heavy: .9 } };
const PEOPLE_ST = { 12: .85, 16: .9, 24: .95 }, EQUIP_ST = { 12: .85, 16: .9, 24: 1 };
const SPACES = {
  office: { Rp: 2.5, Ra: .3, div: { people: .9, lights: .95, equip: .9 } },
  classroom: { Rp: 5, Ra: .6, div: { people: .95, lights: .95, equip: .9 } },
  warehouse: { Rp: 2.5, Ra: .3, div: { people: .6, lights: .9, equip: .5 } },
  production: { Rp: 5, Ra: .9, div: { people: .95, lights: 1, equip: .85 } },
  cleanroom: { Rp: 2.5, Ra: .3, div: { people: 1, lights: 1, equip: 1 } },
};
const RP_621 = { office: 2.5, classroom: 5, warehouse: 5, production: 5 };                // ASHRAE 62.1-2016 Tabla 6.2.2.1 (L/s·pers)
const MAT = { light_block_20: { K: 0.849, w: 176 }, roof_concrete_insul: { K: 0.55, w: 320 }, glass_dgu: { K: 2.8, w: 25 } };
const SHGC = { glass_dgu: 0.7 };
const DET_SUN = { N: 7.8, NE: 7.8, E: 7.8, SE: 8.9, S: 14.4, SW: 25, W: 22.2, NW: 18.3 };
const SOLAR = { N: 120, NE: 520, E: 650, SE: 580, S: 400, SW: 620, W: 680, NW: 480 };
const HORAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const SUN_H = {
  NE: [1.00, .82, .55, .28, .16, .14, .13, .12, .11, .10, .08], E: [1.00, .95, .74, .44, .21, .17, .16, .15, .14, .12, .10],
  SE: [.72, .92, 1.00, .93, .70, .43, .25, .21, .19, .16, .12], S: [.30, .52, .76, .93, 1.00, .93, .76, .52, .34, .22, .14],
  SW: [.19, .21, .25, .43, .70, .93, 1.00, .96, .82, .55, .26], W: [.14, .15, .16, .18, .22, .46, .74, .93, 1.00, .86, .44],
  NW: [.11, .12, .13, .15, .18, .22, .40, .68, .92, 1.00, .58], N: [.42, .55, .68, .80, .88, .84, .78, .70, .62, .55, .48],
};
const ROOF_H = [.38, .56, .74, .89, 1.00, 1.00, .93, .80, .64, .46, .28];
const DRANGE_H = [.71, .57, .43, .28, .15, .07, .02, .01, .00, .04, .12];
const DET_PEAK = { N: 9.5, NE: 14.5, E: 18.5, SE: 17.0, S: 15.5, SW: 25.5, W: 23.5, NW: 19.0 };
const ORI = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const SITIOS = {
  tijuana: { db: 32.8, wb: 17.5, alt: 149, range: 9.2, dp: 19.2, dpHR: 14.2, dpDB: 22.8 },
  mexicali: { db: 44.0, wb: 24.8, alt: 23, range: 14.2, dp: 26.2, dpHR: 21.7, dpDB: 37.0 },
};
const M3H_CFM = 1.699;                                                        // criterio de la casa (exacto: 1.699011)

const sitio = (key) => { const s = SITIOS[key], p = pAtm(s.alt), ratio = p / 101.325;
  return { ...s, key, p, ratio, caso: "enfriamiento", Wfijo: null, wb: Math.min(s.wb, s.db - .5), QS: QS0 * ratio, QL: QL0 * ratio }; };
const sitioDes = (s) => ({ ...s, caso: "deshumidificacion", db: s.dpDB, wb: Math.min(s.dp, s.dpDB - .5), range: 0, Wfijo: s.dpHR });
/* H-120 cerrado en la rev 2.9.24 (MOTOR_VER.load 4): la corrección CLTD por sitio ya es la regla vigente. */
const HOY = { pisoDW: true, particiones: true, cltd: true, bdZona: true, rp621: false };

/* ADP: punto donde la recta del ESHF que pasa por el cuarto (ti, Wi) toca la saturación, bajando desde el cuarto (el PRIMER
   cruce por debajo de ti). g(t) = Wrecta(t) − Wsat(máx(t, 1.7)) vale < 0 en ti − 0.5; se baja en pasos de 0.05 K hasta que
   g > 0 y se refina el cruce con regula falsi (Illinois). Método propio; la suite usa bisección sobre [−6, ti − 0.5]. Si la
   recta nunca toca la saturación, se reporta el extremo −6 °C (la suite converge ahí y lo declara crítico). */
function adpDe(Wi, eshf, p) {
  const f = Math.min(.999, Math.max(.35, eshf)), s = 1.006 * (1 - f) / (f * 2450);
  const g = (t) => (Wi - s * (TI - t)) - Wsat(Math.max(t, 1.7), p);
  const hi0 = TI - .5, paso = 0.05;
  if (g(hi0) >= 0) throw new Error("ADP: la recta arranca sobre la saturación");
  let t = hi0;
  while (t > -6 && g(t) <= 0) t -= paso;
  if (t <= -6) { if (g(-6) <= 0) return -6; t = -6; }
  let a = t, b = Math.min(t + paso, hi0), ga = g(a), gb = g(b);
  let lado = 0;
  for (let k = 0; k < 200; k++) {
    const c = (a * gb - b * ga) / (gb - ga), gc = g(c);
    if (Math.abs(gc) < 1e-15 || Math.abs(b - a) < 1e-12) return c;
    if (gc * gb < 0) { a = b; ga = gb; b = c; gb = gc; lado = 0; } else { b = c; gb = gc; if (lado === 1) ga /= 2; lado = 1; }
  }
  return b;
}

/* Carga de una zona a una hora (método declarado de la casa, aritmética propia). */
function zona(z, s, hora, op = HOY, bldDiv = 1) {
  const i = HORAS.indexOf(hora), area = z.area, h = z.height, vol = area * h;
  const wm = MAT[z.wallMat || "light_block_20"], rm = MAT[z.roofMat || "roof_concrete_insul"], gm = MAT[z.glassMat || "glass_dgu"], shgc = SHGC[z.glassMat || "glass_dgu"];
  const run = z.runHours || 16, sp = SPACES[z.spaceType || "office"], clean = z.spaceType === "cleanroom";
  const walls = z.walls || {}, glass = z.glass || {}, roof = z.roof || 0;
  const Wo = s.Wfijo != null ? s.Wfijo / 1000 : Wwb(s.db, s.wb, s.p), Wi = Wrh(TI, RH_I, s.p);
  const dWreal = (Wo - Wi) * 1000, dW = op.pisoDW ? Math.max(.5, dWreal) : Math.max(0, dWreal);
  const tExt = (k) => s.db - s.range * DRANGE_H[k], dT = tExt(i) - TI;
  const wallA = ORI.reduce((a, o) => a + (walls[o] || 0), 0), glassA = ORI.reduce((a, o) => a + (glass[o] || 0), 0);
  const wFloor = area > 0 ? (wallA * wm.w + roof * rm.w + glassA * 25) / area : 200;
  const mass = wFloor < 150 ? "light" : wFloor < 350 ? "medium" : "heavy";
  /* Oscilación de temperatura (swing, °C): reduce el almacenamiento solar y de luces (index.html:3354-3356). */
  const swing = Math.max(0, z.swing || 0), swingF = swing <= 0 ? 1 : Math.max(.75, 1 - swing * (mass === "heavy" ? .04 : mass === "medium" ? .03 : .02) * 2.5);
  const stor = { solar: SOLAR_ST[run][mass] * swingF, lights: LIGHT_ST[run][mass] * swingF, people: PEOPLE_ST[run], equip: EQUIP_ST[run] };
  const plenum = z.plenum === true;
  const strat = h <= 3.2 ? 1 : (plenum && h >= 4) ? .7 : h >= 5 ? .75 : h >= 4 ? .85 : .92;
  const bd = op.bdZona ? Math.min(1, Math.max(.5, bldDiv || 1)) : 1;
  /* DET de muro y cubierta: piso de sombra escalado por el ΔT exterior de la hora; sol anclado a la tabla de 16 h. */
  const dTdis = s.db - TI;
  const sombra = (k) => dTdis <= 0 ? DET_SHADE : DET_SHADE * Math.max(0, (tExt(k) - TI) / dTdis);
  const corr = op.cltd ? (25.556 - TI) + ((s.db - s.range / 2) - 29.444) : 0;          // H-120 (fase 2)
  const lag = (o, k) => { const p = SUN_H[o]; return p[Math.max(0, k - 1)] * .6 + p[k] * .4; };
  const detMuro = (o) => {
    const k16 = HORAS.indexOf(16);
    if (DET_SUN[o] > DET_SHADE) return sombra(i) + COLOR_B * (DET_SUN[o] - DET_SHADE) * Math.max(0, lag(o, i) / lag(o, k16)) + corr;
    const vals = HORAS.map((_, k) => lag(o, k)), mx = Math.max(...vals), v16 = lag(o, k16);
    const f = mx > v16 ? Math.max(0, (lag(o, i) - v16) / (mx - v16)) : 0;
    return sombra(i) + COLOR_B * (DET_PEAK[o] - DET_SHADE) * f + corr;
  };
  const lagT = (k) => ROOF_H[k] * .55 + ROOF_H[Math.max(0, k - 1)] * .45;
  const detTecho = () => sombra(i) + COLOR_B * (DET_ROOF_SUN - DET_SHADE) * Math.max(0, lagT(i) / Math.max(...HORAS.map((_, k) => lagT(k)))) + corr;
  const L = {};
  let env = 0;
  for (const o of ORI) if ((walls[o] || 0) > 0) { L[`Muro ${o}`] = wm.K * walls[o] * detMuro(o); env += L[`Muro ${o}`]; }
  if (roof > 0) { L.Cubierta = rm.K * roof * detTecho(); env += L.Cubierta; }
  for (const o of ORI) if ((glass[o] || 0) > 0) {
    L[`Vidrio transmisión ${o}`] = gm.K * glass[o] * dT; L[`Insolación vidrio ${o}`] = glass[o] * SOLAR[o] * SUN_H[o][i] * shgc * stor.solar;
    env += L[`Vidrio transmisión ${o}`] + L[`Insolación vidrio ${o}`];
  }
  const part = op.particiones ? area * PART_FRAC * PART_U * Math.max(3, dT * .35) : 0;
  const piso = op.particiones && roof <= 0 ? area * FLOOR_FRAC * FLOOR_U * Math.max(2, dT * .25) : 0;
  L["Particiones adyacentes"] = part; L["Piso sobre no acondicionado"] = piso;
  const n = Math.round(z.occ || 0);
  const occS = n * OCC_S * stor.people * sp.div.people * bd, occL = n * OCC_L * sp.div.people * bd;
  const luz = (z.lights || 0) * (z.lightType === "fluorescent" ? 1.2 : 1) * stor.lights * sp.div.lights * bd * strat;
  const eq = (z.equip || 0) * stor.equip * sp.div.equip * bd;
  L.Ocupantes = occS; L.OcupantesL = occL; L["Iluminación"] = luz; L["Equipos / fuerza"] = eq;
  let fanW = 0, achFlow = 0;
  if (clean) {
    achFlow = vol * z.achClean;
    if (!(z.fanPa > 0 && z.fanEta > 0)) throw new Error("cuarto limpio sin Pa/η: el conteo FFU no está en este cálculo");
    fanW = (achFlow / 3600) * z.fanPa / (z.fanEta > 1 ? z.fanEta / 100 : z.fanEta);
  }
  const presPos = clean && z.presion !== "negativa";
  const ach = presPos ? 0 : (z.ach ?? .35), inf = vol * ach, infS = inf * s.QS * dT, infL = inf * s.QL * dW;
  L.infS = infS; L.infL = infL;
  const rawS = env + part + piso + occS + luz + eq + fanW + infS, rawL = occL + infL;
  const fan = rawS * FAN, duct = rawS * DUCT, safS = (rawS + fan + duct) * SAFETY, safL = rawL * SAFETY;
  const roomS = rawS + fan + duct + safS, roomL = rawL + safL;
  const Rp = op.rp621 && RP_621[z.spaceType || "office"] != null ? RP_621[z.spaceType || "office"] : sp.Rp;
  const v62 = (Rp * n + sp.Ra * area) * 3.6, byP = n * OA_PERS, byA = area * OA_M2;
  let oa = Math.max(v62, byP, byA, 0);
  /* Fracción de aire exterior sobre un suministro estimado con ΔT fijo de 11 K (index.html:3459-3460) y aire exterior impuesto
     (reposición en cascada desde cuartos limpios, 3462). */
  const supplyGuess = roomS / (s.QS * 11);
  if ((z.oaFraction || 0) > 0) oa = Math.max(oa, supplyGuess * z.oaFraction);
  if ((z.oaFixed || 0) > 0) oa = Math.max(oa, z.oaFixed);
  const oaSraw = oa * s.QS * dT, oaS = s.caso === "deshumidificacion" && oaSraw < 0 ? 0 : oaSraw, oaL = oa * s.QL * dW;
  const grandS = roomS + oaS, grandL = roomL + oaL, grand = grandS + grandL, tons = grand / W_TON;
  const shf = grand > 0 ? grandS / grand : 1;
  const eS = roomS + BF * oaS, eL = roomL + BF * oaL, eshf = eS + eL > 0 ? eS / (eS + eL) : 1;
  const adpRaw = adpDe(Wi, eshf, s.p), adp = adpRaw < 4.4 ? 4.4 : adpRaw;
  const latT = adp + BF * (TI - adp), dTreal = Math.max(6, TI - latT);
  let supply = roomS > 0 ? roomS / (s.QS * dTreal) : 0;
  if (clean && achFlow > supply) supply = achFlow;
  return { hour: hora, mass, wFloor, Wo, Wi, dWreal, dW, dT, L, part, piso, occS, occL, luz, eq, fanW, infS, infL, roomS, roomL, v62, byP, byA, oa, oaS, oaL,
    grandS, grandL, grand, tons, shf, eshf, adpRaw, adp, latT, dTreal, supply, cfm: supply / M3H_CFM, psyWo: Wo, psyWi: Wi, s };
}
/* Barrido 8–18 h: pico = hora de mayor carga; con empate dentro de 0.2 % gana la más cercana a las 15 h (la primera si empatan). */
function barrido(z, s, op = HOY, bldDiv = 1) {
  const runs = HORAS.map((hr) => zona(z, s, hr, op, bldDiv));
  const mx = Math.max(...runs.map((r) => r.grand));
  const cand = runs.filter((r) => r.grand >= mx * 0.998);
  let best = cand[0];
  for (const r of cand) if (Math.abs(r.hour - 15) < Math.abs(best.hour - 15)) best = r;
  return { ...best, profile: runs.map((r) => ({ hour: r.hour, kW: r.grand / 1000 })) };
}
/* Dos casos ASHRAE (control de humedad): enfriamiento (BS 0.4 % + BH coincidente) y deshumidificación (DP 0.4 % con su W y BS). */
function dosCasos(z, s, op = HOY) {
  const r1 = barrido(z, s, op), sd = sitioDes(s), r2 = barrido(z, sd, op);
  const Wi = r2.Wi, modo = z.serpentin === "oa" || z.serpentin === "todo" ? z.serpentin : (z.spaceType === "cleanroom" ? "oa" : "todo");
  if (modo === "todo") {
    const sDisp = s.QS * r2.supply * (TI - r2.latT), recal = Math.max(0, sDisp - r2.roomS), coilDes = r2.grand + recal;
    const rigeDes = coilDes > r1.grand, base = rigeDes ? r2 : r1;
    const grand = Math.max(r1.grand, coilDes), grandL = r2.grandL;
    return { modo, r1, r2, grand, grandL, tons: grand / W_TON, adp: r2.adp, recal, cfm: base.cfm, oa: base.oa, equipo: { total: grand, latente: grandL, recal } };
  }
  const Qoa = r2.oa, margen = z.adpMargen ?? 2, Lint = r2.roomL;
  const Wsup = Wi - Lint / (s.QL * Qoa) / 1000, WoDes = r2.Wo;
  const WadpReq = (Wsup - BF * WoDes) / (1 - BF), adpReq = tRocio(WadpReq, s.p), adpSel = adpReq - margen, WadpSel = Wsat(adpSel, s.p);
  const unidad = (To, Wo) => { const Tl = adpSel + BF * (To - adpSel), Wl = Math.min(Wo, WadpSel + BF * (Wo - WadpSel));
    const sens = Math.max(0, s.QS * Qoa * (To - Tl)), lat = Math.max(0, s.QL * Qoa * (Wo - Wl) * 1000); return { To, Tl, Wl, sens, lat, total: sens + lat }; };
  const uEnf = unidad(s.db - s.range * DRANGE_H[HORAS.indexOf(r1.hour)], r1.Wo), uDes = unidad(sd.db, WoDes);
  const cred = (u) => s.QS * Qoa * (TI - u.Tl);
  const secoEnf = Math.max(0, r1.roomS - cred(uEnf)), secoDes = Math.max(0, r2.roomS - cred(uDes));
  const recal = Math.max(Math.max(0, cred(uEnf) - r1.roomS), Math.max(0, cred(uDes) - r2.roomS));
  const uSel = uDes.total >= uEnf.total ? { ...uDes, caso: "des" } : { ...uEnf, caso: "enf" };
  const secoSel = Math.max(secoEnf, secoDes), grand = uSel.total + secoSel, base = uSel.caso === "des" ? r2 : r1;
  return { modo, r1, r2, grand, grandL: uSel.lat, tons: grand / W_TON, adp: adpSel, adpReq, Wsup, recal, Qrec: Math.max(0, r2.supply - Qoa), cfm: base.cfm, oa: base.oa,
    equipo: { total: grand, latente: uSel.lat, recal }, uSel, secoSel };
}

/* ---------------- Casos ---------------- */
const filas = [];
const r = (x, d = 2) => Number(x.toFixed(d));
const f = (x, d = 2) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const CALC = "parches/casos-a-mano/load.calc.mjs";
const fila = (id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado) =>
  filas.push({ id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado, calculado_por: CALC });
const CASA = (lin, que) => `criterio de la casa (index.html:${lin}${que ? ", " + que : ""})`;
const PSY = "ASHRAE Handbook—Fundamentals 2017 cap. 1 (ec. 3, 5-6, 20, 22, 33) vía PsychroLib, https://raw.githubusercontent.com/psychrometrics/psychrolib/master/src/js/psychrolib.js";
const T621 = "ASHRAE 62.1-2016 Tabla 6.2.2.1 (Addendum s) y Ec. 6.2.2.1 (parches/normas-texto)";
const CLTD = "ASHRAE Fundamentals 1997 cap. 28 vía curso CED M06-004 (parches/normas-texto/ASHRAE-1997_CLTD-correccion_extracto-curso-CED.txt): CLTDc = CLTD + (78 − TR) + (TM − 85) °F";
const LINEA = (lbl) => `LOADS[0].lines.find((l) => l.label === '${lbl}').s`;
const LINEA0 = (lbl) => `((LOADS[0].lines.find((l) => l.label === '${lbl}') || { s: 0 }).s)`;

const TJ = sitio("tijuana"), MX = sitio("mexicali");

/* ===== 1 · Oficina 100 m² × 3 m, 10 personas, 1,000 W luz, 500 W equipo, sin envolvente ni infiltración, Tijuana, 16 h ===== */
{
  const z = { area: 100, height: 3, occ: 10, lights: 1000, equip: 500, ach: 0, roof: 0, spaceType: "office" };
  const a = zona(z, TJ, 16), b = zona(z, TJ, 16, { ...HOY, pisoDW: false }), c = zona(z, TJ, 16, { ...HOY, particiones: false });
  const ent = "Tijuana, peakScan false (16 h), office, area 100, height 3, occ 10, lights 1000, equip 500, ach 0, sin muros/vidrio/cubierta";
  fila("CM.load.1.a", "presión barométrica a 149 m (kPa)", ent, `101.325·(1 − 2.25577e-5·149)^5.2559 = ${a.s.p.toFixed(4)}`, PSY, "secundaria", "SITE.pAtm", r(a.s.p, 4), 0.001, "vigente");
  fila("CM.load.1.b", "razón de humedad exterior 32.8 °C / 17.5 °C BH (g/kg)", ent, `ec. 33 con Ws(17.5 °C, ${a.s.p.toFixed(3)} kPa) → ${(a.Wo * 1000).toFixed(4)} g/kg`, PSY, "secundaria", "LOADS[0].psy.Wo * 1000", r(a.Wo * 1000, 4), 0.001, "vigente");
  fila("CM.load.1.c", "razón de humedad interior 24 °C / 50 % (g/kg)", ent, `0.621945·0.5·pws(24)/(p − 0.5·pws(24)) = ${(a.Wi * 1000).toFixed(4)} g/kg`, PSY, "secundaria", "LOADS[0].psy.Wi * 1000", r(a.Wi * 1000, 4), 0.001, "vigente");
  fila("CM.load.1.d", "ΔW real exterior − interior (g/kg): el exterior es más seco", ent, `${(a.Wo * 1000).toFixed(4)} − ${(a.Wi * 1000).toFixed(4)} = ${a.dWreal.toFixed(4)}`, PSY, "secundaria", "(LOADS[0].psy.Wo - LOADS[0].psy.Wi) * 1000", r(a.dWreal, 4), 0.001, "vigente");
  fila("CM.load.1.e", "ΔW usado para latente de aire: hoy piso de 0.5 g/kg (H-123)", ent, `máx(0.5, ${a.dWreal.toFixed(3)}) = 0.5`, CASA("3181", "piso 0.5 g/kg, H-123"), "criterio de la casa", "LOADS[0].psy.dW", 0.5, 0.0001, "vigente");
  fila("CM.load.1.f", "H-123: ΔW usado = máx(0, real) = 0", ent, `máx(0, ${a.dWreal.toFixed(3)}) = 0 (política de pisos 2.9.16: nada se estima)`, "AUDITORIA.md H-123 (corrección propuesta) · CLAUDE.md regla 6", "criterio de la casa", "LOADS[0].psy.dW", 0, 0.0001, "fase2:H-123");
  fila("CM.load.1.g", "ocupantes sensible", ent, `10 × 70 W × alm 0.90 (16 h) × div 0.9 (oficina) = ${f(a.occS)} W`, CASA("2985, 2996, 2998"), "criterio de la casa", LINEA("Ocupantes"), r(a.occS), 0.01, "vigente");
  fila("CM.load.1.h", "ocupantes latente", ent, `10 × 45 W × div 0.9 = ${f(a.occL)} W`, CASA("2985, 2998"), "criterio de la casa", "LOADS[0].lines.find((l) => l.label === 'Ocupantes').l", r(a.occL), 0.01, "vigente");
  fila("CM.load.1.i", "iluminación", ent, `1,000 W × LED 1.0 × alm 0.75 (16 h ligera) × div 0.95 × estratif. 1.0 (h ≤ 3.2) = ${f(a.luz)} W`, CASA("2995, 2998, 3357, 3368"), "criterio de la casa", LINEA("Iluminación"), r(a.luz), 0.01, "vigente");
  fila("CM.load.1.j", "equipos", ent, `500 W × alm 0.9 × div 0.9 = ${f(a.eq)} W`, CASA("2996, 2998"), "criterio de la casa", LINEA("Equipos / fuerza"), r(a.eq), 0.01, "vigente");
  fila("CM.load.1.k", "particiones adyacentes que nadie capturó (H-121)", ent, `100 × 12 % × U 1.5 × máx(3, 0.35 × 8.8) = ${f(a.part)} W`, CASA("2990, 3398", "H-121"), "criterio de la casa", LINEA0("Particiones adyacentes"), r(a.part), 0.01, "vigente");
  fila("CM.load.1.l", "H-121: particiones sin captura = 0", ent, "sin área de partición capturada → 0 W (nada se estima)", "AUDITORIA.md H-121 · CLAUDE.md regla 6", "criterio de la casa", LINEA0("Particiones adyacentes"), 0, 0.01, "fase2:H-121");
  fila("CM.load.1.m", "piso sobre no acondicionado que nadie capturó (H-121)", ent, `100 × 10 % × U 0.8 × máx(2, 0.25 × 8.8) = ${f(a.piso)} W`, CASA("2990, 3399", "H-121"), "criterio de la casa", LINEA0("Piso sobre no acondicionado"), r(a.piso), 0.01, "vigente");
  fila("CM.load.1.n", "H-121: piso sin captura = 0", ent, "sin piso sobre no acondicionado capturado → 0 W", "AUDITORIA.md H-121 · CLAUDE.md regla 6", "criterio de la casa", LINEA0("Piso sobre no acondicionado"), 0, 0.01, "fase2:H-121");
  fila("CM.load.1.o", "sensible del espacio", ent, `(${f(a.occS)} + ${f(a.luz)} + ${f(a.eq)} + ${f(a.part)} + ${f(a.piso)}) × (1 + 0.026 + 0.03) × 1.05 = ${f(a.roomS)} W`, CASA("2990, 3447-3453", "ventilador 2.6 %, conductos 3 %, margen 5 %"), "criterio de la casa", "LOADS[0].roomS", r(a.roomS), 0.05, "vigente");
  fila("CM.load.1.p", "latente del espacio", ent, `405 × 1.05 = ${f(a.roomL)} W`, CASA("3450"), "criterio de la casa", "LOADS[0].roomL", r(a.roomL), 0.01, "vigente");
  fila("CM.load.1.q", "aire exterior (m³/h): rige Tab.45 por persona", ent, `máx(62.1 (2.5×10 + 0.3×100)×3.6 = ${f(a.v62, 1)}, 10 × 30 = 300, 100 × 1.8 = 180) = ${f(a.oa, 1)} (el valor que rige es criterio de la casa, no 62.1: H-158)`, `${T621}; ${CASA("2986", "Tab.45")}`, "criterio de la casa", "LOADS[0].oa", r(a.oa), 0.01, "vigente");
  fila("CM.load.1.r", "aire exterior sensible", ent, `300 × 0.34 × ${a.s.ratio.toFixed(5)} × 8.8 K = ${f(a.oaS)} W`, CASA("2986, 3171, 3335", "0.34 corregido por presión"), "criterio de la casa", "LOADS[0].oaS", r(a.oaS), 0.02, "vigente");
  fila("CM.load.1.s", "aire exterior latente con el piso ΔW 0.5 (H-123)", ent, `300 × 0.83 × ${a.s.ratio.toFixed(5)} × 0.5 = ${f(a.oaL)} W`, CASA("2986, 3336, 3181", "H-123"), "criterio de la casa", "LOADS[0].oaL", r(a.oaL), 0.02, "vigente");
  fila("CM.load.1.t", "H-123: aire exterior latente con ΔW real (−3.04 g/kg) = 0", ent, `300 × ${f(a.s.QL, 4)} × máx(0, ${a.dWreal.toFixed(3)}) = ${f(b.oaL)} W`, "AUDITORIA.md H-123 · política de pisos 2.9.16", "criterio de la casa", "LOADS[0].oaL", r(b.oaL), 0.02, "fase2:H-123");
  fila("CM.load.1.u", "gran total", ent, `${f(a.roomS)} + ${f(a.roomL)} + ${f(a.oaS)} + ${f(a.oaL)} = ${f(a.grand)} W`, CASA("3472"), "criterio de la casa", "LOADS[0].grand", r(a.grand), 0.05, "vigente");
  fila("CM.load.1.v", "toneladas", ent, `${f(a.grand)} / 3,517 = ${a.tons.toFixed(5)} TR`, CASA("2987, 3475", "3517 W/TR"), "criterio de la casa", "LOADS[0].tons", r(a.tons, 5), 0.00002, "vigente");
  fila("CM.load.1.w", "factor de calor sensible efectivo", ent, `(roomS + 0.15·oaS) / (roomS + roomL + 0.15·(oaS + oaL)) = ${a.eshf.toFixed(5)}`, CASA("2990, 3478", "BF 0.15"), "criterio de la casa", "LOADS[0].eshf", r(a.eshf, 5), 0.00002, "vigente");
  fila("CM.load.1.x", "ADP sobre la recta ESHF contra saturación (°C)", ent, `Wi − 1.006·(1−f)/(f·2450)·(24 − t) = Wsat(t, ${a.s.p.toFixed(3)} kPa) → t = ${a.adp.toFixed(4)} (regula falsi propia)`, `${PSY}; ${CASA("3078-3101")}`, "secundaria", "LOADS[0].adp", r(a.adp, 4), 0.002, "vigente");
  fila("CM.load.1.y", "caudal de suministro (CFM)", ent, `roomS / (0.34·ratio × máx(6, (1 − 0.15)(24 − ADP))) = ${f(a.supply)} m³/h ÷ 1.699 = ${f(a.cfm)} CFM`, CASA("3491-3511"), "criterio de la casa", "LOADS[0].cfm", r(a.cfm), 0.05, "vigente");
  fila("CM.load.1.z", "H-121: gran total sin particiones ni piso (con el piso ΔW de hoy)", ent, `${f(c.grand)} W (baja ${f(a.grand - c.grand)} W, ${((1 - c.grand / a.grand) * 100).toFixed(1)} %)`, "AUDITORIA.md H-121", "criterio de la casa", "LOADS[0].grand", r(c.grand), 0.05, "fase2:H-121");
}

/* ===== 2 · Envolvente en Tijuana a las 16 h: muros N y W 100 m², cubierta 100 m², vidrio W 10 m², área 300 m² (masa media) ===== */
const ENV = { area: 300, height: 3, occ: 0, lights: 0, equip: 0, ach: 0, roof: 100, walls: { N: 100, W: 100 }, glass: { W: 10 }, spaceType: "office" };
const ENV_TXT = "peakScan false (16 h), office, area 300, height 3, occ/luz/equipo 0, ach 0, muros N 100 y W 100 m² light_block_20 (K 0.849), cubierta 100 m² roof_concrete_insul (K 0.55), vidrio W 10 m² glass_dgu (K 2.8, SHGC 0.70)";
{
  const a = zona(ENV, TJ, 16), c = zona(ENV, TJ, 16, { ...HOY, cltd: true });
  const corr = (25.556 - TI) + ((TJ.db - TJ.range / 2) - 29.444);
  const ent = "Tijuana, " + ENV_TXT;
  fila("CM.load.2.a", "masa constructiva por m² de piso → clase media", ent, `(200 × 176 + 100 × 320 + 10 × 25) / 300 = ${f(a.wFloor)} kg/m² (150–350 = media)`, CASA("3352-3353", "vidrio a 25 kg/m²"), "criterio de la casa", "LOADS[0].weightFloor", r(a.wFloor), 0.01, "vigente");
  fila("CM.load.2.e", "vidrio W: transmisión con ΔT del sitio", ent, `2.8 × 10 × (32.8 − 24) = ${f(a.L["Vidrio transmisión W"])} W`, CASA("874, 3392"), "criterio de la casa", LINEA("Vidrio transmisión W"), r(a.L["Vidrio transmisión W"]), 0.02, "vigente");
  fila("CM.load.2.f", "vidrio W: insolación a las 16 h", ent, `10 × 680 W/m² × SUN_H 1.00 × SHGC 0.70 × alm 0.66 (16 h media) = ${f(a.L["Insolación vidrio W"])} W`, CASA("876, 878, 2994, 3243-3252, 3392", "SOLAR «Carrier» sin edición; SUN_H estimación EMP"), "criterio de la casa", LINEA("Insolación vidrio W"), r(a.L["Insolación vidrio W"]), 0.05, "vigente");
  fila("CM.load.2.g", "gran total de la zona (con la corrección CLTD por sitio H-120; incluye particiones H-121 y ΔW 0.5 H-123)", ent, `${f(a.grand)} W`, CASA("3338-3475"), "criterio de la casa", "LOADS[0].grand", r(a.grand), 0.1, "vigente");
  fila("CM.load.2.h", "H-120: muro N corregido por sitio (+0.31 K en Tijuana)", ent, `corrección (25.556 − 24) + ((32.8 − 9.2/2) − 29.444) = ${corr.toFixed(3)} K → 0.849 × 100 × ${(7.8 + corr).toFixed(3)} = ${f(c.L["Muro N"])} W`, CLTD, "secundaria", LINEA("Muro N"), r(c.L["Muro N"]), "1%", "vigente");
  fila("CM.load.2.i", "H-120: muro W corregido por sitio", ent, `0.849 × 100 × (19.032 + ${corr.toFixed(3)}) = ${f(c.L["Muro W"])} W`, CLTD, "secundaria", LINEA("Muro W"), r(c.L["Muro W"]), "1%", "vigente");
  fila("CM.load.2.j", "H-120: cubierta corregida por sitio", ent, `0.55 × 100 × (16.741 + ${corr.toFixed(3)}) = ${f(c.L.Cubierta)} W`, CLTD, "secundaria", LINEA("Cubierta"), r(c.L.Cubierta), "1%", "vigente");
}

/* ===== 3 · La misma envolvente en Mexicali (44 °C, 14.2 K, 23 m): el DET opaco se corrige por sitio (H-120, +9.0 K) ===== */
{
  const a = zona(ENV, MX, 16), c = zona(ENV, MX, 16, { ...HOY, cltd: true });
  const corr = (25.556 - TI) + ((MX.db - MX.range / 2) - 29.444);
  const ent = "Mexicali, " + ENV_TXT;
  fila("CM.load.3.a", "presión barométrica a 23 m (kPa)", ent, `101.325·(1 − 2.25577e-5·23)^5.2559 = ${a.s.p.toFixed(4)}`, PSY, "secundaria", "SITE.pAtm", r(a.s.p, 4), 0.001, "vigente");
  fila("CM.load.3.b", "razón de humedad exterior 44 °C / 24.8 °C BH (g/kg)", ent, `ec. 33 → ${(a.Wo * 1000).toFixed(4)}`, PSY, "secundaria", "LOADS[0].psy.Wo * 1000", r(a.Wo * 1000, 4), 0.001, "vigente");
  fila("CM.load.3.c", "ΔW usado (exterior más húmedo: sin piso)", ent, `${(a.Wo * 1000).toFixed(4)} − ${(a.Wi * 1000).toFixed(4)} = ${a.dW.toFixed(4)} g/kg`, PSY, "secundaria", "LOADS[0].psy.dW", r(a.dW, 4), 0.001, "vigente");
  fila("CM.load.3.e", "H-120: muro N corregido por sitio (+9.0 K)", ent, `(25.556 − 24) + ((44 − 14.2/2) − 29.444) = ${corr.toFixed(3)} K → 0.849 × 100 × ${(7.8 + corr).toFixed(3)} = ${f(c.L["Muro N"])} W`, CLTD, "secundaria", LINEA("Muro N"), r(c.L["Muro N"]), "1%", "vigente");
  fila("CM.load.3.g", "H-120: muro W corregido por sitio", ent, `0.849 × 100 × (19.032 + ${corr.toFixed(3)}) = ${f(c.L["Muro W"])} W`, CLTD, "secundaria", LINEA("Muro W"), r(c.L["Muro W"]), "1%", "vigente");
  fila("CM.load.3.i", "H-120: cubierta corregida por sitio", ent, `0.55 × 100 × (16.741 + ${corr.toFixed(3)}) = ${f(c.L.Cubierta)} W`, CLTD, "secundaria", LINEA("Cubierta"), r(c.L.Cubierta), "1%", "vigente");
  fila("CM.load.3.j", "vidrio W: la transmisión sí usa el ΔT del sitio", ent, `2.8 × 10 × (44 − 24) = ${f(a.L["Vidrio transmisión W"])} W`, CASA("3392"), "criterio de la casa", LINEA("Vidrio transmisión W"), r(a.L["Vidrio transmisión W"]), 0.02, "vigente");
  fila("CM.load.3.k", "aire exterior sensible (540 m³/h por área)", ent, `540 × 0.34 × ${a.s.ratio.toFixed(5)} × 20 = ${f(a.oaS)} W`, CASA("2986, 3335"), "criterio de la casa", "LOADS[0].oaS", r(a.oaS), 0.05, "vigente");
  fila("CM.load.3.l", "aire exterior latente con ΔW real", ent, `540 × 0.83 × ${a.s.ratio.toFixed(5)} × ${a.dW.toFixed(4)} = ${f(a.oaL)} W`, CASA("2986, 3336"), "criterio de la casa", "LOADS[0].oaL", r(a.oaL), 0.05, "vigente");
}

/* ===== 4 · Barrido horario: fachada oriente (muro E 50 m², vidrio E 10 m²), 100 m² × 3 m, Tijuana, peakScan true ===== */
{
  const z = { area: 100, height: 3, occ: 0, lights: 0, equip: 0, ach: 0, roof: 0, walls: { E: 50 }, glass: { E: 10 }, spaceType: "office" };
  const a = barrido(z, TJ);
  const k = (hr) => a.profile.find((p) => p.hour === hr).kW * 1000;
  const ent = "Tijuana, peakScan true (8–18 h), office, area 100, height 3, occ/luz/equipo 0, ach 0, muro E 50 m², vidrio E 10 m² glass_dgu, sin cubierta";
  const FUE = CASA("3243-3324, 3535-3553", "SUN_H y DET_PEAK: estimación propia EMP, H-122");
  fila("CM.load.4.a", "hora pico hallada por el barrido", ent, `perfil máximo a las ${a.hour} h (9 h = ${(k(9) / k(8) * 100).toFixed(2)} % del pico, fuera del 0.2 %)`, FUE, "criterio de la casa", "LOADS[0].hour", a.hour, 0, "vigente");
  fila("CM.load.4.b", "muro E a la hora pico: sombra escalada + pico propio de la fachada", ent, `sombra 7.8 × (32.8 − 9.2×0.71 − 24)/8.8 + 0.78 × (18.5 − 7.8) × 1 → 0.849 × 50 × DET = ${f(a.L["Muro E"])} W`, FUE, "criterio de la casa", LINEA("Muro E"), r(a.L["Muro E"]), 0.05, "vigente");
  fila("CM.load.4.c", "insolación vidrio E a la hora pico", ent, `10 × 650 × 1.00 × 0.70 × alm 0.80 (ligera) = ${f(a.L["Insolación vidrio E"])} W`, FUE, "criterio de la casa", LINEA("Insolación vidrio E"), r(a.L["Insolación vidrio E"]), 0.05, "vigente");
  fila("CM.load.4.d", "transmisión vidrio E con el bulbo seco de la hora (DRANGE_H)", ent, `2.8 × 10 × (32.8 − 9.2 × 0.71 − 24) = ${f(a.L["Vidrio transmisión E"])} W`, CASA("3262-3265", "DRANGE_H atribuida a ASHRAE cap. 14 sin edición"), "criterio de la casa", LINEA("Vidrio transmisión E"), r(a.L["Vidrio transmisión E"]), 0.02, "vigente");
  fila("CM.load.4.e", "gran total a la hora pico", ent, `${f(a.grand)} W`, FUE, "criterio de la casa", "LOADS[0].grand", r(a.grand), 0.1, "vigente");
  fila("CM.load.4.f", "perfil del barrido a las 10 h", ent, `${f(k(10))} W`, FUE, "criterio de la casa", "LOADS[0].profile.find((p) => p.hour === 10).kW * 1000", r(k(10)), 0.1, "vigente");
  fila("CM.load.4.g", "perfil del barrido a las 12 h", ent, `${f(k(12))} W`, FUE, "criterio de la casa", "LOADS[0].profile.find((p) => p.hour === 12).kW * 1000", r(k(12)), 0.1, "vigente");
  fila("CM.load.4.h", "perfil del barrido a las 16 h", ent, `${f(k(16))} W`, FUE, "criterio de la casa", "LOADS[0].profile.find((p) => p.hour === 16).kW * 1000", r(k(16)), 0.1, "vigente");
}

/* ===== 5 · Diversidad del edificio 0.8 (H-141): hoy se aplica también en cada ganancia interna de zona ===== */
{
  const z = { area: 100, height: 3, occ: 10, lights: 1000, equip: 500, ach: 0, roof: 0, spaceType: "office" };
  const a = zona(z, TJ, 16, HOY, 0.8), b = zona(z, TJ, 16, { ...HOY, bdZona: false }, 0.8);
  const ent = "caso 1 (oficina 100 m², Tijuana, 16 h) con S.bldDiv = 0.8";
  const DEC = "decisión del dueño PLAN-CRITICOS.md §4.1 (H-141 opción a: diversidad sólo en planta; «criterio Carrier, ratificar con texto»)";
  fila("CM.load.5.a", "ocupantes sensible con diversidad del edificio en la zona (hoy)", ent, `567 × 0.8 = ${f(a.occS)} W`, CASA("3369, 3404", "bd en la zona"), "criterio de la casa", LINEA("Ocupantes"), r(a.occS), 0.01, "vigente");
  fila("CM.load.5.b", "H-141: ocupantes sensible al pico, sin diversidad del edificio", ent, `10 × 70 × 0.9 × 0.9 = ${f(b.occS)} W`, DEC, "criterio de la casa", LINEA("Ocupantes"), r(b.occS), 0.01, "fase2:H-141");
  fila("CM.load.5.c", "iluminación con diversidad del edificio (hoy)", ent, `712.5 × 0.8 = ${f(a.luz)} W`, CASA("3408"), "criterio de la casa", LINEA("Iluminación"), r(a.luz), 0.01, "vigente");
  fila("CM.load.5.d", "H-141: iluminación al pico", ent, `${f(b.luz)} W`, DEC, "criterio de la casa", LINEA("Iluminación"), r(b.luz), 0.01, "fase2:H-141");
  fila("CM.load.5.e", "equipos con diversidad del edificio (hoy)", ent, `405 × 0.8 = ${f(a.eq)} W`, CASA("3411"), "criterio de la casa", LINEA("Equipos / fuerza"), r(a.eq), 0.01, "vigente");
  fila("CM.load.5.f", "H-141: equipos al pico", ent, `${f(b.eq)} W`, DEC, "criterio de la casa", LINEA("Equipos / fuerza"), r(b.eq), 0.01, "fase2:H-141");
  fila("CM.load.5.g", "ocupantes latente con diversidad del edificio (hoy)", ent, `405 × 0.8 = ${f(a.occL)} W`, CASA("3404"), "criterio de la casa", "LOADS[0].lines.find((l) => l.label === 'Ocupantes').l", r(a.occL), 0.01, "vigente");
  fila("CM.load.5.h", "H-141: gran total de la zona al pico (con H-121/H-123 como hoy)", ent, `${f(b.grand)} W (hoy ${f(a.grand)})`, DEC, "criterio de la casa", "LOADS[0].grand", r(b.grand), 0.05, "fase2:H-141");
}

/* ===== 6 · Aire exterior: rige 62.1 (aula y producción), rige Tab.45 por área (sin ocupantes) y almacén (H-157) ===== */
{
  const aula = zona({ area: 100, height: 3, occ: 10, ach: 0, spaceType: "classroom" }, TJ, 16);
  const aulaVbz = (5 * 10 + 0.6 * 100) * 3.6;
  const prod = zona({ area: 400, height: 6, occ: 30, ach: 0, spaceType: "production" }, TJ, 16);
  const vacia = zona({ area: 100, height: 3, occ: 0, ach: 0, spaceType: "office" }, TJ, 16);
  const alm = zona({ area: 200, height: 6, occ: 12, ach: 0, spaceType: "warehouse" }, TJ, 16), alm2 = zona({ area: 200, height: 6, occ: 12, ach: 0, spaceType: "warehouse" }, TJ, 16, { ...HOY, rp621: true });
  fila("CM.load.6.a", "aula 100 m², 10 personas: rige 62.1", "Tijuana, 16 h, classroom, area 100, height 3, occ 10, ach 0", `máx((5×10 + 0.6×100)×3.6 = ${f(aulaVbz, 1)}, 300, 180) = ${f(aulaVbz, 1)} m³/h`, T621, "primaria", "LOADS[0].oa", r(aulaVbz), 0.01, "vigente");
  fila("CM.load.6.b", "producción 400 m², 30 personas: rige 62.1 (General manufacturing)", "Tijuana, 16 h, production, area 400, height 6, occ 30, ach 0", `máx((5×30 + 0.9×400)×3.6 = ${f(prod.v62, 1)}, 900, 720) = ${f(prod.oa, 1)} m³/h`, T621, "primaria", "LOADS[0].oa", r(prod.oa), 0.01, "vigente");
  fila("CM.load.6.c", "oficina sin ocupantes: rige Tab.45 por área", "Tijuana, 16 h, office, area 100, height 3, occ 0, ach 0", `máx(0.3×100×3.6 = 108, 0, 100 × 1.8 = 180) = ${f(vacia.oa, 1)} m³/h`, `${T621}; ${CASA("2986", "Tab.45 1.8 m³/h·m²")}`, "criterio de la casa", "LOADS[0].oa", r(vacia.oa), 0.01, "vigente");
  fila("CM.load.6.d", "almacén 200 m², 12 personas: hoy Rp 2.5 y rige Tab.45", "Tijuana, 16 h, warehouse, area 200, height 6, occ 12, ach 0", `máx((2.5×12 + 0.3×200)×3.6 = ${f(alm.v62, 1)}, 12 × 30 = 360, 200 × 1.8 = 360) = ${f(alm.oa, 1)} m³/h`, CASA("3011, 2986", "SPACES.warehouse Rp 2.5, H-157"), "criterio de la casa", "LOADS[0].oa", r(alm.oa), 0.01, "vigente");
  fila("CM.load.6.e", "H-157: almacén con Rp 5 L/s·pers de 62.1 (Warehouses)", "Tijuana, 16 h, warehouse, area 200, height 6, occ 12, ach 0", `máx((5×12 + 0.3×200)×3.6 = ${f(alm2.v62, 1)}, 360, 360) = ${f(alm2.oa, 1)} m³/h`, T621, "primaria", "LOADS[0].oa", r(alm2.oa), 0.01, "fase2:H-157");
}

/* ===== 7 · Infiltración: oficina vacía 100 m² × 3 m con 0.5 cambios/h, Tijuana, 16 h ===== */
{
  const z = { area: 100, height: 3, occ: 0, lights: 0, equip: 0, ach: 0.5, roof: 0, spaceType: "office" };
  const a = zona(z, TJ, 16), b = zona(z, TJ, 16, { ...HOY, pisoDW: false });
  const ent = "Tijuana, peakScan false (16 h), office, area 100, height 3, occ 0, ach 0.5, sin envolvente";
  fila("CM.load.7.a", "infiltración sensible", ent, `300 m³ × 0.5 = 150 m³/h × 0.34 × ${a.s.ratio.toFixed(5)} × 8.8 = ${f(a.infS)} W`, CASA("3441-3442"), "criterio de la casa", "LOADS[0].lines.find((l) => /^Infiltración/.test(l.label)).s", r(a.infS), 0.02, "vigente");
  fila("CM.load.7.b", "infiltración latente con el piso ΔW 0.5 (H-123)", ent, `150 × 0.83 × ${a.s.ratio.toFixed(5)} × 0.5 = ${f(a.infL)} W`, CASA("3181, 3442", "H-123"), "criterio de la casa", "LOADS[0].lines.find((l) => /^Infiltración/.test(l.label)).l", r(a.infL), 0.02, "vigente");
  fila("CM.load.7.c", "H-123: infiltración latente con ΔW real = 0", ent, `150 × ${f(a.s.QL, 4)} × máx(0, ${a.dWreal.toFixed(3)}) = ${f(b.infL)} W`, "AUDITORIA.md H-123", "criterio de la casa", "LOADS[0].lines.find((l) => /^Infiltración/.test(l.label)).l", r(b.infL), 0.02, "fase2:H-123");
  fila("CM.load.7.d", "latente del espacio (sólo infiltración)", ent, `${f(a.infL)} × 1.05 = ${f(a.roomL)} W`, CASA("3446-3453"), "criterio de la casa", "LOADS[0].roomL", r(a.roomL), 0.02, "vigente");
}

/* ===== 8 · ADP bajo: Mexicali, 100 m² × 3 m, 80 personas (ESHF 0.649): ADP resuelto 2.59 °C → se limita a 4.4 °C ===== */
{
  const z = { area: 100, height: 3, occ: 80, lights: 0, equip: 0, ach: 0, roof: 0, spaceType: "office" };
  const a = zona(z, MX, 16);
  const ent = "Mexicali, peakScan false (16 h), office, area 100, height 3, occ 80, luz/equipo 0, ach 0";
  fila("CM.load.8.a", "ESHF", ent, `${a.eshf.toFixed(5)}`, CASA("3478"), "criterio de la casa", "LOADS[0].eshf", r(a.eshf, 5), 0.00005, "vigente");
  fila("CM.load.8.b", "ADP resuelto: la recta ESHF baja desde el cuarto y toca la saturación a 2.59 °C (zona de riesgo)", ent, `primer cruce de Wi − 1.006·(1−f)/(f·2450)·(24 − t) con Wsat(t, ${a.s.p.toFixed(3)} kPa) → ${a.adpRaw.toFixed(4)} °C`, `${PSY}; ${CASA("3078-3101")}`, "secundaria", "LOADS[0].adpRaw", r(a.adpRaw, 4), 0.002, "vigente");
  fila("CM.load.8.c", "ADP de trabajo limitado al piso práctico de 4.4 °C (1.7 ≤ ADP < 4.4 = riesgo)", ent, `${a.adpRaw.toFixed(3)} < 4.4 → 4.4`, CASA("3076, 3486-3489"), "criterio de la casa", "LOADS[0].adp", 4.4, 0.0001, "vigente");
  fila("CM.load.8.d", "caudal con ADP 4.4: salida 4.4 + 0.15 × 19.6 = 7.34 °C", ent, `${f(a.roomS)} / (${a.s.QS.toFixed(4)} × ${a.dTreal.toFixed(2)}) = ${f(a.supply)} m³/h = ${f(a.cfm)} CFM`, CASA("3491-3511"), "criterio de la casa", "LOADS[0].cfm", r(a.cfm), 0.05, "vigente");
  fila("CM.load.8.e", "aire exterior: rige Tab.45 por persona", ent, `máx((2.5×80 + 0.3×100)×3.6 = 828, 2,400, 180) = ${f(a.oa, 1)} m³/h`, CASA("2986"), "criterio de la casa", "LOADS[0].oa", r(a.oa), 0.01, "vigente");
}

/* ===== 9 · Proyecto fijo de regresión (parches/regresion-motores/regresion-motores.emp.json), Tijuana, barrido ===== */
{
  const dz = { wallMat: "light_block_20", roofMat: "roof_concrete_insul", glassMat: "glass_dgu", ach: 0.4, runHours: 16, spaceType: "office", lightType: "led", plenum: false, adpMargen: 2, serpentin: "auto", presion: "positiva" };
  const Z = [
    { ...dz, name: "Producción", area: 400, height: 6, occ: 30, lights: 8000, equip: 12000, walls: { N: 40, S: 40, E: 30, W: 30 }, roof: 400, glass: { N: 6, S: 4 } },
    { ...dz, name: "Oficinas", area: 100, height: 3, occ: 10, lights: 1500, equip: 2000, walls: { N: 12, S: 12, E: 10, W: 10 }, roof: 100 },
    { ...dz, name: "Limpio ISO 7", spaceType: "cleanroom", achClean: 45, area: 120, height: 3, occ: 2, lights: 720, equip: 2400, runHours: 24, fanPa: 600, fanEta: 55, roof: 0 },
    { ...dz, name: "Laboratorio HR", area: 80, height: 3, occ: 4, lights: 1200, equip: 2500, roof: 0, hrControl: "si" },
  ];
  const R = [barrido(Z[0], TJ), barrido(Z[1], TJ), dosCasos(Z[2], TJ), dosCasos(Z[3], TJ)];
  const tot = R.reduce((a, x) => ({ grand: a.grand + x.grand, cfm: a.cfm + x.cfm, oa: a.oa + x.oa }), { grand: 0, cfm: 0, oa: 0 });
  const ent = "REG_PROY (4 zonas: Producción 400 m² × 6 m con envolvente; Oficinas 100 × 3; Limpio ISO 7 120 × 3, 45 1/h, 600 Pa / 55 %, 24 h; Laboratorio HR 80 × 3 con hrControl), Tijuana, barrido, bldDiv 1";
  const FUE = CASA("3338-3553, 10594-10693", "método declarado; dos casos ASHRAE por decisión del dueño rev 2.9.20/2.9.21");
  fila("CM.load.9.a", "gran total del proyecto (W)", ent, `Σ zonas = ${R.map((x) => f(x.grand)).join(" + ")} = ${f(tot.grand)}`, FUE, "criterio de la casa", "totals().grand", r(tot.grand, 3), "0.01%", "vigente");
  fila("CM.load.9.b", "toneladas del proyecto", ent, `${f(tot.grand)} / 3,517 = ${(tot.grand / W_TON).toFixed(5)}`, FUE, "criterio de la casa", "totals().tons", r(tot.grand / W_TON, 6), "0.01%", "vigente");
  fila("CM.load.9.c", "caudal de suministro del proyecto (CFM)", ent, `Σ = ${R.map((x) => f(x.cfm)).join(" + ")} = ${f(tot.cfm)}`, FUE, "criterio de la casa", "totals().cfm", r(tot.cfm, 3), "0.01%", "vigente");
  fila("CM.load.9.d", "aire exterior del proyecto (m³/h)", ent, `Σ = ${R.map((x) => f(x.oa, 0)).join(" + ")} = ${f(tot.oa, 0)}`, `${T621}; ${CASA("2986")}`, "criterio de la casa", "totals().oa", r(tot.oa), 0.01, "vigente");
  ["Producción", "Oficinas", "Limpio ISO 7", "Laboratorio HR"].forEach((nom, k) => {
    fila(`CM.load.9.${"efgh"[k]}`, `zona ${nom}: gran total${k >= 2 ? " (dos casos)" : ` a las ${R[k].hour} h`}`, ent, `${f(R[k].grand)} W`, FUE, "criterio de la casa", `LOADS[${k}].grand`, r(R[k].grand, 3), "0.01%", "vigente");
  });
  fila("CM.load.9.i", "hora pico de Producción", ent, `barrido 8–18 h → ${R[0].hour} h`, FUE, "criterio de la casa", "LOADS[0].hour", R[0].hour, 0, "vigente");
  const L = R[3], C = R[2];
  fila("CM.load.9.j", "Laboratorio HR · caso de deshumidificación: W exterior (g/kg)", ent, "ASHRAE 2021 0.4 % DP de Tijuana: 14.2 g/kg (SITES)", CASA("3115", "ASHRAE Handbook—Fundamentals 2021, WMO 760013"), "criterio de la casa", "LOADS[3].casos.des.W", 14.2, 0.001, "vigente");
  fila("CM.load.9.k", "Laboratorio HR · deshumidificación: BS coincidente (°C)", ent, "22.8 °C (SITES)", CASA("3115"), "criterio de la casa", "LOADS[3].casos.des.db", 22.8, 0.001, "vigente");
  fila("CM.load.9.l", "Laboratorio HR · caso de enfriamiento: gran total", ent, `${f(L.r1.grand)} W a las ${L.r1.hour} h`, FUE, "criterio de la casa", "LOADS[3].casos.enf.grand", r(L.r1.grand, 3), "0.01%", "vigente");
  fila("CM.load.9.m", "Laboratorio HR · caso de deshumidificación: gran total (crédito sensible de aire exterior topado en 0)", ent, `${f(L.r2.grand)} W (latente ${f(L.r2.grandL)})`, FUE, "criterio de la casa", "LOADS[3].casos.des.grand", r(L.r2.grand, 3), "0.01%", "vigente");
  fila("CM.load.9.n", "Laboratorio HR · caso de deshumidificación: hora reportada (carga plana → la más cercana a las 15 h)", ent, "rango 0 → las 11 horas empatan → 15 h", CASA("3544-3548"), "criterio de la casa", "LOADS[3].casos.des.hour", L.r2.hour, 0, "vigente");
  fila("CM.load.9.o", "Laboratorio HR · modo «todo»: latente del equipo = la del caso de deshumidificación", ent, `${f(L.grandL)} W`, FUE, "criterio de la casa", "LOADS[3].grandL", r(L.grandL, 3), "0.01%", "vigente");
  fila("CM.load.9.p", "Laboratorio HR · ADP del caso de deshumidificación (°C)", ent, `${L.adp.toFixed(4)}`, `${PSY}; ${FUE}`, "secundaria", "LOADS[3].adp", r(L.adp, 4), 0.002, "vigente");
  fila("CM.load.9.q", "Limpio ISO 7 · calor del ventilador de recirculación Q·ΔP/η", ent, `(120 × 3 × 45 / 3600) m³/s × 600 Pa / 0.55 = ${f(C.r1.fanW)} W`, CASA("3429", "decisión del dueño rev 2.9.21"), "criterio de la casa", "LOADS[2].fanW", r(C.r1.fanW, 3), 0.01, "vigente");
  fila("CM.load.9.r", "Limpio ISO 7 · humedad de suministro requerida de la unidad de aire exterior (g/kg)", ent, `Wi − Lint/(ql·Qoa) = ${(C.r2.Wi * 1000).toFixed(4)} − ${f(C.r2.roomL)}/(${C.r2.s.QL.toFixed(4)} × ${f(C.r2.oa, 0)}) = ${(C.Wsup * 1000).toFixed(4)}`, FUE, "criterio de la casa", "LOADS[2].casos.equipo.oa.Wsup", r(C.Wsup * 1000, 2), 0.006, "vigente");
  fila("CM.load.9.s", "Limpio ISO 7 · ADP requerido de la unidad de aire exterior (°C)", ent, `rocío de (Wsup − 0.15·Wo,des)/0.85 = ${C.adpReq.toFixed(4)} (Newton propio)`, `${PSY}; ${FUE}`, "secundaria", "LOADS[2].casos.equipo.oa.adpReq", r(C.adpReq, 4), 0.002, "vigente");
  fila("CM.load.9.t", "Limpio ISO 7 · recirculación por el serpentín seco (m³/h)", ent, `45 × 360 − ${f(C.r2.oa, 0)} = ${f(C.Qrec, 0)}`, FUE, "criterio de la casa", "LOADS[2].casos.equipo.seco.Qrec", r(C.Qrec, 3), 0.01, "vigente");
  fila("CM.load.9.u", "Limpio ISO 7 · capacidad de la unidad de aire exterior (caso que rige)", ent, `${f(C.uSel.total)} W (${C.uSel.caso === "des" ? "deshumidificación" : "enfriamiento"})`, FUE, "criterio de la casa", "LOADS[2].casos.equipo.oa.sel.total", r(C.uSel.total, 3), "0.01%", "vigente");
  fila("CM.load.9.v", "Limpio ISO 7 · serpentín seco (caso que rige)", ent, `${f(C.secoSel)} W`, FUE, "criterio de la casa", "LOADS[2].casos.equipo.seco.sel.W", r(C.secoSel, 3), "0.01%", "vigente");
}

/* ===== 10 · Iluminación fluorescente y estratificación en nave alta ===== */
{
  const a = zona({ area: 100, height: 3, occ: 0, lights: 1000, equip: 0, ach: 0, roof: 0, spaceType: "office", lightType: "fluorescent" }, TJ, 16);
  const b = zona({ area: 100, height: 4.5, occ: 0, lights: 1000, equip: 0, ach: 0, roof: 0, spaceType: "office" }, TJ, 16);
  fila("CM.load.10.a", "iluminación fluorescente (balastro ×1.2)", "Tijuana, 16 h, office, area 100, height 3, lights 1000, lightType fluorescent", `1,000 × 1.2 × 0.75 × 0.95 × 1.0 = ${f(a.luz)} W`, CASA("3357", "×1.2 sin fuente"), "criterio de la casa", LINEA("Iluminación"), r(a.luz), 0.01, "vigente");
  fila("CM.load.10.b", "iluminación en local de 4.5 m sin pleno (estratificación 0.85)", "Tijuana, 16 h, office, area 100, height 4.5, plenum false, lights 1000", `1,000 × 0.75 × 0.95 × 0.85 = ${f(b.luz)} W`, CASA("3368", "decisión del dueño H-57"), "criterio de la casa", LINEA("Iluminación"), r(b.luz), 0.01, "vigente");
  const c = zona({ area: 100, height: 4.5, occ: 0, lights: 1000, equip: 0, ach: 0, roof: 0, spaceType: "office", plenum: true }, TJ, 16);
  fila("CM.load.10.c", "iluminación en local de 4.5 m con pleno de retorno (estratificación 0.70)", "Tijuana, 16 h, office, area 100, height 4.5, plenum true, lights 1000", `1,000 × 0.75 × 0.95 × 0.70 = ${f(c.luz)} W`, CASA("3358, 3368", "decisión del dueño H-57"), "criterio de la casa", LINEA("Iluminación"), r(c.luz), 0.01, "vigente");
  const d = zona({ area: 100, height: 3, occ: 0, lights: 1000, equip: 500, ach: 0, roof: 0, spaceType: "office", runHours: 12 }, TJ, 16);
  const ent12 = "Tijuana, 16 h, office, area 100, height 3, lights 1000, equip 500, runHours 12";
  fila("CM.load.10.d", "iluminación con operación de 12 h (almacenamiento 0.55, clase ligera)", ent12, `1,000 × 0.55 × 0.95 = ${f(d.luz)} W`, CASA("2995", "LIGHT_ST 12 h"), "criterio de la casa", LINEA("Iluminación"), r(d.luz), 0.01, "vigente");
  fila("CM.load.10.e", "equipos con operación de 12 h (almacenamiento 0.85)", ent12, `500 × 0.85 × 0.9 = ${f(d.eq)} W`, CASA("2996", "EQUIP_ST 12 h"), "criterio de la casa", LINEA("Equipos / fuerza"), r(d.eq), 0.01, "vigente");
}

/* ===== 11 · Aire exterior impuesto y por fracción; oscilación de temperatura (swing) ===== */
{
  const base = { area: 100, height: 3, occ: 10, lights: 1000, equip: 500, ach: 0, roof: 0, spaceType: "office" };
  const a = zona({ ...base, oaFixed: 1000 }, TJ, 16), b = zona({ ...base, oaFraction: 1 }, TJ, 16), c = zona({ ...ENV, swing: 2 }, TJ, 16);
  fila("CM.load.11.a", "aire exterior impuesto (reposición en cascada de cuartos limpios)", "caso 1 con oaFixed 1000 m³/h", `máx(300, 1,000) = ${f(a.oa, 1)} m³/h`, CASA("3461-3462"), "criterio de la casa", "LOADS[0].oa", r(a.oa), 0.01, "vigente");
  fila("CM.load.11.b", "aire exterior por fracción del suministro estimado con ΔT fijo de 11 K", "caso 1 con oaFraction 1.0", `roomS ${f(b.roomS)} / (0.34·ratio × 11) × 1.0 = ${f(b.oa)} m³/h (> 300)`, CASA("2990, 3459-3460", "HAP.dT 11 K sin fuente"), "criterio de la casa", "LOADS[0].oa", r(b.oa), 0.01, "vigente");
  fila("CM.load.11.c", "insolación con oscilación de 2 °C en masa media (almacenamiento × 0.85)", "caso 2 (envolvente Tijuana, 16 h) con swing 2", `3,141.6 × (1 − 2 × 0.03 × 2.5) = ${f(c.L["Insolación vidrio W"])} W`, CASA("3354-3356", "swing sin fuente"), "criterio de la casa", LINEA("Insolación vidrio W"), r(c.L["Insolación vidrio W"]), 0.05, "vigente");
}

/* ---- salida ---- */
const csvCell = (v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const cols = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
const csv = [cols.join(","), ...filas.map((x) => cols.map((k) => csvCell(x[k])).join(","))].join("\n") + "\n";
if (new Set(filas.map((x) => x.id)).size !== filas.length) throw new Error("ids repetidos");
if (process.argv.includes("--csv")) {
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "load.csv");
  fs.writeFileSync(out, csv, "utf8");
  console.log(`escrito ${out} (${filas.length} filas)`);
} else {
  for (const x of filas) console.log(`${x.id.padEnd(13)} ${String(x.esperado).padStart(14)} ±${String(x.tolerancia).padEnd(7)} ${x.estado.padEnd(12)} ${x.descripcion}`);
  console.log(`\n${filas.length} filas · vigentes ${filas.filter((x) => x.estado === "vigente").length} · fase2 ${filas.filter((x) => x.estado !== "vigente").length}`);
}
