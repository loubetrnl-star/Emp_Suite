#!/usr/bin/env node
/* parches/casos-a-mano/soporte.calc.mjs · Fase 1 (rev 2.9.24) · cálculo INDEPENDIENTE de los esperados del motor de
   soportería (`soporte`). NO carga index.html, NO lee cifrasMotor ni el esperado de regresión: toda la aritmética está
   aquí, con su fuente al lado. Uso:
     node parches/casos-a-mano/soporte.calc.mjs          → imprime id, esperado, tolerancia y fórmula
     node parches/casos-a-mano/soporte.calc.mjs --csv    → además reescribe parches/casos-a-mano/soporte.csv
   Fuentes (ver README de parches/normas-texto y soporte.pendientes.md):
     [MSS]  ANSI/MSS SP-58-2018, claros máximos reproducidos por PHD Manufacturing (secundaria):
            acero  https://phd-mfg.com/wp-content/uploads/2018/06/6-Steel-Pipe_6-1-18.pdf
            cobre  https://phd-mfg.com/wp-content/uploads/2018/06/7-CopperTubeDIGlass_6-1-18.pdf
     [IPC]  IPC 2009 Tabla 308.5, folleto MCP (secundaria): https://www.mcpcity.com/DocumentCenter/View/1067/Hanger-Spacing-Handout
     [CASA] criterio de la casa, con renglón de index.html.
     [MEM]  ASCE 7-16 §13.3.1, ACI 318-19 cap. 17, NFPA 13, SMACNA DCS: texto NO disponible → de memoria (sólo vigilan
            la aritmética que la suite ya usa; no sirven para corregir). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const g = 9.80665;                       // m/s²
const ft = (x) => x * 0.3048;            // pies → m
const r = (x, n) => Math.round(x * 10 ** n) / 10 ** n;
const ceil = Math.ceil;

/* ---------- Tablas de claros (secundarias) ---------- */
const MSS_ACERO_FT = { '1/2"': 7, '3/4"': 7, '1"': 7, '1-1/4"': 7, '1-1/2"': 9, '2"': 10, '2-1/2"': 11, '3"': 12, '4"': 14, '6"': 17, '8"': 19, '10"': 22, '12"': 23 };   // [MSS] agua
const MSS_COBRE_FT = { '1/2"': 5, '3/4"': 5, '1"': 6, '1-1/4"': 7, '1-1/2"': 8, '2"': 8, '2-1/2"': 9, '3"': 10, '4"': 12 };                                         // [MSS] agua
const IPC_FT = { acero: 12, cobreChico: 6 /* ≤ 1¼" */, cobreGrande: 10 /* ≥ 1½" */, cpvcChico: 3 /* ≤ 1" */, cpvcGrande: 4 /* ≥ 1¼" */, ppChico: 32 / 12, ppGrande: 4 }; // [IPC]
const PULG = { '1/2"': 0.5, '3/4"': 0.75, '1"': 1, '1-1/4"': 1.25, '1-1/2"': 1.5, '2"': 2, '2-1/2"': 2.5, '3"': 3, '4"': 4, '6"': 6, '8"': 8, '10"': 10, '12"': 12 };
/* Decisión 4 del dueño (PLAN-CRITICOS.md §4): el mínimo de MSS SP-58 e IPC 308.5 por material y diámetro. */
const claroMin = (fam, dn) => {
  if (fam === "acero") return ft(Math.min(MSS_ACERO_FT[dn], IPC_FT.acero));
  if (fam === "cobre") return ft(Math.min(MSS_COBRE_FT[dn], PULG[dn] <= 1.25 ? IPC_FT.cobreChico : IPC_FT.cobreGrande));
  if (fam === "cpvc") return ft(PULG[dn] <= 1 ? IPC_FT.cpvcChico : IPC_FT.cpvcGrande);
  if (fam === "ppr") return ft(PULG[dn] <= 1 ? IPC_FT.ppChico : IPC_FT.ppGrande);
  throw new Error(fam);
};
const NFPA13_TOPE = ft(15);              // [MEM] NFPA 13: 15 ft para acero ≥ 1¼" (la suite topa en 4.6 m)
const SMACNA_RECT = ft(8);               // [MEM] SMACNA DCS Tabla 5-1: 8 ft (2.44 m) ducto rectangular — BLOQUEADO
const RIOSTRA_LONG = 24.4, RIOSTRA_TRANS = 12.2;   // [MEM] NFPA 13 cap. 18: 80 ft / 40 ft
const riostras = (L) => ({ long: Math.max(1, ceil(L / RIOSTRA_LONG)), trans: Math.max(1, ceil(L / RIOSTRA_TRANS)) });
const nSop = (L, e) => Math.max(2, ceil(L / e) + 1);   // [CASA] index.html:7778 · soportes = ceil(L/e) + 1

/* ---------- Pesos ---------- */
const RHO = { acero: 7850, cobre: 8940, agua: 1000 };    // kg/m³
const FA = 1.10;                                          // [CASA] index.html:7552 factor de accesorios
const pesoTubo = ({ od, pared, rho, agua = true }) => {   // kg/m (DE y pared en mm)
  const di = od - 2 * pared;
  const tubo = Math.PI / 4 * (od ** 2 - di ** 2) * 1e-6 * rho;
  const fluido = agua ? Math.PI / 4 * di ** 2 * 1e-6 * RHO.agua : 0;
  return { tubo, fluido, total: (tubo + fluido) * FA };
};
const B36 = { '2"': { od: 60.33, pared: 3.91 }, '4"': { od: 114.30, pared: 6.02 }, '6"': { od: 168.28, pared: 7.11 }, '8"': { od: 219.08, pared: 8.18 } };   // ASME B36.10M ced. 40
const B88L = { '3/4"': { od: 22.23, pared: 1.14 }, '1"': { od: 28.58, pared: 1.27 } };                                                                        // ASTM B88 tipo L
/* Termoplástico, camino propio de la suite [CASA] index.html:7372-7386: (tubo de acero ced. 40 × 0.22 + agua) × 1.10,
   con el nominal más cercano en la tabla PESO_TUB_ACERO (kg/m tubo, kg/m agua). */
