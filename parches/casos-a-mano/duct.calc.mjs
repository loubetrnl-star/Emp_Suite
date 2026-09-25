#!/usr/bin/env node
/* Casos calculados a mano · motor DUCTOS (Fase 1, rev 2.9.24).
   Cálculo INDEPENDIENTE: no carga index.html ni pruebas.mjs. Imprime los esperados y, con --csv, escribe duct.csv.
   Uso: node parches/casos-a-mano/duct.calc.mjs [--csv]

   Fuentes:
   · Diámetro equivalente de Huebscher De = 1.30·(a·b)^0.625 / (a+b)^0.25 (ASHRAE Fundamentals 2017 cap. 21, ec. 25).
     El texto de ASHRAE no está en parches/normas-texto: carácter «de memoria» (la fórmula es de dominio común).
   · Darcy-Weisbach Δp/L = f/D·ρV²/2 con f de Haaland (1983): 1/√f = −1.8·log10[(ε/D/3.7)^1.11 + 6.9/Re], que es la que usa
     la suite; Colebrook (ASHRAE cap. 21 ec. 19) se calcula sólo como referencia (≈ +1.2 %, H-176, no se exige).
     En rectangular la fricción va con el caudal sobre el área del redondo equivalente (método ASHRAE, H-05).
   · Pérdida de accesorio Δp = C·ρV²/2 con la velocidad real de la sección. C del codo rectangular con álabes 0.28, tee de
     rama 0.65, salida a difusor 1.0, entrada acampanada 0.03: criterio de la casa (index.html FITTINGS, sin código DFDB,
     H-174).
   · Criterios de la casa (index.html, rev 2.9.24): ρ 1.2 kg/m³, μ 1.8e-5 Pa·s, ε 0.09 mm, clase 2" w.g., galvanizado
     (defaultState, línea 11127); serie de medidas STD_RECT/STD_ROUND (9071-9072); dimensionado a fricción constante 0.8
     Pa/m: redondo = primer diámetro de la serie con Pa/m ≤ 0.8·1.02 (sizeRoundEF 9161), rectangular = mínimo de
     |De − De_obj| + 5·|Pa/m − 0.8| + 2·(w/h − 1) con 1.5 ≤ V ≤ 20 m/s, w/h ≤ aspecto + 0.05 y Pa/m ≤ 0.8·1.08 (sizeRect
     9173); calibre por lado mayor en pulgadas con RECT_G/ROUND_G (9080-9097, sin número de tabla SMACNA: H-170/H-168) y
     espesor galvanizado GAUGE_T (9079); grasa +2 calibres (9145); lámina = perímetro × L × 1.12 (traslapes, H-175);
     acero 7,850 kg/m³; juntas cada 1.219 m (rectangular) o cada tramo comercial de 3.048 m (espiro); soportes cada 2.4 m
     (1.8 m si el lado mayor pasa de 900 mm).
   · Política de la casa «nada se estima» / «arranque en ceros» (decisión del dueño, 17-sep-2026): un tramo sin medida
     posible, sin caudal o con medida bloqueada sin capturar no lleva sección, kilos ni importe (H-166); generar desde la
     carga no pone longitudes ni accesorios que nadie capturó (H-167). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RHO = 1.2, MU = 1.8e-5, EPS = 0.09;           // criterio de la casa (defaultState)
const STEEL = 7850;                                   // kg/m³
const STD_RECT = [100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 900, 1000, 1100, 1200, 1400, 1500, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
const STD_ROUND = [100, 125, 150, 160, 180, 200, 224, 250, 280, 300, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600, 1800, 2000];
const GAUGE_T = { 28: .0187, 26: .0217, 24: .0276, 22: .0336, 20: .0396, 18: .0516, 16: .0635, 14: .0785, 13: .0934, 12: .1084, 11: .1233, 10: .1382 };
const GAUGE_ORDER = [28, 26, 24, 22, 20, 18, 16, 14, 13, 12, 11, 10];
const RECT_G = { "0.5": [[30, 26], [54, 24], [84, 22], [999, 20]], "2": [[12, 24], [30, 22], [48, 20], [60, 18], [999, 16]] };
const ROUND_G = { "0.5": [[14, 26], [26, 24], [36, 22], [999, 20]], "2": [[14, 22], [26, 20], [36, 18], [999, 16]] };
const r = (x, d = 4) => Number(x.toFixed(d));

const huebscher = (a, b) => 1.3 * Math.pow(a / 1000 * b / 1000, .625) / Math.pow(a / 1000 + b / 1000, .25) * 1000;
const areaR = (d) => Math.PI * (d / 1000) ** 2 / 4;
const haaland = (Re, rr) => { const inv = -1.8 * Math.log10(Math.pow(rr / 3.7, 1.11) + 6.9 / Re); return 1 / (inv * inv); };
const colebrook = (Re, rr) => { let f = .02; for (let i = 0; i < 60; i++) { const x = -2 * Math.log10(rr / 3.7 + 2.51 / (Re * Math.sqrt(f))); f = 1 / (x * x); } return f; };
/* Pa/m con el caudal Q (m³/s) sobre el redondo de diámetro D (mm) */
const pam = (Q, D, fx = haaland) => { const V = Q / areaR(D), Dm = D / 1000, Re = RHO * V * Dm / MU; return fx(Re, EPS / 1000 / Dm) / Dm * RHO * V * V / 2; };
const sizeRoundEF = (Q, obj) => STD_ROUND.find((d) => pam(Q, d) <= obj * 1.02) ?? STD_ROUND.at(-1);
function sizeRect(Q, obj, aspecto, hmax = 0) {
  const De0 = sizeRoundEF(Q, obj);
  let best = null;
  for (const h of STD_RECT) for (const w of STD_RECT) {
    if (w < h || w / h > Math.min(4, aspecto) + .05) continue;
    if (hmax > 0 && h > hmax) continue;
    const de = huebscher(w, h), V = Q / (w / 1000 * h / 1000);
    if (V > 20 || V < 1.5) continue;
    const p = pam(Q, de);
    if (p > obj * 1.08) continue;
    const sc = Math.abs(de - De0) + Math.abs(p - obj) * 5 + (w / h - 1) * 2;
    if (!best || sc < best.sc) best = { w, h, sc };
  }
  return best;                                           // null = ninguna medida de la serie cumple
}
const calibre = (tabla, pc, longMm, grasa) => {
  const pulg = longMm / 25.4; let g = tabla[pc].at(-1)[1];
  for (const [max, gg] of tabla[pc]) if (pulg <= max) { g = gg; break; }
  if (grasa) g = GAUGE_ORDER[Math.min(GAUGE_ORDER.length - 1, GAUGE_ORDER.indexOf(g) + 2)];
  return g;
};
/* Un tramo rectangular: Q en L/s, medida (w×h) ya resuelta, L en m, accesorios [[C, cant]]. */
function tramoRect(Qls, w, h, L, acc, pc = "2", grasa = false) {
  const Q = Qls / 1000, De = huebscher(w, h), A = w / 1000 * h / 1000, V = Q / A;
  const p = pam(Q, De), pc2 = pam(Q, De, colebrook), dyn = .5 * RHO * V * V;
  const fit = acc.reduce((a, [C, n]) => a + C * n * dyn, 0);
  const g = calibre(RECT_G, pc, Math.max(w, h), grasa), th = GAUGE_T[g] * 25.4;
  const sheet = 2 * (w + h) / 1000 * L * 1.12, kg = sheet * th / 1000 * STEEL;
  return { w, h, De, V, Pam: p, PamColebrook: pc2, fit, total: p * L + fit, g, th, sheet, kg,
    joints: Math.max(1, Math.ceil(L / 1.219)), hangers: Math.max(1, Math.ceil(L / (Math.max(w, h) > 900 ? 1.8 : 2.4))) };
}
function tramoRedondo(Qls, d, L, acc, pc = "2") {
  const Q = Qls / 1000, V = Q / areaR(d), p = pam(Q, d), dyn = .5 * RHO * V * V;
  const fit = acc.reduce((a, [C, n]) => a + C * n * dyn, 0);
  const g = calibre(ROUND_G, pc, d, false), th = GAUGE_T[g] * 25.4;
  const sheet = Math.PI * d / 1000 * L * 1.12, kg = sheet * th / 1000 * STEEL;
  const enteras = Math.floor(L / 3.048 + 1e-9), recorte = r(L - enteras * 3.048, 3);
  return { d, V, Pam: p, fit, total: p * L + fit, g, th, sheet, kg, enteras, recorte, coples: enteras + (recorte > .02 ? 1 : 0) - 1, joints: Math.max(1, Math.ceil(L / 3.048)) };
}

