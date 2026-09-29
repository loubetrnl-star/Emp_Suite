// mapa-cruces.mjs — comprobación reproducible de la independencia entre motores (tarea 8 del cierre, 29-sep-2026).
// Uso: node continuacion/mapa-cruces.mjs [index.html] > salida.txt
// Dos pruebas independientes:
//  A. ESTÁTICA: en el cuerpo de cada función raíz de un motor (y, en transitivo, de las funciones top-level que llama)
//     busca lecturas de la variable global de resultado de OTRO motor y de S.<clave de otro motor>. Antes de buscar
//     quita comentarios y el texto de las cadenas (no el de ${…}), para no contar menciones en textos de memoria.
//  B. DINÁMICA (jsdom, proyectos fijos 1 y 2 de parches/regresion-motores/): para cada disciplina d y cada otra clave de
//     captura k, reemplaza S[k] por la de un proyecto nuevo (defaultState) y recalcula; si cambian cifrasMotor(d) o
//     huellaMotor(d) (ENTRADAS), d depende de k. Así se detecta también lo que el escaneo estático no ve.
// Excepción permitida por el dueño: load/clean/equip entre sí. S.site / SITE_PROY / S.bldDiv = dato de Proyecto.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cargar } from "./arnes.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HTML = path.resolve(process.argv[2] || path.join(RAIZ, "index.html"));
const L = fs.readFileSync(HTML, "utf8").split(/\r?\n/);

const DISC = ["load", "clean", "equip", "duct", "vent", "elec", "hidro", "fuego", "aire", "civil", "soporte"];
const AGREG = ["quote", "kaizen", "valor"];
const ACOPLADOS = new Set(["load", "clean", "equip"]);
const RAICES = { load: ["computeLoad", "loadOf", "peakLoad"], clean: ["computeCleanAll", "computeClean"], equip: ["buildSystem", "cotizacionEquip"],
  duct: ["calcDuct"], vent: ["computeVent"], elec: ["computeElec"], hidro: ["computeHidro"], fuego: ["computeFuego"], aire: ["computeAire"],
  civil: ["computeCivil"], soporte: ["computeSoporte", "computeSoporteGobernado"], quote: ["computeQuote"], kaizen: ["computeKaizen", "kaizenLazy"],
  valor: ["computeIngValor", "valorLazy"] };
const GLOBAL = { load: ["LOADS", "SITE"], clean: ["CLEAN"], equip: ["SYS"], duct: ["DUCT"], vent: ["VENT"], elec: ["ELEC"], hidro: ["HIDRO"],
  fuego: ["FUEGO"], aire: ["AIRE"], civil: ["CIVIL"], soporte: ["SOPORTE"], quote: ["QUOTE"], kaizen: ["KAIZEN"], valor: ["VALOR"], proyecto: ["SITE_PROY"], valid: ["VALID"] };
const CLAVES_S = { load: ["zones", "sitioCarga", "peakScan", "forceTech"], clean: ["clean"], equip: ["equip", "sel", "sysForce", "qfam"], duct: ["duct"],
  vent: ["vent"], elec: ["elec"], hidro: ["hidro"], fuego: ["fuego"], aire: ["aire"], civil: ["civil"], soporte: ["soporte"], quote: ["quote"],
  kaizen: ["kaizen"], valor: ["kaizen"], proyecto: ["site", "bldDiv", "meta"],
  compartido: ["perms", "vinculos", "her"] };   /* permisos y propuestas de todo el proyecto: ningún motor de disciplina debe depender de ellos */
const NO_RECORRER = new Set(["recompute", "registrarVinculo", "render", "setPath", "sanearEstado", "validateAll", "projAutosave", "toast"]);