const PESO_TUB_ACERO = { 15: [1.27, 0.196], 20: [1.69, 0.343], 25: [2.50, 0.556], 32: [3.39, 0.968], 40: [4.05, 1.314], 50: [5.44, 2.165], 65: [8.63, 3.087], 80: [11.29, 4.766], 100: [16.07, 8.219], 150: [28.26, 18.65], 200: [42.55, 32.27] };
const DN = [15, 20, 25, 32, 40, 50, 65, 80, 100, 150, 200, 250, 300];
const nominal = (dmm) => DN.reduce((a, b) => Math.abs(b - dmm) < Math.abs(a - dmm) ? b : a, DN[0]);
const pesoPlastico = (dmm) => { const [tubo, agua] = PESO_TUB_ACERO[Math.min(200, nominal(dmm))]; return (tubo * 0.22 + agua) * 1.10; };
/* Ducto: lámina galvanizada cal. 20 = 1.006 mm (MSG), 7.85 kg/m² por mm, ×1.20 de refuerzo [CASA] index.html:7486-7487, 7577 */
const pesoDuctoRect = (a, b, esp = 1.006, fr = 1.20) => { const des = 2 * (a + b) * 1e-3; const lam = r(des * esp * 7.85, 3); return { des, lam, total: r(lam * fr, 3) }; };

/* ---------- Varilla (MSS SP-58 Tabla 3 áreas de raíz UNC; 62.05 MPa admisible) ---------- */
const VARILLA = [['3/8"', 43.7], ['1/2"', 81.1], ['5/8"', 130.2], ['3/4"', 194.8], ['7/8"', 270.5], ['1"', 355.5]];
const adm = (a) => a * 62.05 / g;                          // kgf
const FS = 1.5;                                           // [CASA] H-49, index.html:8098
const varilla = (carga) => { const i = VARILLA.findIndex(([, a]) => adm(a) >= carga); return { idx: i, adm: adm(VARILLA[i][1]), fu: carga / adm(VARILLA[i][1]) }; };

/* ---------- Sismo ASCE 7-16 ec. 13.3-1..3 [MEM] ---------- */
const Fp = ({ Wp, SDS, Ip = 1, ap = 2.5, Rp = 9, z, h }) => {
  const calc = 0.4 * ap * SDS * Ip * Wp * (1 + 2 * Math.min(z / h, 1)) / Rp;
  return { calc, fin: Math.min(Math.max(calc, 0.3 * SDS * Ip * Wp), 1.6 * SDS * Ip * Wp) };
};

/* ---------- Anclaje ACI 318-19 cap. 17 [MEM], M10 postinstalado, sin borde, concreto agrietado ---------- */
const FC = 250 * 0.0980665;                               // f'c 250 kg/cm² = 24.517 MPa
const anclaM10 = ({ N, V, tau, fc = FC, hef = 70, d = 10, ase = 58, futa = 500 }) => {
  const Nua = N * g, Vua = V * g;
  const phiNsa = 0.65 * ase * futa;                       // 17.6.1.2 acero
  const Nb = 7 * Math.sqrt(fc) * hef ** 1.5;              // 17.6.2.2.1, kc = 7 postinstalado, λ = 1, ANc/ANco = 1, ψ = 1
  const phiNcb = 0.65 * Nb;
  const phiNa = 0.65 * tau * Math.PI * d * hef;           // 17.6.5.2.1 adherencia (ANa/ANao = 1)
  const phiNn = Math.min(phiNsa, phiNcb, phiNa);
  const phiVsa = 0.60 * 0.6 * ase * futa;                 // 17.7.1.2
  const phiVcp = 0.70 * 2.0 * Nb;                          // 17.7.3.2.1 cabeceo, kcp = 2
  const phiVn = Math.min(phiVsa, phiVcp);
  const rN = Nua / phiNn, rV = Vua / phiVn;
  const inter = rV <= 0.2 ? rN : rN <= 0.2 ? rV : (rN + rV) / 1.2;
  return { phiNn: phiNn / g, phiVn: phiVn / g, rN, rV, inter, rige: phiNn === phiNsa ? "acero" : phiNn === phiNcb ? "desprendimiento" : "adherencia" };
};

/* ---------- Trapecio: estática elemental + ASD (Fb = 0.6 Fy) [MEM]; L/240 [CASA] index.html:7507 ---------- */
const trapecio = ({ P_kgf, L, Sx = 3310, Ix = 77000, fy = 228, E = 200000 }) => {
  const P = P_kgf * g;
  const M = Math.max(P * L / 8, P * L / 4);               // N·mm: la puntual al centro (PL/4) manda sobre la repartida (PL/8)
  const Madm = 0.6 * fy * Sx;
  const dRep = 5 * P * L ** 3 / (384 * E * Ix), dPun = P * L ** 3 / (48 * E * Ix);
  const delta = Math.max(dRep, dPun), dAdm = L / 240;
  return { M_kgm: M / g / 1000, Madm_kgm: Madm / g / 1000, fu: M / Madm, delta, dAdm, fuDef: delta / dAdm };
};

/* ================================ CASOS ================================ */
const F = [];
const fila = (id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado = "vigente") =>
  F.push({ id, descripcion, entradas, formula, fuente, caracter, expresion, esperado, tolerancia, estado, calculado_por: "parches/casos-a-mano/soporte.calc.mjs" });
const SRC_MSS = "ANSI/MSS SP-58-2018 tabla de claros (PHD Manufacturing, 2018)";
const SRC_IPC = "IPC 2009 Tabla 308.5 (folleto MCP)";
const SRC_MIN = `mínimo de ${SRC_MSS} e ${SRC_IPC} · decisión 4 del dueño`;