const filas = [];
const fila = (id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado = "vigente") =>
  filas.push({ id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado, calculado_por: "parches/casos-a-mano/duct.calc.mjs" });
const FH = "ASHRAE Fundamentals 2017 cap. 21 ec. 25 (Huebscher)";
const FD = "Darcy-Weisbach con f de Haaland (1983); Colebrook de referencia";
const FC = "criterio de la casa (index.html FITTINGS: codo rectangular con álabes C 0.28; sin código DFDB, H-174)";
const FS = "criterio de la casa (sizeRect index.html:9173, fricción constante 0.8 Pa/m, serie STD_RECT)";
const FG = "criterio de la casa (RECT_G clase 2\" y GAUGE_T galvanizado, index.html:9079-9088; sin tabla SMACNA citada, H-170)";
const FK = "criterio de la casa (perímetro × L × 1.12 de traslapes, acero 7,850 kg/m³; index.html:9362-9365, H-175)";

/* ---- CM.duct.1–3: los tres tramos del proyecto fijo de regresión (genera.mjs:33) ---- */
const FIJO = [
  { n: 1, tag: "TR-1", Q: 6000, L: 18, svc: "supply" },
  { n: 2, tag: "TR-2", Q: 3400, L: 12, svc: "supply" },
  { n: 3, tag: "RT-1", Q: 5000, L: 15, svc: "return" },
];
const CODOS = [[.28, 2]];
const resFijo = FIJO.map((c) => {
  const s = sizeRect(c.Q / 1000, .8, 3);
  const t = tramoRect(c.Q, s.w, s.h, c.L, CODOS);
  const ent = `${c.tag} ${c.svc === "return" ? "retorno" : "suministro"} ${c.Q} L/s, ${c.L} m, rectangular a fricción 0.8 Pa/m, aspecto 3, 2 codos C 0.28, clase 2", galvanizado`;
  const i = `DUCT.segs[${c.n - 1}]`;
  fila(`CM.duct.${c.n}.a`, "ancho elegido (mm)", ent, `mínimo de la puntuación de la casa sobre la serie: ${s.w} × ${s.h}`, FS, "criterio de la casa", `${i}.w`, s.w, 0);
  fila(`CM.duct.${c.n}.b`, "alto elegido (mm)", ent, `ídem: ${s.h}`, FS, "criterio de la casa", `${i}.h`, s.h, 0);
  fila(`CM.duct.${c.n}.c`, "diámetro equivalente (mm)", ent, `1.30·(${s.w / 1000}·${s.h / 1000})^0.625/(${s.w / 1000}+${s.h / 1000})^0.25 = ${r(t.De, 2)} mm`, FH, "de memoria", `${i}.De`, r(t.De, 2), 0.01);
  fila(`CM.duct.${c.n}.d`, "velocidad real (m/s)", ent, `${c.Q / 1000} / (${s.w / 1000}·${s.h / 1000}) = ${r(t.V, 4)} m/s`, "continuidad Q = V·A", "primaria", `${i}.V`, r(t.V, 4), 0.001);
  fila(`CM.duct.${c.n}.e`, "fricción (Pa/m)", ent, `Q sobre el redondo De; Haaland ${r(t.Pam, 4)} Pa/m (Colebrook ${r(t.PamColebrook, 4)})`, FD, "primaria", `${i}.Pam`, r(t.Pam, 4), 0.0005);
  fila(`CM.duct.${c.n}.f`, "pérdida en accesorios (Pa)", ent, `2 × 0.28 × ½·1.2·${r(t.V, 3)}² = ${r(t.fit, 3)} Pa`, FC, "criterio de la casa", `${i}.fitLoss`, r(t.fit, 3), 0.01);
  fila(`CM.duct.${c.n}.g`, "caída del tramo (Pa)", ent, `${r(t.Pam, 4)} × ${c.L} + ${r(t.fit, 3)} = ${r(t.total, 3)} Pa`, `${FD}; ${FC}`, "primaria", `${i}.total`, r(t.total, 3), 0.02);
  fila(`CM.duct.${c.n}.h`, "calibre", ent, `lado mayor ${Math.max(s.w, s.h)} mm = ${r(Math.max(s.w, s.h) / 25.4, 2)} in → calibre ${t.g}`, FG, "criterio de la casa", `${i}.gauge.gauge`, t.g, 0);
  fila(`CM.duct.${c.n}.i`, "lámina con traslapes (m²)", ent, `2·(${s.w / 1000}+${s.h / 1000}) × ${c.L} × 1.12 = ${r(t.sheet, 3)} m²`, FK, "criterio de la casa", `${i}.sheet`, r(t.sheet, 3), 0.01);
  fila(`CM.duct.${c.n}.j`, "kilos de lámina", ent, `${r(t.sheet, 3)} m² × ${r(t.th, 4)} mm × 7.85 = ${r(t.kg, 2)} kg`, FK, "criterio de la casa", `${i}.kg`, r(t.kg, 2), 0.05);
  fila(`CM.duct.${c.n}.k`, "juntas transversales", ent, `⌈${c.L} / 1.219⌉ = ${t.joints}`, "criterio de la casa (sección de 4 pies entre juntas, index.html:9370)", "criterio de la casa", `${i}.joints`, t.joints, 0);
  fila(`CM.duct.${c.n}.m`, "esquineros", ent, `4 por junta × ${t.joints} = ${4 * t.joints}`, "criterio de la casa (index.html:9376; ×4 por junta sin fuente, H-175)", "criterio de la casa", `${i}.corners`, 4 * t.joints, 0);
  fila(`CM.duct.${c.n}.l`, "soportes", ent, `⌈${c.L} / ${Math.max(s.w, s.h) > 900 ? 1.8 : 2.4}⌉ = ${t.hangers}`, "criterio de la casa (index.html:9372, H-175)", "criterio de la casa", `${i}.hangers`, t.hangers, 0);
  return { ...c, ...t };
});
/* ---- CM.duct.4: sistema del proyecto fijo ---- */
{
  const ent = "TR-1, TR-2 (suministro) y RT-1 (retorno) de CM.duct.1–3";
  const path = resFijo.reduce((a, x) => a + x.total, 0);
  fila("CM.duct.4.a", "circuito del equipo (suministro + retorno, Pa)", ent, resFijo.map((x) => r(x.total, 3)).join(" + ") + ` = ${r(path, 3)} Pa`, `${FD}; ${FC}`, "primaria", "DUCT.path", r(path, 3), 0.05);
  fila("CM.duct.4.b", "circuito de extracción y grasa (Pa)", ent, "sin tramos de extracción ni grasa = 0", "criterio de la casa (H-25: ventiladores propios)", "criterio de la casa", "DUCT.pathOtros", 0, 0);
  const kg = resFijo.reduce((a, x) => a + x.kg, 0), sheet = resFijo.reduce((a, x) => a + x.sheet, 0);
  fila("CM.duct.4.c", "kilos de lámina del proyecto", ent, resFijo.map((x) => r(x.kg, 2)).join(" + ") + ` = ${r(kg, 2)} kg`, FK, "criterio de la casa", "DUCT.boq.kg", r(kg, 2), 0.1);
  fila("CM.duct.4.d", "lámina del proyecto (m²)", ent, resFijo.map((x) => r(x.sheet, 3)).join(" + ") + ` = ${r(sheet, 3)} m²`, FK, "criterio de la casa", "DUCT.boq.sheet", r(sheet, 3), 0.02);
  const hojas = Math.ceil(sheet / (1.219 * 2.438));
  fila("CM.duct.4.e", "hojas de 4 × 8 pies (un solo calibre)", ent, `⌈${r(sheet, 3)} / (1.219 × 2.438)⌉ = ${hojas}`, "criterio de la casa (HOJAS_LAMINA, index.html:9215)", "criterio de la casa", "DUCT.boq.despiece.hojas", hojas, 0);
}
/* ---- CM.duct.5: redondo con medida bloqueada Ø500, 1,000 L/s, 12 m ---- */
{
  const t = tramoRedondo(1000, 500, 12, CODOS);
  const ent = "redondo bloqueado Ø500 mm, 1,000 L/s, 12 m, 2 codos C 0.28, clase 2\", galvanizado, tramo comercial 10 pies";
  fila("CM.duct.5.a", "fricción del redondo (Pa/m)", ent, `V = ${r(t.V, 4)} m/s; Haaland ${r(t.Pam, 4)} Pa/m`, FD, "primaria", "DUCT.segs[0].Pam", r(t.Pam, 4), 0.0005);
  fila("CM.duct.5.b", "caída del tramo (Pa)", ent, `${r(t.Pam, 4)} × 12 + ${r(t.fit, 3)} = ${r(t.total, 3)} Pa`, `${FD}; ${FC}`, "primaria", "DUCT.segs[0].total", r(t.total, 3), 0.02);
  fila("CM.duct.5.c", "calibre del redondo", ent, `Ø500 = 19.69 in → calibre ${t.g}`, "criterio de la casa (ROUND_G clase 2\", index.html:9089; sin tabla SMACNA de espiral, H-168 BLOQUEADO)", "criterio de la casa", "DUCT.segs[0].gauge.gauge", t.g, 0);
  fila("CM.duct.5.d", "kilos del redondo", ent, `π·0.5 × 12 × 1.12 × ${r(t.th, 4)} mm × 7.85 = ${r(t.kg, 2)} kg`, FK, "criterio de la casa", "DUCT.segs[0].kg", r(t.kg, 2), 0.05);
  fila("CM.duct.5.e", "espiroducto: tramos enteros de 10 pies", ent, `⌊12 / 3.048⌋ = ${t.enteras}`, "criterio de la casa (despieceSeg, index.html:9239)", "criterio de la casa", "DUCT.segs[0].despiece.enteras", t.enteras, 0);
  fila("CM.duct.5.f", "espiroducto: recorte (m)", ent, `12 − ${t.enteras} × 3.048 = ${t.recorte} m`, "criterio de la casa (despieceSeg)", "criterio de la casa", "DUCT.segs[0].despiece.recorte", t.recorte, 0.001);
  fila("CM.duct.5.g", "coples entre piezas", ent, `${t.enteras} + 1 piezas − 1 = ${t.coples}`, "criterio de la casa (despieceSeg)", "criterio de la casa", "DUCT.boq.despiece.coples", t.coples, 0);
}
/* ---- CM.duct.6: ducto de grasa 500 L/s clase ½" (H-165 BLOQUEADO: hoy +2 calibres galvanizado) ---- */
{
  const s = sizeRect(.5, .8, 3);
  const t = tramoRect(500, s.w, s.h, 6, CODOS, "0.5", true);
  const ent = "grasa 500 L/s, 6 m, rectangular a fricción 0.8 Pa/m, aspecto 3, clase ½\", galvanizado";
  fila("CM.duct.6.a", "medida del ducto de grasa (ancho mm)", ent, `${s.w} × ${s.h}`, FS, "criterio de la casa", "DUCT.segs[0].w", s.w, 0);
  fila("CM.duct.6.b", "calibre del ducto de grasa hoy", ent, `lado mayor ${Math.max(s.w, s.h)} mm → tabla clase ½" y +2 calibres = ${t.g}`, "criterio de la casa (index.html:9145; H-165 BLOQUEADO: NFPA 96 sin texto)", "criterio de la casa", "DUCT.segs[0].gauge.gauge", t.g, 0);
  fila("CM.duct.6.c", "aviso de velocidad bajo 7.6 m/s", ent, `V = ${r(t.V, 3)} m/s ${t.V < 7.6 ? "< 7.6 → 1 aviso" : "≥ 7.6 → sin aviso"}`, "criterio de la casa (index.html:9352; cita NFPA 96 derogada, H-162)", "criterio de la casa", "DUCT.segs[0].warn.filter((x) => /grasa/.test(x)).length", t.V < 7.6 ? 1 : 0, 0);
}
/* ---- CM.duct.9: suministro de 1,500 L/s + extracción de 1,000 L/s: la medida la decide la puntuación de la casa y la
   extracción va en su propio ventilador (H-25), no en el circuito del equipo ---- */
{
  const s1 = sizeRect(1.5, .8, 3), s2 = sizeRect(1.0, .8, 3);
  const t1 = tramoRect(1500, s1.w, s1.h, 10, CODOS), t2 = tramoRect(1000, s2.w, s2.h, 10, CODOS);
  const ent = "SA-9 suministro 1,500 L/s, 10 m y EX-9 extracción 1,000 L/s, 10 m; rectangulares a fricción 0.8 Pa/m, aspecto 3, 2 codos C 0.28";
  fila("CM.duct.9.a", "ancho elegido para 1,500 L/s (mm)", ent, `${s1.w} × ${s1.h}: De ${r(huebscher(s1.w, s1.h), 1)} contra el redondo objetivo; la fricción pesa ×5 en la puntuación (con ×50 saldría 650 × 400)`, FS, "criterio de la casa", "DUCT.segs[0].w", s1.w, 0);
  fila("CM.duct.9.b", "alto elegido para 1,500 L/s (mm)", ent, `ídem: ${s1.h}`, FS, "criterio de la casa", "DUCT.segs[0].h", s1.h, 0);
  fila("CM.duct.9.c", "circuito del equipo = sólo el suministro (Pa)", ent, `SA-9: ${r(t1.Pam, 4)} × 10 + ${r(t1.fit, 3)} = ${r(t1.total, 3)} Pa; la extracción no entra`, "criterio de la casa (H-25: extracción y grasa en ventiladores propios)", "criterio de la casa", "DUCT.path", r(t1.total, 3), 0.02);
  fila("CM.duct.9.d", "circuito de extracción (Pa)", ent, `EX-9 ${s2.w} × ${s2.h}: ${r(t2.Pam, 4)} × 10 + ${r(t2.fit, 3)} = ${r(t2.total, 3)} Pa`, `${FD}; ${FC}`, "primaria", "DUCT.pathOtros", r(t2.total, 3), 0.02);
}
/* ---- CM.duct.7: H-166 medidas inventadas (fase2) ---- */
{
  const sinCand = sizeRect(6, .8, 3, 200);
  if (sinCand) throw new Error("el caso 7.a debía quedarse sin candidato");
  const FN = "política de la casa «nada se estima» (decisión del dueño 17-sep-2026); H-166";
  fila("CM.duct.7.a", "sin medida posible: kilos del tramo", "rectangular 6,000 L/s, 18 m, alto máximo 200 mm (ninguna medida de la serie queda entre 1.5 y 20 m/s)", "ninguna medida cumple → sin sección, 0 kg (hoy 400×200 a 75 m/s)", FN, "criterio de la casa", "DUCT.segs[0].kg", 0, 0, "vigente");
  fila("CM.duct.7.b", "sin medida posible: el tramo queda con error visible", "ídem", "1 error en el tramo", FN, "criterio de la casa", "DUCT.segs[0].error ? 1 : 0", 1, 0, "vigente");
  fila("CM.duct.7.c", "medida bloqueada sin capturar (rectangular y redondo): kilos", "dos tramos bloqueados, 2,000 L/s, 10 m cada uno, sin ancho/alto ni diámetro capturados", "sin respaldo 400×200 ni Ø250 → 0 kg", FN, "criterio de la casa", "DUCT.boq.kg", 0, 0, "vigente");
  fila("CM.duct.7.d", "tramo sin caudal: kilos", "rectangular 0 L/s, 25 m", "sin caudal no hay sección → 0 kg (hoy 400×200, 225 kg)", FN, "criterio de la casa", "DUCT.boq.kg", 0, 0, "vigente");
  fila("CM.duct.7.e", "tramo sin caudal: importe de ducto en la cotización", "rectangular 0 L/s, 25 m, cruces autorizados", "sin kilos no hay partida de lámina → 0 MXN", FN, "criterio de la casa", "(QUOTE.aux.find((a) => a.mot === 'duct' && a.un === 'KG') || { total: 0 }).total", 0, 0, "vigente");
  fila("CM.duct.7.f", "tramo sin caudal: el tramo queda con error visible", "rectangular 0 L/s, 25 m", "1 error en el tramo", FN, "criterio de la casa", "DUCT.segs[0].error ? 1 : 0", 1, 0, "vigente");
  fila("CM.duct.7.g", "junto a un tramo sin caudal, el tramo sano conserva sus kilos", "TR-1 del proyecto fijo + tramo sin caudal de 25 m", `sólo TR-1: ${r(resFijo[0].kg, 2)} kg`, FK, "criterio de la casa", "DUCT.boq.kg", r(resFijo[0].kg, 2), 0.05, "vigente");
}
/* ---- CM.duct.8: H-167 generar desde la carga (fase2) ---- */
{
  const FN = "política de la casa «arranque en ceros» / «nada se estima» (decisión del dueño 17-sep-2026); H-167";
  const ent = "dos zonas con carga calculada y aire exterior; «Generar desde carga»";
  fila("CM.duct.8.a", "tramos generados (principal + 1 por zona + aire exterior)", ent, "1 + 2 + 1 = 4", "criterio de la casa (chainToDuct)", "criterio de la casa", "S.duct.segments.length", 4, 0);
  fila("CM.duct.8.b", "suma de longitudes generadas (m)", ent, "nadie las capturó → 0 m, pendiente de longitud (hoy 20 + 10 + 10 + 15 = 55 m)", FN, "criterio de la casa", "S.duct.segments.reduce((a, s) => a + s.length, 0)", 0, 0, "fase2:H-167");
  fila("CM.duct.8.c", "accesorios generados", ent, "nadie los capturó → 0 (hoy tee 0.65 + salida 1.0 por zona y entrada 0.03)", FN, "criterio de la casa", "S.duct.segments.reduce((a, s) => a + (s.fittings || []).length, 0)", 0, 0, "fase2:H-167");
  fila("CM.duct.8.d", "kilos de la red generada", ent, "sin longitud → 0 kg", FN, "criterio de la casa", "DUCT.boq.kg", 0, 0, "fase2:H-167");
  fila("CM.duct.8.e", "importe de ducto en la cotización", ent, "sin kilos no hay partida de lámina → 0 MXN", FN, "criterio de la casa", "(QUOTE.aux.find((a) => a.mot === 'duct' && a.un === 'KG') || { total: 0 }).total", 0, 0, "fase2:H-167");
}

for (const f of filas) console.log(`${f.id.padEnd(12)} ${String(f.esperado).padStart(12)} ± ${String(f.tolerancia).padEnd(6)} ${f.estado.padEnd(12)} ${f.descripcion}`);
if (process.argv.includes("--csv")) {
  const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const cab = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
  const out = [cab.join(",")].concat(filas.map((f) => cab.map((k) => q(f[k])).join(","))).join("\n") + "\n";
  const dest = path.join(path.dirname(fileURLToPath(import.meta.url)), "duct.csv");
  fs.writeFileSync(dest, out);
  console.log(`\n${filas.length} filas → ${dest}`);
}