/* ---------- A. estática ---------- */
const fns = {};
for (let i = 0; i < L.length; i++) {
  const m = /^(?:async )?function ([A-Za-z0-9_$]+)\(/.exec(L[i]); if (!m) continue;
  let j = i; if (!/^\s*(?:async )?function [^{]*\{.*\}\s*$/.test(L[i]) || /\{\s*$/.test(L[i])) { j = i + 1; while (j < L.length && !/^\}/.test(L[j])) j++; }
  fns[m[1]] = { a: i, b: j };
}
/* Ayudantes top-level en flecha (const x = (…) => …). */
const arrows = [];
for (let i = 0; i < L.length; i++) {
  const m = /^(?:const|let) ([A-Za-z0-9_$]+) = (?:async )?(?:\([^)]*\)|[A-Za-z_$][\w$]*) =>(.*)$/.exec(L[i]); if (!m || fns[m[1]]) continue;
  arrows.push([m[1], i]);
}
/* Cierre de cada flecha: donde el balance de ( [ { vuelve a cero, contado sobre el texto sin cadenas ni comentarios. */
for (const [nom, i] of arrows) {
  let prof = 0, j = i;
  for (; j < L.length && j < i + 400; j++) {
    for (const ch of limpia(L[j])) { if ("([{".includes(ch)) prof++; else if (")]}".includes(ch)) prof--; }
    if (prof <= 0) break;
  }
  fns[nom] = { a: i, b: Math.min(j, L.length - 1) };
}
/* Quita comentarios y el texto de las cadenas conservando las expresiones ${…} de las plantillas. */
function limpia(src) {
  let out = "", i = 0; const st = [];   // pila de contextos: "`" plantilla, "{" expresión dentro de plantilla
  while (i < src.length) {
    const c = src[i], d = src[i + 1], enTpl = st[st.length - 1] === "`";
    if (enTpl) {
      if (c === "\\") { i += 2; continue; }
      if (c === "`") { st.pop(); out += "``"; i++; continue; }
      if (c === "$" && d === "{") { st.push("{"); out += "${"; i += 2; continue; }
      if (c === "\n") out += c; i++; continue;   /* conserva los saltos: las líneas reportadas son las del archivo */
    }
    if (c === "/" && d === "*") { const k = src.indexOf("*/", i + 2); const fin = k < 0 ? src.length : k + 2; out += " " + "\n".repeat((src.slice(i, fin).match(/\n/g) || []).length); i = fin; continue; }
    if (c === "/" && d === "/") { const k = src.indexOf("\n", i); i = k < 0 ? src.length : k; continue; }
    if (c === '"' || c === "'") { let k = i + 1; while (k < src.length && src[k] !== c && src[k] !== "\n") k += src[k] === "\\" ? 2 : 1; out += c + c; i = k + 1; continue; }
    if (c === "`") { st.push("`"); i++; continue; }
    if (c === "{" && st.length) { st.push("{"); out += c; i++; continue; }
    if (c === "}" && st[st.length - 1] === "{") { st.pop(); out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}
const cuerpo = (n) => { const f = fns[n]; return f ? limpia(L.slice(f.a, f.b + 1).join("\n")).split("\n").map((s, k) => [f.a + 1 + k, s]) : []; };
const dueñoGlobal = Object.fromEntries(Object.entries(GLOBAL).flatMap(([m, gs]) => gs.map((g) => [g, m])));
const dueñoS = {}; Object.entries(CLAVES_S).forEach(([m, ks]) => ks.forEach((k) => { if (!(k in dueñoS)) dueñoS[k] = m; }));
/* Excluye el acceso a propiedad (x.SYS, f().SYS) pero no la propagación (...LOADS). */
const RE_G = new RegExp(`(?<![\\w$])(?<![\\w$\\])]\\.)(?<!\\?\\.)(${Object.keys(dueñoGlobal).join("|")})(?![\\w$])(?!\\s*:)`, "g");
function lecturas(n, mot) {
  const out = [];
  for (const [ln, s] of cuerpo(n)) {
    let m; RE_G.lastIndex = 0;
    while ((m = RE_G.exec(s))) { const de = dueñoGlobal[m[1]]; if (de !== mot && !(mot === "valor" && de === "kaizen" && false)) out.push({ ln, lee: m[1], de }); }
    const r2 = /(?<![\w$])S\.([A-Za-z]+)/g;
    while ((m = r2.exec(s))) { const de = dueñoS[m[1]] || "otro"; if (!CLAVES_S[mot].includes(m[1])) out.push({ ln, lee: "S." + m[1], de }); }
  }
  return out;
}
function llamadas(n) {
  const set = new Set();
  for (const [, s] of cuerpo(n)) { const r = /(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g; let m; while ((m = r.exec(s))) if (fns[m[1]] && m[1] !== n && !NO_RECORRER.has(m[1])) set.add(m[1]); }
  return [...set];
}
function clasifica(mot, de) {
  if (de === mot) return null;
  if (de === "proyecto") return "Proyecto";
  if (de === "compartido") return ACOPLADOS.has(mot) ? "revisar (compartido)" : "CRUCE (compartido)";
  if (ACOPLADOS.has(mot) && ACOPLADOS.has(de)) return "permitido (load/clean/equip)";
  if (de === "valid" || de === "otro") return "revisar";
  return "CRUCE";
}
function estatica(mot, prof = 4) {
  const hall = [], vistos = new Set(RAICES[mot]); let frente = RAICES[mot].map((n) => [n, n]);
  for (let d = 0; d <= prof && frente.length; d++) {
    const nuevo = [];
    for (const [n, ruta] of frente) {
      for (const h of lecturas(n, mot)) { const t = clasifica(mot, h.de); if (t) hall.push({ ...h, fn: n, ruta, tipo: t }); }
      if (d < prof) for (const c of llamadas(n)) if (!vistos.has(c)) { vistos.add(c); nuevo.push([c, `${ruta} > ${c}`]); }
    }
    frente = nuevo;
  }
  return hall;
}

/* ---------- B. dinámica ---------- */
async function dinamica(fixture) {
  const w = await cargar(HTML); const G = (e) => w.eval(e);
  const P = fs.readFileSync(path.join(RAIZ, "parches/regresion-motores", fixture), "utf8");
  const base = () => { G("importarRespaldo")(P); const S = G("S"); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")(); return S; };
  /* La huella de un motor cuya migración al abrir sella con la hora (p. ej. la instantánea de soportería de H-307) cambia en
     cada apertura aunque sus cifras no: se compara sólo si dos aperturas seguidas dan la misma; si no, se reporta aparte. */
  base(); const h1 = Object.fromEntries(DISC.map((d) => [d, G("huellaMotor")(d)]));
  base(); const detH = Object.fromEntries(DISC.map((d) => [d, G("huellaMotor")(d) === h1[d]]));
  const cif = (d) => JSON.stringify(G("cifrasMotor")(d));
  const hue = (d) => (detH[d] ? G("huellaMotor")(d) : null);
  const antes = Object.fromEntries(DISC.map((d) => [d, [cif(d), hue(d)]]));
  const nuevo = G("defaultState")();
  /* Cambios a probar: la captura de cada motor como la de un proyecto nuevo; para permisos y propuestas, además, conceder uno
     que ninguna disciplina usa (load>quote, hacia la Cotización general). */
  const cambios = [];
  Object.entries(CLAVES_S).filter(([m]) => m !== "valor").forEach(([m, ks]) => ks.forEach((k) =>
    cambios.push({ m, nombre: `vaciar S.${k}`, hacer: (S) => { S[k] = JSON.parse(JSON.stringify(nuevo[k] ?? null)); } })));
  cambios.push({ m: "compartido", nombre: "conceder el permiso load>quote", hacer: (S) => { S.perms = { ...(S.perms || {}), "load>quote": true }; } });
  const res = [];
  for (const c of cambios) {
    const S = base(); c.hacer(S); G("KZ_CACHE").key = null; G("VZ_CACHE").key = null;
    try { G("recompute")(); } catch (e) { res.push({ fuente: `${c.m}: ${c.nombre}`, destino: "(recompute)", tipo: "error " + e.message }); continue; }
    for (const d of DISC) {
      if (d === c.m) continue;
      const dc = cif(d) !== antes[d][0], dh = hue(d) !== antes[d][1];
      if (dc || dh) res.push({ fuente: `${c.m}: ${c.nombre}`, destino: d, tipo: c.m === "proyecto" ? "Proyecto" : clasifica(d, c.m), que: [dc && "cifras", dh && "huella (sello)"].filter(Boolean).join(" y ") });
    }
  }
  return { res, errs: w.__errs, noDet: DISC.filter((d) => !detH[d]) };
}

const out = [];
out.push(`# Resultado de continuacion/mapa-cruces.mjs sobre ${path.relative(RAIZ, HTML)}`, "");
out.push("## A. Escaneo estático (sin comentarios ni cadenas; transitivo, profundidad 4)", "");
for (const mot of [...DISC, ...AGREG]) {
  const h = estatica(mot);
  const uniq = [...new Map(h.map((x) => [`${x.fn}:${x.ln}:${x.lee}`, x])).values()];
  out.push(`### ${mot} (${RAICES[mot].join(", ")})`);
  if (!uniq.length) out.push("- sin lecturas de otros motores");
  uniq.forEach((x) => out.push(`- [${x.tipo}] ${x.fn}:${x.ln} lee ${x.lee} (de ${x.de})${x.ruta.includes(">") ? ` · vía ${x.ruta}` : ""}`));
  out.push("");
}
out.push("## B. Prueba dinámica (vaciar la captura de otro motor, o conceder un permiso ajeno, y recalcular)", "");
for (const fx of ["regresion-motores.emp.json", "regresion-motores-2.emp.json"]) {
  const { res, errs, noDet } = await dinamica(fx);
  out.push(`### ${fx}`);
  if (noDet.length) out.push(`- huella no determinista entre dos aperturas (sólo se comparan sus cifras): ${noDet.join(", ")}`);
  if (!res.length) out.push("- ninguna disciplina cambió al vaciar la captura de otro motor");
  res.forEach((r) => out.push(`- [${r.tipo}] ${r.destino}: cambian ${r.que || "?"} al ${r.fuente}`));
  if (errs.length) out.push(`- errores de la página: ${errs.join(" | ")}`);
  out.push("");
}
/* ---------- C. ENTRADAS: qué ENTRADAS de otro motor anida cada llave ---------- */
out.push("## C. ENTRADAS (huella de cada motor): anidamientos", "");
{
  const a = L.findIndex((x) => /^const ENTRADAS = \{/.test(x)), b = L.findIndex((x, k) => k > a && /^\};/.test(x));
  const txt = limpia(L.slice(a + 1, b).join("\n")).split("\n");
  let llave = null; const anida = {};
  txt.forEach((x) => { const m = /^  ([a-z]+): /.exec(x); if (m) llave = m[1]; if (!llave) return;
    const r = /ENTRADAS(?:\.([a-z]+)|\[)/g; let k; while ((k = r.exec(x))) (anida[llave] = anida[llave] || new Set()).add(k[1] || "[k]"); });
  out.push(`- líneas ${a + 1}–${b + 1} de ${path.relative(RAIZ, HTML)}`);
  for (const mot of [...DISC, ...AGREG]) out.push(`- ${mot}: ${anida[mot] ? `anida ${[...anida[mot]].join(", ")}${DISC.includes(mot) ? " ← CRUCE" : ""}` : "no anida ENTRADAS de otro motor"}`);
  out.push("");
}
console.log(out.join("\n"));
process.exit(0);