/* --- Caso A · acero ced. 40 2" con agua, 30 m, hidrosanitario --- */
{
  const p = pesoTubo({ ...B36['2"'], rho: RHO.acero });
  const e = claroMin("acero", '2"');                      // 10 ft = 3.048 m (MSS) < 12 ft (IPC)
  const eTab = 3.0;                                       // la suite tabula 3.0 m (10 ft redondeado)
  const n = nSop(30, eTab), carga = p.total * eTab, cv = carga * FS, v = varilla(cv);
  const fp = Fp({ Wp: carga, SDS: 1, z: 6, h: 6 });
  const k = anclaM10({ N: carga, V: fp.fin, tau: 4.8 });
  const ri = riostras(30);
  const ENT = `acero ced. 40 2\" (DE 60.33, pared 3.91 mm), agua, L 30 m, hidrosanitario; ctx SDS 1.0, ap 2.5, Rp 9, Ip 1, z = h = 6 m, losa f'c 250 kg/cm², τcr 4.8 MPa declarado, FS 1.5`;
  fila("CM.soporte.1.a", "peso lineal lleno con accesorios", ENT, `π/4(60.33²−52.51²)·1e-6·7850 = ${r(p.tubo, 3)} + π/4·52.51²·1e-6·1000 = ${r(p.fluido, 3)}; (${r(p.tubo, 3)}+${r(p.fluido, 3)})×1.10`, "ASME B36.10M ced. 40; ρ 7850/1000; ×1.10 criterio de la casa (index.html:7552)", "secundaria", "CM_SOP.A.peso.total", r(p.total, 3), 0.005);
  fila("CM.soporte.1.b", "claro máximo acero 2\"", ENT, `min(MSS 10 ft, IPC 12 ft) = 10 ft × 0.3048 = ${r(e, 3)} m (la suite tabula 3.0)`, SRC_MIN, "secundaria", "CM_SOP.A.espaciamiento.e_m", r(e, 3), 0.06);
  fila("CM.soporte.1.c", "número de soportes", ENT, `ceil(30/3.0) + 1 = ${n}`, "criterio de la casa (index.html:7778) con el claro MSS", "secundaria", "CM_SOP.A.n_soportes", n, 0);
  fila("CM.soporte.1.d", "carga muerta por soporte", ENT, `${r(p.total, 3)} kg/m × 3.0 m = ${r(carga, 2)} kgf`, "criterio de la casa (index.html:7779)", "secundaria", "CM_SOP.A.carga_por_soporte_kgf", r(carga, 2), 0.1);
  fila("CM.soporte.1.e", "carga por varilla con FS 1.5", ENT, `${r(carga, 2)} × 1.5 = ${r(cv, 2)} kgf (1 varilla, colgante sencillo)`, "H-49 criterio de la casa (index.html:8098)", "secundaria", "CM_SOP.A.carga_por_varilla_kgf", r(cv, 2), 0.1);
  fila("CM.soporte.1.f", "carga admisible de la varilla 3/8\"", ENT, `43.7 mm² × 62.05 MPa / 9.80665 = ${r(v.adm, 1)} kgf`, "MSS SP-58 Tabla 3 (área de raíz UNC) · 62.05 MPa admisible (memoria)", "memoria", "CM_SOP.A.varilla.adm_kgf", r(v.adm, 1), 0.5);
  fila("CM.soporte.1.g", "factor de uso de la varilla 3/8\"", ENT, `${r(cv, 2)} / ${r(v.adm, 1)} = ${r(v.fu, 3)}`, "MSS SP-58 Tabla 3 · criterio de la casa", "memoria", "CM_SOP.A.varilla.fu", r(v.fu, 3), 0.002);
  fila("CM.soporte.1.h", "fuerza sísmica Fp por soporte", ENT, `0.4·2.5·1.0·1.0·${r(carga, 2)}·(1+2·1)/9 = ${r(fp.calc, 2)} kgf (entre 0.3·Wp = ${r(0.3 * carga, 2)} y 1.6·Wp = ${r(1.6 * carga, 2)})`, "ASCE 7-16 §13.3.1 ec. 13.3-1 (texto no disponible)", "memoria", "CM_SOP.A.sismo.Fp_kgf", r(fp.fin, 2), 0.06);
  fila("CM.soporte.1.i", "φNn del anclaje M10 (gobierna la adherencia)", ENT, `φNsa 0.65·58·500 = 18850 N; φNcb 0.65·7·√24.517·70^1.5 = ${r(0.65 * 7 * Math.sqrt(FC) * 70 ** 1.5, 0)} N; φNa 0.65·4.8·π·10·70 = ${r(0.65 * 4.8 * Math.PI * 10 * 70, 0)} N → mín /9.80665 = ${r(k.phiNn, 1)} kgf (${k.rige})`, "ACI 318-19 cap. 17 (17.6.1.2, 17.6.2.2.1, 17.6.5.2.1; texto no disponible)", "memoria", "CM_SOP.A.anclaje.phiNn_kgf", r(k.phiNn, 1), 0.5);
  fila("CM.soporte.1.j", "cortante por anclaje = Fp / varillas", ENT, `${r(fp.fin, 2)} / 1 = ${r(fp.fin, 2)} kgf`, "criterio de la casa (index.html:7803)", "memoria", "CM_SOP.A.anclaje.cortante_por_anclaje_kgf", r(fp.fin, 2), 0.06);
  fila("CM.soporte.1.k", "tensión por anclaje = carga / varillas", ENT, `${r(carga, 2)} / 1 = ${r(carga, 2)} kgf`, "criterio de la casa (index.html:7802)", "secundaria", "CM_SOP.A.anclaje.tension_por_anclaje_kgf", r(carga, 2), 0.1);
  fila("CM.soporte.1.l", "interacción del anclaje (sólo tensión, V ≤ 0.2 φVn)", ENT, `${r(carga, 2)} / ${r(k.phiNn, 1)} = ${r(k.inter, 3)}`, "ACI 318-19 17.8 (texto no disponible)", "memoria", "CM_SOP.A.anclaje.interaccion", r(k.inter, 3), 0.002);
  fila("CM.soporte.1.m", "riostras longitudinales", ENT, `max(1, ceil(30/24.4)) = ${ri.long}`, "NFPA 13 cap. 18 (80 ft; texto no disponible)", "memoria", "CM_SOP.A.arriostramiento.longitudinales", ri.long, 0);
  fila("CM.soporte.1.n", "riostras transversales", ENT, `max(1, ceil(30/12.2)) = ${ri.trans}`, "NFPA 13 cap. 18 (40 ft; texto no disponible)", "memoria", "CM_SOP.A.arriostramiento.transversales", ri.trans, 0);
}
/* --- Casos B y B′ · cobre tipo L 1" y ¾", 20 m --- */
{
  const p1 = pesoTubo({ ...B88L['1"'], rho: RHO.cobre }), p2 = pesoTubo({ ...B88L['3/4"'], rho: RHO.cobre });
  const e1 = claroMin("cobre", '1"'), e2 = claroMin("cobre", '3/4"');
  const ENT1 = `cobre tipo L 1\" (DE 28.58, pared 1.27 mm), agua, L 20 m, hidrosanitario; mismo ctx que el caso A`;
  const ENT2 = `cobre tipo L ¾\" (DE 22.23, pared 1.14 mm), agua, L 20 m, hidrosanitario; mismo ctx que el caso A`;
  fila("CM.soporte.2.a", "peso lineal lleno cobre 1\"", ENT1, `π/4(28.58²−26.04²)·1e-6·8940 = ${r(p1.tubo, 3)} + π/4·26.04²·1e-6·1000 = ${r(p1.fluido, 3)}; suma ×1.10`, "ASTM B88 tipo L; ρ 8940; ×1.10 criterio de la casa (index.html:7552)", "secundaria", "CM_SOP.B.peso.total", r(p1.total, 3), 0.005);
  fila("CM.soporte.2.b", "claro máximo cobre 1\"", ENT1, `min(MSS 6 ft, IPC ≤1¼\" 6 ft) = ${r(e1, 3)} m (antes de H-229 la suite tabulaba 1.8)`, SRC_MIN, "secundaria", "CM_SOP.B.espaciamiento.e_m", r(e1, 3), 0.04);
  fila("CM.soporte.2.c", "número de soportes cobre 1\" (H-229: con el claro MSS/IPC; antes ceil(20/1.8)+1 = 13)", ENT1, `ceil(20/${r(e1, 3)}) + 1 = ${nSop(20, e1)}`, "criterio de la casa (index.html:7778) con el claro MSS/IPC", "secundaria", "CM_SOP.B.n_soportes", nSop(20, e1), 0);
  fila("CM.soporte.3.a", "peso lineal lleno cobre ¾\"", ENT2, `π/4(22.23²−19.95²)·1e-6·8940 = ${r(p2.tubo, 3)} + π/4·19.95²·1e-6·1000 = ${r(p2.fluido, 3)}; suma ×1.10`, "ASTM B88 tipo L; ×1.10 criterio de la casa", "secundaria", "CM_SOP.B2.peso.total", r(p2.total, 3), 0.005);
  fila("CM.soporte.3.b", "claro máximo cobre ¾\" (antes de H-229: 1.8 m)", ENT2, `min(MSS 5 ft, IPC 6 ft) = 5 × 0.3048 = ${r(e2, 3)} m`, SRC_MIN, "secundaria", "CM_SOP.B2.espaciamiento.e_m", r(e2, 3), 0.04, "vigente");
  fila("CM.soporte.3.c", "número de soportes cobre ¾\" (antes de H-229: 13)", ENT2, `ceil(20/${r(e2, 3)}) + 1 = ${nSop(20, e2)}`, SRC_MIN, "secundaria", "CM_SOP.B2.n_soportes", nSop(20, e2), 0, "vigente");
}
/* --- Tabla de claros espSoporte(d_mm, fam): mínimo MSS/IPC por diámetro --- */
{
  const T = [
    ["a", 15, "cobre", '1/2"', "vigente", "antes de H-229: 1.8"], ["b", 20, "cobre", '3/4"', "vigente", "antes de H-229: 1.8"], ["c", 65, "cobre", '2-1/2"', "vigente", "antes de H-229: 3.0"],
    ["d", 100, "cobre", '4"', "vigente", "antes de H-229: 3.7; IPC 10 ft (tubing ≥ 1½\") gobierna sobre MSS 12 ft"],
    ["e", 50, "cobre", '2"', "vigente", ""], ["f", 40, "cobre", '1-1/2"', "vigente", ""], ["g", 80, "cobre", '3"', "vigente", ""], ["h", 32, "cobre", '1-1/4"', "vigente", "IPC 6 ft < MSS 7 ft"],
    ["i", 50, "acero", '2"', "vigente", ""], ["j", 15, "acero", '1/2"', "vigente", ""], ["k", 40, "acero", '1-1/2"', "vigente", ""], ["l", 80, "acero", '3"', "vigente", ""],
    ["m", 100, "acero", '4"', "fase2:H-233", "hoy 4.3; IPC 12 ft gobierna sobre MSS 14 ft (plomería; incendio sigue NFPA 13)"],
    ["n", 150, "acero", '6"', "fase2:H-233", "hoy 5.2; IPC 12 ft gobierna sobre MSS 17 ft"],
    ["o", 25, "cpvc", '1"', "vigente", ""], ["p", 50, "cpvc", '2"', "vigente", ""], ["q", 80, "cpvc", '3"', "vigente", ""],
    ["r", 100, "cpvc", '4"', "vigente", "antes de H-228: 1.8"], ["s", 150, "cpvc", '6"', "vigente", "antes de H-228: 1.8"],
    ["t", 25, "ppr", '1"', "vigente", "H-228: antes 0.9 como CPVC"], ["u", 50, "ppr", '2"', "vigente", "H-228: antes 1.2"],
  ];
  for (const [l, dmm, fam, dn, estado, nota] of T) {
    const e = claroMin(fam, dn);
    const plast = fam === "cpvc" || fam === "ppr";
    const famSuite = plast ? "plastico" : fam;
    const src = fam === "cpvc" ? `${SRC_IPC} (CPVC ${PULG[dn] <= 1 ? "≤ 1\": 3 ft" : "≥ 1¼\": 4 ft"})`
      : fam === "ppr" ? `${SRC_IPC} (PP ${PULG[dn] <= 1 ? "≤ 1\": 32 in" : "≥ 1¼\": 4 ft"})` : SRC_MIN;
    const form = fam === "cpvc" ? `${PULG[dn] <= 1 ? 3 : 4} ft × 0.3048 = ${r(e, 3)} m`
      : fam === "ppr" ? `${PULG[dn] <= 1 ? "32 in × 0.0254" : "4 ft × 0.3048"} = ${r(e, 3)} m`
      : fam === "acero" ? `min(MSS ${MSS_ACERO_FT[dn]} ft, IPC 12 ft) × 0.3048 = ${r(e, 3)} m`
      : `min(MSS ${MSS_COBRE_FT[dn]} ft, IPC ${PULG[dn] <= 1.25 ? 6 : 10} ft) × 0.3048 = ${r(e, 3)} m`;
    fila(`CM.soporte.4.${l}`, `claro máximo ${fam} ${dn}${nota ? " (" + nota + ")" : ""}`, `d = ${dmm} mm nominal, familia ${famSuite}`, form, src, "secundaria", plast ? `CM_SOP.esp(${dmm}, 'plastico', '${fam}')` : `CM_SOP.esp(${dmm}, '${famSuite}')`, r(e, 3), plast ? 0.02 : estado === "vigente" ? 0.06 : 0.02, estado);
  }
}
/* --- Caso C · ducto rectangular TR-1 1200×700 mm cal. 20, 18 m --- */
{
  const d = pesoDuctoRect(1200, 700);
  const n = nSop(18, 2.44), carga = d.total * 2.44;
  const ENT = "ducto rectangular 1200×700 mm, calibre 20 (1.006 mm), L 18 m, hvac; mismo ctx que el caso A";
  fila("CM.soporte.5.a", "peso lineal del ducto con refuerzo", ENT, `desarrollo 2(1.2+0.7) = ${d.des} m × 1.006 mm × 7.85 = ${d.lam} kg/m × 1.20 = ${d.total}`, "lámina galvanizada MSG cal. 20 = 1.006 mm; 7.85 kg/m² por mm; ×1.20 criterio de la casa (index.html:7486-7487, 7577)", "secundaria", "CM_SOP.C.peso.total", d.total, 0.02);
  fila("CM.soporte.5.b", "claro máximo ducto rectangular", ENT, `8 ft × 0.3048 = ${r(SMACNA_RECT, 3)} m`, "SMACNA HVAC DCS Tabla 5-1 (texto no disponible; BLOQUEADO)", "memoria", "CM_SOP.C.espaciamiento.e_m", r(SMACNA_RECT, 2), 0.01);
  fila("CM.soporte.5.c", "número de soportes", ENT, `ceil(18/2.44) + 1 = ${n}`, "criterio de la casa (index.html:7778)", "memoria", "CM_SOP.C.n_soportes", n, 0);
  fila("CM.soporte.5.d", "carga muerta por soporte", ENT, `${d.total} × 2.44 = ${r(carga, 2)} kgf`, "criterio de la casa (index.html:7779)", "memoria", "CM_SOP.C.carga_por_soporte_kgf", r(carga, 2), 0.1);
  fila("CM.soporte.5.e", "varillas por soporte del ducto rectangular (hoy 1)", ENT, "SMACNA DCS Tabla 5-1: par de colgantes («pair») por soporte = 2", "SMACNA HVAC DCS 2005 Tabla 5-1 (texto no disponible; BLOQUEADO hasta recibirlo)", "memoria", "CM_SOP.C.n_varillas", 2, 0, "fase2:H-227");
}
/* --- Red contra incendio acero 6", 30 m: el tope de NFPA 13 gobierna sobre MSS 17 ft --- */
{
  const e = Math.min(ft(MSS_ACERO_FT['6"']), NFPA13_TOPE);
  const n = nSop(30, 4.6);
  const ENT = "acero ced. 40 6\" (DE 168.28, pared 7.11 mm), agua, L 30 m, contra_incendio; mismo ctx que el caso A";
  fila("CM.soporte.6.a", "claro con tope NFPA 13", ENT, `min(MSS 17 ft = ${r(ft(17), 2)}, NFPA 13 15 ft = ${r(NFPA13_TOPE, 3)}) = ${r(e, 3)} m (la suite topa en 4.6)`, "NFPA 13 (15 ft para acero ≥ 1¼\"; texto no disponible)", "memoria", "CM_SOP.F.espaciamiento.e_m", r(e, 3), 0.04);
  fila("CM.soporte.6.b", "número de soportes", ENT, `ceil(30/4.6) + 1 = ${n}`, "NFPA 13 tope + criterio de la casa (index.html:7778)", "memoria", "CM_SOP.F.n_soportes", n, 0);
  fila("CM.soporte.6.c", "varilla mínima NFPA 13 para 6\": ½\" (índice 1 del catálogo)", ENT, "NFPA 13 Tabla 17.1.6.1: 5\" a 8\" → ½\" = índice 1 en C_SOP.VARILLA", "NFPA 13 varilla mínima por diámetro (texto no disponible)", "memoria", "CM_SOP.F.varillaIdx", 1, 0);
}
/* --- Hidráulica CPVC por el estado: 43.59 y 43.59 mm entregados por hidro, 25 y 18 m ---
   H-198 (rev 2.9.24): hidro ya no trae CPVC arriba de 2" CTS (el 2½" de 63 mm era un renglón «SIN VERIFICAR»). La general
   (3.7 L/s) queda fuera de catálogo en hidro y llega aquí con el tope de 2" (43.59 mm); la soportería la sigue contando
   (dependencia registrada: debería quedar pendiente). Antes: 63 mm, nominal 65. */
{
  const e1 = claroMin("cpvc", '1-1/2"'), e2 = claroMin("cpvc", '1-1/2"');   // 43.59 → nominal 40 (1½") en los dos: ≥ 1¼" → 4 ft
  /* H-228 (rev 2.9.24): la suite ya usa el claro IPC (1.219 m, antes 1.2): mismos conteos, carga por soporte ×1.219. */
  const n1 = nSop(25, e1), n2 = nSop(18, e2);
  const wl1 = pesoPlastico(43.59), carga1 = wl1 * e1;
  const ENT = "hidro.material cpvc; tramos AF-GENERAL 72 UM 25 m (d 43.59 mm, fuera de catálogo en hidro por H-198) y AF-RAMAL 20 UM 18 m (d 43.59 mm) entregados por hidro; ductos, incendio, aire y equipos vacíos; defaultSoporte()";
  const H = "SOPORTE.porTuberia.find((x) => x.etiqueta === 'Hidráulica y sanitario').det";
  fila("CM.soporte.7.a", "claro CPVC 43.59 mm (tope de 2\" CTS; antes 63 mm)", ENT, `IPC CPVC ≥ 1¼\": 4 ft × 0.3048 = ${r(e1, 3)} m (antes de H-228 la suite tabulaba 1.2)`, SRC_IPC, "secundaria", `${H}[0].e`, r(e1, 3), 0.002);
  fila("CM.soporte.7.b", "soportes tramo 1 (25 m)", ENT, `ceil(25/${r(e1, 3)}) + 1 = ${n1}`, `${SRC_IPC} + criterio de la casa (index.html:8110)`, "secundaria", `${H}[0].n`, n1, 0);
  fila("CM.soporte.7.c", "soportes tramo 2 (18 m, 43.59 mm → 1½\", 4 ft)", ENT, `ceil(18/${r(e2, 3)}) + 1 = ${n2}`, `${SRC_IPC} + criterio de la casa`, "secundaria", `${H}[1].n`, n2, 0);
  fila("CM.soporte.7.d", "peso lineal lleno CPVC 43.59 mm (camino propio; antes 63 mm)", ENT, `nominal 40 (DN más cercano a 43.59): (4.05 × 0.22 + 1.314) × 1.10 = ${r(wl1, 3)} kg/m`, "criterio de la casa (index.html:7372-7386)", "secundaria", `${H}[0].wl`, r(wl1, 3), 0.01);
  fila("CM.soporte.7.e", "carga por soporte CPVC 43.59 mm (antes 63 mm)", ENT, `${r(wl1, 3)} × ${r(e1, 3)} = ${r(carga1, 3)} kgf`, "criterio de la casa (index.html:8112)", "secundaria", `${H}[0].carga`, r(carga1, 3), 0.02);
  fila("CM.soporte.7.f", "soportes totales (sólo la red hidráulica)", ENT, `${n1} + ${n2} = ${n1 + n2}`, SRC_IPC, "secundaria", "SOPORTE.nSoportes", n1 + n2, 0);
  fila("CM.soporte.7.g", "abrazaderas cotizadas = soportes", ENT, `${n1 + n2}`, "criterio de la casa (index.html:8184)", "secundaria", "SOPORTE.part.filter((p) => /^Abrazadera/.test(p.desc)).reduce((a, p) => a + p.qty, 0)", n1 + n2, 0);
  /* H-228 (cerrado 25-sep-2026): sin SDS con fuente las anclas van «Por cotizar» (H-226), así que se cuentan en SOPORTE.anclajesPza
     (el despiece, antes de la compuerta de precio), no en las partidas con importe. Antes: 0 / 0. */
  fila("CM.soporte.7.h", "anclas del termoplástico (antes de H-228: 0)", ENT, `una por soporte y varilla: ${n1 + n2} × 1 = ${n1 + n2}`, "H-228: criterio de la casa del despiece (index.html, function despiece) aplicado también al camino propio", "secundaria", "SOPORTE.anclajesPza.reduce((a, x) => a + x.cnt, 0)", n1 + n2, 0);
  fila("CM.soporte.7.i", "tuercas y rondanas del termoplástico (antes de H-228: 0)", ENT, `(4 tuercas + 4 rondanas) × ${n1 + n2} = ${8 * (n1 + n2)}`, "H-228; criterio de la casa del despiece (index.html, function despiece)", "secundaria", "SOPORTE.part.filter((p) => /^Tuerca/.test(p.desc)).reduce((a, p) => a + p.qty, 0)", 8 * (n1 + n2), 0);
}
/* --- Trapecio P1000, luz 600 mm, 200 kgf puntual --- */
{
  const tp = trapecio({ P_kgf: 200, L: 600 });
  const ENT = "revisarTrapecio: perfil P1000 (Sx 3310 mm³, Ix 77000 mm⁴, Fy 228 MPa), luz 600 mm, 200 kgf, 1 línea";
  fila("CM.soporte.8.a", "momento de diseño (puntual al centro)", ENT, `max(PL/8, PL/4) = 200 × 0.6 / 4 = ${r(tp.M_kgm, 3)} kg·m`, "estática elemental (M = PL/4)", "memoria", "CM_SOP.T.momento_kgm", r(tp.M_kgm, 3), 0.01);
  fila("CM.soporte.8.b", "momento admisible ASD", ENT, `0.6 × 228 × 3310 = ${r(0.6 * 228 * 3310, 0)} N·mm / 9.80665 / 1000 = ${r(tp.Madm_kgm, 3)} kg·m`, "AISC ASD Fb = 0.6 Fy (memoria; criterio de la casa index.html:7506)", "memoria", "CM_SOP.T.momento_adm_kgm", r(tp.Madm_kgm, 3), 0.02);
  fila("CM.soporte.8.c", "factor de uso a flexión", ENT, `${r(tp.M_kgm, 3)} / ${r(tp.Madm_kgm, 3)} = ${r(tp.fu, 3)}`, "estática + ASD", "memoria", "CM_SOP.T.fu_flexion", r(tp.fu, 3), 0.002);
  fila("CM.soporte.8.d", "deflexión admisible L/240", ENT, `600 / 240 = ${tp.dAdm} mm`, "criterio de la casa (index.html:7507)", "memoria", "CM_SOP.T.deflexion_adm_mm", tp.dAdm, 0.001);
  fila("CM.soporte.8.e", "deflexión (puntual al centro)", ENT, `PL³/(48EI) = ${r(200 * g, 2)} × 600³ / (48 × 200000 × 77000) = ${r(tp.delta, 3)} mm`, "estática elemental", "memoria", "CM_SOP.T.deflexion_mm", r(tp.delta, 3), 0.005);
  fila("CM.soporte.8.f", "factor de uso a deflexión", ENT, `${r(tp.delta, 3)} / ${tp.dAdm} = ${r(tp.fuDef, 3)}`, "estática elemental", "memoria", "CM_SOP.T.fu_deflexion", r(tp.fuDef, 3), 0.003);
}
/* --- Anclaje M10 con τcr = 20 MPa: gobierna el desprendimiento --- */
{
  const k = anclaM10({ N: 100, V: 100, tau: 20 });
  const ENT = "revisarAnclaje: M10 (Ase 58 mm², futa 500 MPa, hef 70 mm), N 100 kgf, V 100 kgf, f'c 24.517 MPa, τcr 20 MPa, postinstalado, agrietado, sin borde";
  fila("CM.soporte.9.a", "φNn (desprendimiento del concreto)", ENT, `φNcb = 0.65 × 7 × √24.517 × 70^1.5 = ${r(0.65 * 7 * Math.sqrt(FC) * 70 ** 1.5, 0)} N < φNsa 18850 < φNa ${r(0.65 * 20 * Math.PI * 10 * 70, 0)} → /9.80665 = ${r(k.phiNn, 1)} kgf`, "ACI 318-19 17.6.2.2.1 kc = 7 (texto no disponible)", "memoria", "CM_SOP.K.phiNn_kgf", r(k.phiNn, 1), 0.5);
  fila("CM.soporte.9.b", "φVn (acero del ancla)", ENT, `φVsa = 0.60 × 0.6 × 58 × 500 = ${r(0.6 * 0.6 * 58 * 500, 0)} N < φVcp = 0.70 × 2 × Nb → /9.80665 = ${r(k.phiVn, 1)} kgf`, "ACI 318-19 17.7.1.2 y 17.7.3.2.1 (texto no disponible)", "memoria", "CM_SOP.K.phiVn_kgf", r(k.phiVn, 1), 0.5);
  fila("CM.soporte.9.c", "interacción (V/φVn = 0.094 ≤ 0.2 → sólo tensión)", ENT, `100 / ${r(k.phiNn, 1)} = ${r(k.inter, 3)}`, "ACI 318-19 17.8 (texto no disponible)", "memoria", "CM_SOP.K.interaccion", r(k.inter, 3), 0.002);
}
/* --- Fp con los topes --- */
{
  const piso = Fp({ Wp: 1000, SDS: 1, z: 0, h: 6 }), techo = Fp({ Wp: 1000, SDS: 1, Rp: 1, z: 6, h: 6 });
  fila("CM.soporte.10.a", "Fp con z = 0: manda el piso 0.3·SDS·Ip·Wp", "Wp 1000 kgf, SDS 1.0, Ip 1, ap 2.5, Rp 9, z 0, h 6", `fórmula 0.4·2.5·1000·(1+0)/9 = ${r(piso.calc, 1)} < piso 0.3 × 1000 = ${piso.fin}`, "ASCE 7-16 ec. 13.3-3 (texto no disponible)", "memoria", "CM_SOP.Fpiso.Fp_kgf", piso.fin, 0.1);
  fila("CM.soporte.10.b", "Fp calculado sin topes con z = 0", "ídem", `0.4·2.5·1000/9 = ${r(piso.calc, 1)}`, "ASCE 7-16 ec. 13.3-1", "memoria", "CM_SOP.Fpiso.Fp_calculado_kgf", r(piso.calc, 1), 0.1);
  fila("CM.soporte.10.c", "Fp con Rp = 1 y z = h: manda el techo 1.6·SDS·Ip·Wp", "Wp 1000 kgf, SDS 1.0, Ip 1, ap 2.5, Rp 1, z = h = 6", `fórmula 0.4·2.5·1000·3/1 = ${techo.calc} > techo 1.6 × 1000 = ${techo.fin}`, "ASCE 7-16 ec. 13.3-2", "memoria", "CM_SOP.Ftecho.Fp_kgf", techo.fin, 0.1);
  fila("CM.soporte.10.d", "Fp calculado sin topes con Rp = 1", "ídem", `${techo.calc}`, "ASCE 7-16 ec. 13.3-1", "memoria", "CM_SOP.Ftecho.Fp_calculado_kgf", techo.calc, 0.1);
}
/* --- Selección de varilla por carga: 716 kgf → 5/8" --- */
{
  const v = varilla(716);
  const ENT = "seleccionarVarilla(716 kgf, mínimo 3/8\")";
  fila("CM.soporte.12.a", "varilla elegida: 5/8\" (índice 2)", ENT, `3/8\" ${r(adm(43.7), 1)} y 1/2\" ${r(adm(81.1), 1)} no alcanzan; 5/8\" 130.2 × 62.05 / 9.80665 = ${r(v.adm, 1)} ≥ 716`, "MSS SP-58 Tabla 3 (memoria)", "memoria", "CM_SOP.V.idx", v.idx, 0);
  fila("CM.soporte.12.b", "carga admisible de 5/8\"", ENT, `${r(v.adm, 1)} kgf`, "MSS SP-58 Tabla 3 (memoria)", "memoria", "CM_SOP.V.adm_kgf", r(v.adm, 1), 0.5);
  fila("CM.soporte.12.c", "factor de uso", ENT, `716 / ${r(v.adm, 1)} = ${r(v.fu, 3)}`, "MSS SP-58 Tabla 3 (memoria)", "memoria", "CM_SOP.V.fu", r(v.fu, 3), 0.002);
}
/* --- Hidráulica en acero por el estado: 52.5 mm → 2" y 35.05 mm → 1¼" --- */
{
  const e1 = claroMin("acero", '2"'), e2 = claroMin("acero", '1-1/4"');
  const n1 = nSop(25, 3.0), n2 = nSop(18, 2.1);
  const p = pesoTubo({ ...B36['2"'], rho: RHO.acero });
  const ENT = "hidro.material acero; tramos AF-GENERAL 72 UM 25 m (d 52.5 mm → 2\") y AF-RAMAL 20 UM 18 m (d 35.05 → 1¼\") entregados por hidro; ductos, incendio, aire y equipos vacíos; defaultSoporte() (SDS 1.0 y colgado SIN capturar)";
  const H = "SOPORTE.porTuberia.find((x) => x.etiqueta === 'Hidráulica y sanitario').det";
  fila("CM.soporte.15.a", "claro acero 2\"", ENT, `min(MSS 10 ft, IPC 12 ft) = ${r(e1, 3)} m`, SRC_MIN, "secundaria", `${H}[0].e`, r(e1, 3), 0.06);
  fila("CM.soporte.15.b", "claro acero 1¼\"", ENT, `min(MSS 7 ft, IPC 12 ft) = ${r(e2, 3)} m`, SRC_MIN, "secundaria", `${H}[1].e`, r(e2, 3), 0.04);
  fila("CM.soporte.15.c", "soportes tramo 1", ENT, `ceil(25/3.0) + 1 = ${n1}`, SRC_MIN, "secundaria", `${H}[0].n`, n1, 0);
  fila("CM.soporte.15.d", "soportes tramo 2", ENT, `ceil(18/2.1) + 1 = ${n2}`, SRC_MIN, "secundaria", `${H}[1].n`, n2, 0);
  fila("CM.soporte.15.e", "peso lineal 2\" por el estado", ENT, `${r(p.total, 3)} kg/m (mismo cálculo que CM.soporte.1.a)`, "ASME B36.10M; ×1.10 criterio de la casa", "secundaria", `${H}[0].wl`, r(p.total, 3), 0.005);
  fila("CM.soporte.15.f", "soportes totales", ENT, `${n1} + ${n2} = ${n1 + n2}`, SRC_MIN, "secundaria", "SOPORTE.nSoportes", n1 + n2, 0);
  fila("CM.soporte.15.g", "sin altura de colgado capturada, la varilla no lleva importe (pendiente) (antes de H-225: 1 partida con importe)", ENT, "partidas de varilla con importe > 0 = 0 («Nada se estima»: sin captura → pendiente)", "H-225 · regla 6 de CLAUDE.md (nada se estima)", "primaria", "SOPORTE.part.filter((p) => /^Varilla/.test(p.desc) && p.total > 0).length", 0, 0, "vigente");
  fila("CM.soporte.15.h", "sin SDS/estructura/f'c capturados con fuente, el anclaje va «Por cotizar» (antes de H-226: 1 partida con importe)", ENT, "partidas de anclaje con importe > 0 = 0", "H-226 · ASCE 7-16 §13.3.1 exige SDS del sitio; regla 6 de CLAUDE.md", "primaria", "SOPORTE.part.filter((p) => /^Anclaje/.test(p.desc) && p.total > 0).length", 0, 0, "vigente");
}
/* --- Proyecto fijo de regresión (parches/regresion-motores): entradas de los otros motores --- */
{
  /* [etiqueta, familia, DN, L m, claro tabulado hoy] — diámetros y longitudes que entregan hidro, incendio, aire y ductos. */
  const TR = [["AF-GENERAL", "cobre", '2"', 25, 2.4], ["AF-RAMAL BAÑOS", "cobre", '1-1/2"', 18, 2.4], ["Cabezal", "acero", '3"', 30, 3.7], ["Montante (incendio)", "acero", '4"', 12, 4.3],
    ["Aire troncal", "acero", '1-1/4"', 60, 2.1], ["TR-1", "ducto", "1200×700", 18, 2.44], ["TR-2", "ducto", "900×600", 12, 2.44], ["RT-1", "ducto", "900×750", 15, 2.44]];
  let n = 0, nl = 0, nt = 0;
  const det = TR.map(([et, fam, dn, L, e]) => { const k = nSop(L, e), ri = riostras(L); n += k; nl += ri.long; nt += ri.trans; return `${et} ${L}/${e}→${k}`; });
  const hTrab = Math.max(3, 6 + 1.2);                     // [CASA] index.html:7982: altura de zona mayor (6 m) + 1.2
  const PU = { varilla38: 65, anclaM10: 95, abrazadera: 285, tuercaRondana: 9, riostra: 4200, riel: 385, base: 18500, tijeraMes: 32000 };   // referencia interna index.html:7962-7966, 7401-7409
  const ml = 0;                                           // H-225 (cerrado 25-sep-2026): sin altura de colgado capturada no hay ML de varilla (pendiente)
  const total = ml * PU.varilla38 + 0 * PU.anclaM10 /* H-226: anclaje Por cotizar */ + n * PU.abrazadera + n * 8 * PU.tuercaRondana + (nl + nt) * PU.riostra + 60 * PU.riel + 3 * PU.base + 3 * PU.tijeraMes;
  const ENT = "proyecto fijo parches/regresion-motores/regresion-motores.emp.json: 45 m de ducto (3 tramos), 145 m de tubería (cobre 2\"/1½\", acero 3\"/4\" incendio, acero 1¼\" aire), zona más alta 6 m, riel 60 m, 3 meses, 2 equipos cotizados + 1 compresor; precios de referencia interna PU_SOP_* como entrada";
  fila("CM.soporte.11.a", "soportes contados", ENT, det.join("; ") + ` = ${n}`, "claros MSS/IPC (cobre 2.4, acero 3.7/4.3/2.1) y SMACNA 2.44 (memoria); ceil(L/e)+1", "secundaria", "SOPORTE.nSoportes", n, 0);
  fila("CM.soporte.11.b", "riostras longitudinales", ENT, `Σ max(1, ceil(L/24.4)) = ${nl}`, "NFPA 13 cap. 18 (memoria); aplicado a todas las líneas (H-235 pendiente)", "memoria", "SOPORTE.nLong", nl, 0);
  fila("CM.soporte.11.c", "riostras transversales", ENT, `Σ max(1, ceil(L/12.2)) = ${nt}`, "NFPA 13 cap. 18 (memoria)", "memoria", "SOPORTE.nTrans", nt, 0);
  fila("CM.soporte.11.d", "altura de trabajo", ENT, `max(3, 6 + 1.2) = ${hTrab} m`, "criterio de la casa (index.html:7982)", "secundaria", "SOPORTE.hTrab", hTrab, 0.001);
  fila("CM.soporte.11.e", "equipo de elevación: tijera (alcance 10 m) para 7.2 m", ENT, "primer equipo con maxH ≥ 7.2 en ELEVACION → tijera, maxH 10", "criterio de la casa (index.html:7405-7409)", "secundaria", "SOPORTE.equipo.maxH", 10, 0);
  fila("CM.soporte.11.f", "meses de renta capturados", ENT, "3 capturados = 3", "captura", "secundaria", "SOPORTE.meses", 3, 0);
  fila("CM.soporte.11.g", "bases de equipo en vivo", ENT, "2 unidades cotizadas + 1 compresor de aire = 3", "criterio de la casa (index.html:8160-8163)", "secundaria", "SOPORTE.nEquipos", 3, 0);
  fila("CM.soporte.11.h", "abrazaderas = soportes", ENT, `${n}`, "criterio de la casa del despiece (index.html:7858)", "secundaria", "SOPORTE.part.filter((p) => /^Abrazadera/.test(p.desc)).reduce((a, p) => a + p.qty, 0)", n, 0);
  fila("CM.soporte.11.i", "riostras cotizadas", ENT, `${nl} + ${nt} = ${nl + nt}`, "NFPA 13 cap. 18 (memoria)", "memoria", "SOPORTE.part.filter((p) => /^Riostra/.test(p.desc)).reduce((a, p) => a + p.qty, 0)", nl + nt, 0);
  fila("CM.soporte.11.j", "total de la sección G (sin varilla ni anclaje: colgado pendiente H-225 y anclaje Por cotizar H-226; precios de referencia interna)", ENT, `0 (varilla pendiente) + 0 (anclaje Por cotizar) + ${n}×285 + ${n}×8×9 + ${nl + nt}×4200 + 60×385 + 3×18500 + 3×32000 = ${total}`, "aritmética de partidas con PU_SOP_* de referencia interna (sin fuente ni fecha: entrada, no norma)", "secundaria", "SOPORTE.total", total, 0.5);
  fila("CM.soporte.11b.a", "ML de varilla con altura de colgado CAPTURADA de 1 m", ENT + "; alturaColgadoM = 1", `${n} soportes × 1 varilla × 1.0 m = ${n}`, "criterio de la casa del despiece (index.html:7853-7855)", "secundaria", "SOPORTE.part.filter((p) => /^Varilla/.test(p.desc)).reduce((a, p) => a + p.qty, 0)", n, 0.01);
  fila("CM.soporte.11c.a", "renta con 0 meses capturados (antes de H-232: 1)", ENT + "; mesesElevacion = 0", "0 capturado se respeta = 0", "H-232 · política de pisos 2.9.16 (decisión del dueño): respetar el 0 (cerrado 25-sep-2026)", "primaria", "SOPORTE.meses", 0, 0);
  fila("CM.soporte.11d.a", "bases de equipo en modo gobernado (antes de H-231: 2, se perdía el compresor)", ENT + "; instantánea motores>soporte aceptada", "snap.nEquip = 2 + 1 = 3", "H-231: usar snap.nEquip (cerrado 25-sep-2026)", "primaria", "SOPORTE.nEquipos", 3, 0);
}

/* ================================ SALIDA ================================ */
const csvCampo = (v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const COLS = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
const csv = [COLS.join(","), ...F.map((f) => COLS.map((c) => csvCampo(f[c])).join(","))].join("\n") + "\n";
const ids = new Set(); F.forEach((f) => { if (ids.has(f.id)) throw new Error("id repetido " + f.id); ids.add(f.id); });
for (const f of F) console.log(`${f.id.padEnd(18)} ${String(f.esperado).padStart(10)} ±${String(f.tolerancia).padEnd(6)} ${f.estado.padEnd(12)} ${f.descripcion} · ${f.formula}`);
console.log(`\n${F.length} filas · ${F.filter((f) => /^fase2/.test(f.estado)).length} fase2`);
if (process.argv.includes("--csv")) {
  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "soporte.csv");
  fs.writeFileSync(out, csv, "utf8");
  console.log("hoja escrita:", out);
}
