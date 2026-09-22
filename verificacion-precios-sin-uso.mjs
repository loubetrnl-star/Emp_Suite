#!/usr/bin/env node
/* =============================================================================
   verificacion.mjs · ¿SIGUEN sin uso los precios y tablas que la bitácora registra?
   -----------------------------------------------------------------------------
   Este script NO modifica nada: lee index.html (y opcionalmente pruebas.mjs y
   parches\) y prueba, con búsqueda estática exhaustiva y con una corrida
   dinámica en jsdom, que las claves de la bitácora `bitacora_precios_sin_uso.md`
   siguen sin ser leídas por ningún código. Sirve para volver a correrlo al
   final de cada revisión: si alguien conectó una de ellas (o abrió un acceso
   genérico a la tabla), el script FALLA y dice cuál.

   Uso:
     node verificacion.mjs [ruta\index.html] [--pruebas ruta\pruebas.mjs]
                           [--parches ruta\parches] [--sin-dinamico] [--json]
   Sin argumentos revisa el archivo real del proyecto (constante HTML_REAL).
   Código de salida: 0 = todo sigue sin uso (o solo hay avisos) ·
                     1 = alguna clave YA se lee o hay acceso genérico a su tabla ·
                     2 = no se pudo analizar.
   Dependencias: solo Node. La parte dinámica usa jsdom si lo encuentra (el
   proyecto ya lo trae en Emp_Suite\node_modules); si no, la omite y lo avisa.
   ============================================================================= */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

/* ------------------------------ configuración ------------------------------ */
const HTML_REAL = "C:/Users/ASUS/Desktop/Emp_Suite/index.html";
const BASES_JSDOM = [
  "C:/Users/ASUS/Desktop/Emp_Suite",
  "C:/Users/ASUS/AppData/Local/Temp/claude/C--Users-ASUS-Desktop-Emp-Suite/adef6c9e-0ac8-4195-9f3c-aee92b7d87f2/scratchpad/tests2",
];
/* Lo que la bitácora afirma. Si cambia, se corrige AQUÍ y en la bitácora. */
const PU_SOP_LEIDAS_ESPERADAS = ["rielUnistrut", "baseEquipo"];
const PU_SOP_MUERTAS = ["ductoRect", "ductoRedondo", "tubChica", "tubMedia", "tubGrande", "sismicoLong", "sismicoTrans"];
const PU_CIVIL_MUERTAS = ["castillo", "pinturaVinil"];
const RECETAS_SIN_PARTIDA = ["pinturaVinil", "castillo", "ducto", "tuberia"];
/* Dueños únicos de cada insumo huérfano: quién puede referirlos sin que cambie el veredicto */
const HUERFANOS_RECETA = { "EQ_CAT.soldadora": ["tuberia"], "CUADRILLAS.ducto": ["ducto"], "MO_CAT.cabo": [], "MO_CAT.ductero": ["ducto"] };

/* ------------------------------ argumentos --------------------------------- */
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const valor = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const posicionales = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && ["--pruebas", "--parches"].includes(args[i - 1])));
const HTML = path.resolve(posicionales[0] || HTML_REAL);
const DIR = path.dirname(HTML);
const PRUEBAS = path.resolve(valor("--pruebas") || path.join(DIR, "pruebas.mjs"));
const PARCHES = path.resolve(valor("--parches") || path.join(DIR, "parches"));
const SIN_DIN = flag("--sin-dinamico");
const JSON_OUT = flag("--json");

/* ------------------------------ utilidades --------------------------------- */
const resultados = [];          // { id, titulo, estado: "OK"|"FALLA"|"AVISO", detalle: [] }
function chequeo(id, titulo) {
  const r = { id, titulo, estado: "OK", detalle: [] };
  resultados.push(r);
  return { ok: (t) => r.detalle.push("  ok    " + t), aviso: (t) => { if (r.estado === "OK") r.estado = "AVISO"; r.detalle.push("  AVISO " + t); },
    falla: (t) => { r.estado = "FALLA"; r.detalle.push("  FALLA " + t); }, info: (t) => r.detalle.push("        " + t) };
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* Enmascara comentarios, cadenas, plantillas (solo su texto) y regex: la misma
   rutina que se usó en el barrido (probada contra 383 declaraciones de nivel superior). */
function enmascarar(raw) {
  const n = raw.length; const out = new Array(n); const esCodigo = new Uint8Array(n); const tipo = new Uint8Array(n);   // tipo: 0 código · 1 comentario · 2 texto de cadena/plantilla · 3 regex
  let i = 0; const pilaTpl = []; let prof = 0; let ultimo = ""; let ultimaPalabra = "";
  const antesDeRegex = (u, w) => u === "" || "(,=:[!&|?{};+-*%<>~^".includes(u) || ["return", "typeof", "case", "in", "of", "delete", "void", "throw", "new", "else", "do"].includes(w);
  const rell = (a, b) => { for (let k = a; k < b; k++) { out[k] = raw[k] === "\n" ? "\n" : " "; tipo[k] = 1; } };
  const cod = (k) => { out[k] = raw[k]; esCodigo[k] = 1; };
  const textoPlantilla = () => {
    while (i < n) {
      if (raw[i] === "\\") { out[i] = " "; out[i + 1] = " "; tipo[i] = 2; tipo[i + 1] = 2; i += 2; continue; }
      if (raw[i] === "`") { out[i] = "`"; i++; break; }
      if (raw[i] === "$" && raw[i + 1] === "{") { pilaTpl.push(prof); out[i] = " "; out[i + 1] = "{"; esCodigo[i + 1] = 1; prof++; i += 2; break; }
      out[i] = raw[i] === "\n" ? "\n" : " "; tipo[i] = 2; i++;
    }
  };
  while (i < n) {
    const c = raw[i], d = raw[i + 1];
    if (c === "/" && d === "/") { let j = raw.indexOf("\n", i); if (j < 0) j = n; rell(i, j); i = j; continue; }
    if (c === "/" && d === "*") { let j = raw.indexOf("*/", i + 2); j = j < 0 ? n : j + 2; rell(i, j); i = j; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < n && raw[j] !== c && raw[j] !== "\n") { if (raw[j] === "\\") j++; j++; }
      out[i] = c; for (let k = i + 1; k < j; k++) { out[k] = " "; tipo[k] = 2; } out[j] = c; i = j + 1; ultimo = c; ultimaPalabra = ""; continue;
    }
    if (c === "`") { out[i] = "`"; i++; textoPlantilla(); ultimo = "`"; ultimaPalabra = ""; continue; }
    if (c === "/" && antesDeRegex(ultimo, ultimaPalabra)) {
      let j = i + 1, enClase = false;
      while (j < n && raw[j] !== "\n") { if (raw[j] === "\\") { j += 2; continue; } if (raw[j] === "[") enClase = true; else if (raw[j] === "]") enClase = false; else if (raw[j] === "/" && !enClase) break; j++; }
      if (raw[j] === "/") { out[i] = "/"; for (let k = i + 1; k < j; k++) { out[k] = " "; tipo[k] = 3; } out[j] = "/"; j++; while (j < n && /[a-z]/i.test(raw[j])) { out[j] = raw[j]; j++; } i = j; ultimo = ")"; ultimaPalabra = ""; continue; }
    }
    if (c === "{") prof++;
    if (c === "}") { prof--; if (pilaTpl.length && pilaTpl[pilaTpl.length - 1] === prof) { pilaTpl.pop(); out[i] = "}"; esCodigo[i] = 1; i++; textoPlantilla(); ultimo = "`"; continue; } }
    cod(i);
    if (/\S/.test(c)) { if (/[A-Za-z_$0-9]/.test(c)) { ultimaPalabra = /[A-Za-z_$0-9]/.test(raw[i - 1] || "") ? ultimaPalabra + c : c; ultimo = c; } else { ultimo = c; ultimaPalabra = ""; } }
    i++;
  }
  return { code: out.join(""), raw, esCodigo, tipo };
}
function indiceLineas(texto) {
  const nl = []; for (let k = 0; k < texto.length; k++) if (texto.charCodeAt(k) === 10) nl.push(k);
  return (idx) => { let lo = 0, hi = nl.length; while (lo < hi) { const m = (lo + hi) >> 1; if (nl[m] < idx) lo = m + 1; else hi = m; } return lo + 1; };
}
function declaracionesTop(code) {
  const res = []; const n = code.length; let prof = 0, i = 0;
  while (i < n) {
    const c = code[i];
    if (prof === 0 && (c === "c" || c === "l" || c === "v")) {
      const m = /^(const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/.exec(code.slice(i, i + 200));
      if (m && (i === 0 || /[\s;}]/.test(code[i - 1]))) {
        let j = i + m[1].length; const decls = []; let profS = 0;
        const mm = /\s*([A-Za-z_$][\w$]*)\s*=/.exec(code.slice(j, j + 200));
        let nombre = mm[1]; let valIni = j + mm[0].length; let k = valIni;
        for (; k < n; k++) {
          const ch = code[k];
          if ("([{".includes(ch)) profS++; else if (")]}".includes(ch)) profS--;
          else if (profS === 0 && ch === ",") { const m2 = /^,\s*([A-Za-z_$][\w$]*)\s*=(?!=)/.exec(code.slice(k, k + 200)); if (m2) { decls.push({ nombre, valIni, valFin: k }); nombre = m2[1]; valIni = k + m2[0].length; k = valIni - 1; } }
          else if (profS === 0 && ch === ";") break;
          else if (profS === 0 && ch === "\n") { const resto = code.slice(k + 1, k + 40); if (/^(const|let|var|function|async function|class)\s/.test(resto)) { const previo = code.slice(valIni, k).trimEnd(); if (previo && !/[,=+\-*\/&|?:(\[{<>]$/.test(previo)) break; } }
        }
        decls.push({ nombre, valIni, valFin: k }); decls.forEach((d) => res.push({ ...d, ini: i, fin: k })); i = k + 1; continue;
      }
    }
    if ("([{".includes(c)) prof++; else if (")]}".includes(c)) prof--;
    i++;
  }
  return res;
}
/* Árbol de un literal { } / [ ] : nodos {tipo:"obj",props:[{clave,val}]} {tipo:"arr",items} {tipo:"num"} {tipo:"opaco",texto} */
function parsearLiteral(code, raw, ini, fin) {
  let i = ini; const ws = () => { while (i < fin && /\s/.test(code[i])) i++; };
  function opaco() { const desde = i; let p = 0; while (i < fin) { const ch = code[i]; if ("([{".includes(ch)) p++; else if (")]}".includes(ch)) { if (p === 0) break; p--; } else if (p === 0 && ch === ",") break; i++; } return { tipo: "opaco", texto: raw.slice(desde, i).trim(), pos: desde }; }
  function valor() { ws(); const ch = code[i]; if (ch === "{") return objeto(); if (ch === "[") return arreglo(); const o = opaco(); if (/^-?\d[\d_.]*(?:e[+-]?\d+)?$/i.test(o.texto)) return { tipo: "num", valor: Number(o.texto.replace(/_/g, "")), pos: o.pos }; return o; }
  function objeto() {
    const pos = i; i++; const props = [];
    for (;;) {
      ws(); if (i >= fin) break; if (code[i] === "}") { i++; break; } if (code[i] === ",") { i++; continue; }
      if (code.startsWith("...", i)) { i += 3; props.push({ clave: "...", val: opaco() }); continue; }
      let clave; const ini2 = i;
      if (code[i] === '"' || code[i] === "'") { const q = code[i]; let j = i + 1; while (j < fin && code[j] !== q) j++; clave = raw.slice(i + 1, j); i = j + 1; }
      else { const m = /^[A-Za-z_$0-9][\w$.]*/.exec(code.slice(i, i + 80)); if (!m) { i++; continue; } clave = m[0]; i += m[0].length; }
      ws();
      if (code[i] === ":") { i++; props.push({ clave, val: valor(), pos: ini2 }); }
      else if (code[i] === "(") { let p = 0; const d = i; while (i < fin) { const ch = code[i]; if ("([{".includes(ch)) p++; else if (")]}".includes(ch)) { p--; if (p === 0 && ch === "}") { i++; break; } } i++; } props.push({ clave, val: { tipo: "opaco", texto: "método", pos: d }, pos: ini2 }); }
      else props.push({ clave, val: { tipo: "opaco", texto: "corto", pos: ini2 }, pos: ini2 });
    }
    return { tipo: "obj", props, pos };
  }
  function arreglo() { const pos = i; i++; const items = []; for (;;) { ws(); if (i >= fin) break; if (code[i] === "]") { i++; break; } if (code[i] === ",") { i++; continue; } items.push(valor()); } return { tipo: "arr", items, pos }; }
  return valor();
}

/* ------------------------------ carga -------------------------------------- */
let html;
try { html = fs.readFileSync(HTML, "utf8"); } catch (e) { console.error("No pude leer " + HTML + ": " + e.message); process.exit(2); }
const a0 = html.indexOf("<script>"), b0 = html.lastIndexOf("</script>");
if (a0 < 0 || b0 < 0) { console.error("No hallé el <script> en " + HTML); process.exit(2); }
const raw = html.slice(a0 + 8, b0);
const lineaInicio = html.slice(0, a0 + 8).split("\n").length;
const M = enmascarar(raw);
const L = indiceLineas(raw);
const lin = (idx) => L(idx) + lineaInicio - 1;               // línea en el archivo real
const DECL = declaracionesTop(M.code);
const decl = (n) => DECL.find((d) => d.nombre === n);
const REV = (/const REV = "([^"]+)"/.exec(raw) || [])[1] || "?";
const sha = crypto.createHash("sha256").update(html).digest("hex").slice(0, 16);

/* Apariciones de un identificador en CÓDIGO (sin comentarios ni cadenas), fuera de rangos excluidos */
function usos(nombre, excluir = []) {
  const re = new RegExp("(?<![\\w$.])" + esc(nombre) + "(?![\\w$])", "g");
  const res = []; let m;
  while ((m = re.exec(M.code))) {
    if (excluir.some(([a, b]) => m.index >= a && m.index < b)) continue;
    res.push({ idx: m.index, linea: lin(m.index), despues: M.code.slice(m.index + nombre.length, m.index + nombre.length + 60) });
  }
  return res;
}
const rangoDe = (n) => { const d = decl(n); return d ? [[d.valIni - 1 - ("const " + n + " ").length, d.valFin]] : []; };
const claves = (n) => { const d = decl(n); if (!d) return null; const ini = M.code.slice(d.valIni, d.valFin).search(/\S/) + d.valIni; return parsearLiteral(M.code, raw, ini, d.valFin); };
const propsDe = (n) => { const a = claves(n); return a && a.tipo === "obj" ? a.props.map((p) => p.clave).filter((k) => k !== "...") : null; };

/* Clasifica cada aparición de TABLA: .clave · ["clave"] · acceso genérico */
function lecturasDeTabla(tabla) {
  const excl = rangoDe(tabla);
  const lect = {}; const genericos = [];
  for (const u of usos(tabla, excl)) {
    const d = u.despues;
    let m;
    if ((m = /^\s*\.\s*([A-Za-z_$][\w$]*)/.exec(d))) {
      // ¿asignación? (tabla.clave = ...) no es lectura
      const resto = d.slice(m[0].length);
      if (/^\s*=(?!=)/.test(resto)) genericos.push({ linea: u.linea, tipo: "asignación a " + tabla + "." + m[1] });
      else (lect[m[1]] ||= []).push(u.linea);
    } else if ((m = /^\s*\[\s*(["'])([^"']+)\1\s*\]/.exec(d))) (lect[m[2]] ||= []).push(u.linea);
    else genericos.push({ linea: u.linea, tipo: "acceso genérico: " + raw.slice(Math.max(0, u.idx - 30), u.idx + tabla.length + 40).replace(/\s+/g, " ").trim() });
  }
  // cadenas que nombran la tabla o "tabla[...]" computado también cuentan como genérico (el enmascarado dejó las cadenas en blanco)
  return { lect, genericos };
}

/* ============================ 1. PU_SOP ==================================== */
{
  const c = chequeo("PU_SOP", "PU_SOP: siete claves sin lectura (solo rielUnistrut y baseEquipo se leen)");
  const def = propsDe("PU_SOP");
  if (!def) c.falla("no hallé const PU_SOP");
  else {
    const { lect, genericos } = lecturasDeTabla("PU_SOP");
    c.info(`definida en línea ${lin(decl("PU_SOP").valIni)} · claves: ${def.join(", ")}`);
    if (genericos.length) genericos.forEach((g) => c.falla(`L${g.linea}: ${g.tipo}  → ya no se puede afirmar qué claves se leen`));
    const leidas = Object.keys(lect).sort();
    c.info("claves con lectura: " + (leidas.map((k) => `${k} (L${lect[k].join(",")})`).join(" · ") || "ninguna"));
    PU_SOP_MUERTAS.forEach((k) => { if (!def.includes(k)) c.aviso(`la clave ${k} ya no existe en PU_SOP (¿se borró o renombró?)`); else if (lect[k]) c.falla(`PU_SOP.${k} YA se lee en L${lect[k].join(",")}`); else c.ok(`PU_SOP.${k} sin lectura`); });
    PU_SOP_LEIDAS_ESPERADAS.forEach((k) => { if (!lect[k]) c.aviso(`PU_SOP.${k} dejó de leerse (la bitácora dice que es de las dos que sí se leen)`); });
    def.filter((k) => !PU_SOP_MUERTAS.includes(k) && !PU_SOP_LEIDAS_ESPERADAS.includes(k) && !lect[k]).forEach((k) => c.aviso(`clave NUEVA sin lectura en PU_SOP: ${k} (agregarla a la bitácora)`));
    // nombres como cadena: "ductoRect" en algún literal podría servir de acceso dinámico
    PU_SOP_MUERTAS.forEach((k) => { const re = new RegExp("[\"'`]" + esc(k) + "[\"'`]"); const m = re.exec(raw); if (m && M.tipo[m.index + 1] === 2) c.aviso(`"${k}" aparece como cadena en L${lin(m.index)}: ${raw.split("\n")[L(m.index) - 1].trim().slice(0, 90)}`); });
  }
  // patrones de acceso dinámico global (eval, new Function, window[..])
  const din = [...M.code.matchAll(/\beval\s*\(|new\s+Function\s*\(|\bwindow\s*\[|\bglobalThis\s*\[|\bwith\s*\(/g)];
  if (din.length) din.forEach((m) => resultados[resultados.length - 1].detalle.push(`  AVISO L${lin(m.index)}: ${m[0]} en código: hay acceso dinámico posible a cualquier constante`)), resultados[resultados.length - 1].estado = resultados[resultados.length - 1].estado === "FALLA" ? "FALLA" : "AVISO";
  else resultados[resultados.length - 1].detalle.push("  ok    sin eval / new Function / window[...] / globalThis[...] / with en el código: no hay accesos dinámicos por nombre");
}

/* ============================ 2. SOP_ACERO / SOP_COBRE ===================== */
{
  const c = chequeo("SOP_TABLAS", "SOP_ACERO y SOP_COBRE: solo alcanzables por espSoporte(), y en vivo solo se llama con \"plastico\"");
  const dA = decl("SOP_ACERO"), dC = decl("SOP_COBRE"), dE = decl("espSoporte");
  /* rev 2.9.16 · Decisión del dueño: las dos tablas salieron de la lista activa y quedaron archivadas en la bitácora. Que no
     existan es lo esperado; que reaparezcan sin su lectura también se sigue revisando abajo. */
  if (!dA && !dC) c.ok("SOP_ACERO y SOP_COBRE archivadas (rev 2.9.16): ya no están en la lista activa");
  else if (!dA || !dC) c.falla("sólo una de SOP_ACERO / SOP_COBRE sigue en el código: archivado a medias");
  else {
    c.info(`SOP_ACERO L${lin(dA.valIni)} · SOP_COBRE L${lin(dC.valIni)} · espSoporte L${dE ? lin(dE.valIni) : "?"}`);
    const rangoEsp = dE ? [[dE.valIni - 1 - "const espSoporte ".length, dE.valFin]] : [];
    for (const [nom, d] of [["SOP_ACERO", dA], ["SOP_COBRE", dC]]) {
      const u = usos(nom, rangoDe(nom));
      const fuera = u.filter((x) => !rangoEsp.some(([a, b]) => x.idx >= a && x.idx < b));
      if (fuera.length) fuera.forEach((x) => c.falla(`${nom} se lee fuera de espSoporte: L${x.linea}`)); else c.ok(`${nom}: ${u.length} referencia(s), todas dentro de espSoporte()`);
    }
    // llamadas a espSoporte en código
    const llamadas = usos("espSoporte", rangoEsp);
    const vivas = [];
    for (const u of llamadas) {
      const m = /^\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/.exec(M.code.slice(u.idx + "espSoporte".length, u.idx + 400));
      if (!m) { c.falla(`L${u.linea}: espSoporte referenciada sin llamada directa (¿pasada como función?)`); continue; }
      const cruda = raw.slice(u.idx + "espSoporte".length, u.idx + "espSoporte".length + m[0].length);
      const partes = cruda.replace(/^\s*\(|\)\s*$/g, "").split(",");
      const fam = (partes[partes.length - 1] || "").trim();
      vivas.push({ linea: u.linea, fam });
    }
    vivas.forEach((v) => { if (/^["']plastico["']$/.test(v.fam)) c.ok(`L${v.linea}: espSoporte(..., ${v.fam}) → lee SOP_PLASTICO, no las dos tablas`); else c.falla(`L${v.linea}: espSoporte(..., ${v.fam}) → alcanza SOP_ACERO/SOP_COBRE en código de producción`); });
    if (!vivas.length) c.aviso("espSoporte ya no tiene ninguna llamada en producción (SOP_PLASTICO también quedaría sin uso)");
  }
  // lado de las pruebas y parches (informativo)
  if (fs.existsSync(PRUEBAS)) {
    const lp = fs.readFileSync(PRUEBAS, "utf8").split("\n"); const hits = [];
    lp.forEach((t, i) => { if (/espSoporte|SOP_ACERO|SOP_COBRE|PU_SOP\b|PU_CIVIL\.(castillo|pinturaVinil)/.test(t)) hits.push(`pruebas.mjs L${i + 1}: ${t.trim().slice(0, 100)}`); });
    resultados[resultados.length - 1].detalle.push("        lectores en pruebas.mjs: " + (hits.length ? "" : "ninguno"));
    hits.forEach((h) => resultados[resultados.length - 1].detalle.push("          " + h));
  } else resultados[resultados.length - 1].detalle.push("        pruebas.mjs no encontrado en " + PRUEBAS + " (omitido)");
  if (fs.existsSync(PARCHES)) {
    const hits = [];
    (function rec(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) rec(p); else if (/\.(mjs|js|md|py|json)$/i.test(f.name)) { try { fs.readFileSync(p, "utf8").split("\n").forEach((t, i) => { if (/SOP_ACERO|SOP_COBRE|PU_SOP\b|ductoRect|ductoRedondo|tubChica|tubMedia|tubGrande|sismicoLong|sismicoTrans/.test(t)) hits.push(`${path.relative(PARCHES, p)} L${i + 1}: ${t.trim().slice(0, 90)}`); }); } catch { /* binario */ } } } })(PARCHES);
    resultados[resultados.length - 1].detalle.push("        menciones en parches\\: " + (hits.length ? "" : "ninguna"));
    hits.forEach((h) => resultados[resultados.length - 1].detalle.push("          " + h));
  }
}

/* ============================ 3. PU_CIVIL ================================== */
{
  const c = chequeo("PU_CIVIL", "PU_CIVIL: castillo y pinturaVinil sin lectura (las otras 13 sí se leen)");
  const def = propsDe("PU_CIVIL");
  if (!def) c.falla("no hallé const PU_CIVIL");
  else {
    const { lect, genericos } = lecturasDeTabla("PU_CIVIL");
    c.info(`definida en línea ${lin(decl("PU_CIVIL").valIni)} · ${def.length} claves · ${Object.keys(lect).length} con lectura`);
    genericos.forEach((g) => c.falla(`L${g.linea}: ${g.tipo}`));
    PU_CIVIL_MUERTAS.forEach((k) => { if (!def.includes(k)) c.aviso(`PU_CIVIL.${k} ya no existe`); else if (lect[k]) c.falla(`PU_CIVIL.${k} YA se lee en L${lect[k].join(",")}`); else c.ok(`PU_CIVIL.${k} sin lectura`); });
    def.filter((k) => !PU_CIVIL_MUERTAS.includes(k) && !lect[k]).forEach((k) => c.aviso(`clave NUEVA sin lectura en PU_CIVIL: ${k}`));
  }
}

/* ============================ 4. Recetas y huérfanos de la tarjeta de PU ==== */
{
  const c = chequeo("RECETAS", "RECETAS castillo · pinturaVinil · ducto · tuberia, y los insumos que solo ellas usan");
  const dR = decl("RECETAS");
  if (!dR) c.falla("no hallé const RECETAS");
  else {
    const arbol = claves("RECETAS");
    const ref = { cua: {}, eq: {} };
    arbol.props.forEach((p) => {
      if (p.val.tipo !== "obj") return;
      const cua = p.val.props.find((x) => x.clave === "cua"); if (cua) (ref.cua[cua.val.texto.replace(/["']/g, "")] ||= []).push(p.clave);
      const eq = p.val.props.find((x) => x.clave === "eq"); if (eq && eq.val.tipo === "arr") eq.val.items.forEach((it) => { if (it.tipo === "arr" && it.items[0]) (ref.eq[it.items[0].texto.replace(/["']/g, "")] ||= []).push(p.clave); });
    });
    for (const [huerfano, propietarias] of Object.entries(HUERFANOS_RECETA)) {
      const [tabla, id] = huerfano.split(".");
      let quienes = [];
      if (tabla === "EQ_CAT") quienes = ref.eq[id] || [];
      else if (tabla === "CUADRILLAS") quienes = ref.cua[id] || [];
      else if (tabla === "MO_CAT") {
        // categorías → cuadrillas que las incluyen → recetas que usan esas cuadrillas
        const ac = claves("CUADRILLAS"); const cuadrillas = [];
        if (ac) ac.props.forEach((p) => { if (p.val.tipo !== "obj") return; const comp = p.val.props.find((x) => x.clave === "comp"); if (comp && comp.val.tipo === "arr" && comp.val.items.some((it) => it.tipo === "arr" && it.items[0] && it.items[0].texto.replace(/["']/g, "") === id)) cuadrillas.push(p.clave); });
        quienes = [...new Set(cuadrillas.flatMap((cu) => (ref.cua[cu] && ref.cua[cu].length ? ref.cua[cu] : ["(cuadrilla " + cu + " sin receta)"])))];
      }
      const extra = quienes.filter((q) => !propietarias.includes(q));
      if (extra.length) c.falla(`${huerfano} ahora lo usa ${extra.join(", ")} (antes solo: ${propietarias.join(", ") || "nadie"})`);
      else c.ok(`${huerfano}: usado solo por [${quienes.join(", ") || "nadie"}]`);
    }
    // palabras clave RARAS (no ambiguas) dentro de cadenas de código fuera de RECETAS: si aparece una descripción con ellas, alguna partida podría emparejar
    const kw = { castillo: ["castillo", "dala "], pinturaVinil: ["vinilica", "vinílica"] };
    for (const r of ["castillo", "pinturaVinil"]) {
      const hallazgos = [];
      for (const k of kw[r]) {
        const re = new RegExp(esc(k), "gi"); let m;
        while ((m = re.exec(raw))) {
          if (m.index >= dR.valIni && m.index < dR.valFin) continue;
          if (M.tipo[m.index] !== 2) continue;                       // solo texto de cadenas/plantillas, no comentarios
          hallazgos.push(`L${lin(m.index)}: …${raw.split("\n")[L(m.index) - 1].trim().slice(0, 100)}`);
        }
      }
      const uniq = [...new Set(hallazgos)].slice(0, 6);
      if (uniq.length) { c.aviso(`receta ${r}: hay cadenas con sus palabras clave fuera de RECETAS (podría emparejar alguna partida):`); uniq.forEach((h) => c.info("   " + h)); }
      else c.ok(`receta ${r}: ninguna cadena de descripción del código contiene sus palabras clave`);
    }
    c.info("ducto y tuberia: el emparejamiento se prueba en la corrida dinámica (palabra clave + unidad), no por búsqueda de texto");
  }
}

/* ============================ 5. Corrida dinámica en jsdom ================== */
async function cargarJsdom() {
  for (const b of [DIR, path.dirname(fileURLToPath(import.meta.url)), ...BASES_JSDOM]) {
    try { return createRequire(path.join(b, "x.js"))("jsdom"); } catch { /* siguiente */ }
  }
  return null;
}
if (!SIN_DIN) {
  const c = chequeo("DINAMICO", "Corrida en jsdom: instrumenta las hojas de precio y recorre escenarios (nada se escribe en disco)");
  const jsdom = await cargarJsdom();
  if (!jsdom) c.aviso("no encontré jsdom; se omitió la corrida dinámica (la evidencia estática de arriba sigue valiendo)");
  else {
    try {
      const { JSDOM } = jsdom;
      const dom = new JSDOM(html.replace(/@font-face\{[^}]*\}/g, ""), { runScripts: "dangerously", pretendToBeVisual: true, url: "https://emp.local/",
        beforeParse(w) {
          w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
          w.requestAnimationFrame = (fn) => setTimeout(fn, 0); w.cancelAnimationFrame = (t) => clearTimeout(t); w.scrollTo = () => {};
          w.HTMLElement.prototype.scrollIntoView = function () {}; w.URL.createObjectURL = () => "blob:x"; w.URL.revokeObjectURL = () => {};
          Object.defineProperty(w.navigator, "serviceWorker", { value: { register: () => Promise.resolve({}), addEventListener() {} } });
          w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.Blob = Blob;
          w.CSS = { escape: (s) => String(s).replace(/([^\w-])/g, "\\$1") };
          w.__errs = []; w.addEventListener("error", (e) => w.__errs.push(e.message));
        } });
      await new Promise((r) => setTimeout(r, 300));
      const w = dom.window; const G = (e) => w.eval(e); const S = G("S");
      const TABLAS = ["PU_SOP", "PU_CIVIL", "RECETAS", "EQ_CAT", "CUADRILLAS", "SOP_ACERO", "SOP_COBRE", "SOP_PLASTICO"];
      G(`(function(){ window.__leidas = {}; window.__meta = {};
        const inst = (tbl, name) => { (function walk(o, path) { if (!o || typeof o !== 'object' || Object.isFrozen(o)) return;
          for (const k of Object.keys(o)) { const v = o[k]; const p = path + '.' + k;
            if (v && typeof v === 'object') walk(v, p);
            else if (typeof v === 'number') { let val = v; window.__meta[p] = v; window.__leidas[p] = 0;
              Object.defineProperty(o, k, { get() { window.__leidas[p]++; return val; }, set(x) { val = x; }, enumerable: true, configurable: true }); } } })(tbl, name); };
        ${TABLAS.map((t) => `try { inst(${t}, ${JSON.stringify(t)}); } catch (e) {}`).join("\n")} })()`);
      const rec = () => G("recompute()");
      const escenario = (nombre, fn) => { try { fn(); } catch (e) { c.aviso(`escenario «${nombre}» falló: ${String(e.message).slice(0, 120)}`); } };
      escenario("proyecto base y permisos", () => {
        S.zones = [{ ...G("defaultZone")("Producción"), area: 400, height: 6, occ: 30, lights: 8000, equip: 12000, walls: { N: 40, S: 40, E: 30, O: 30 }, roof: 400 },
          { ...G("defaultZone")("Oficinas"), area: 100, height: 3, occ: 10, lights: 1500, equip: 2000, walls: { N: 12, S: 12, E: 10, O: 10 }, roof: 100 }];
        S.zi = 0; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "verificacion" }; }); rec();
      });
      escenario("proyecto lleno", () => {
        S.zones[0].height = 6; S.zones[0].glass = { N: 4, NE: 0, E: 6, SE: 0, S: 12, SW: 0, W: 8, NW: 0 };
        S.duct.segments.push({ ...G("defaultSegment")("TR-1", 2500), length: 20 }, { ...G("defaultSegment")("TR-2", 800), length: 12, shape: "round", method: "velocity", targetV: 5 });
        S.elec.cargas.push({ ...G("defaultCarga")("Motor"), kW: 7.5, L: 20 });
        S.hidro.muebles.push({ id: "wc_tanque", cant: 4 }); S.hidro.presRed = 25; S.hidro.habitantes = 40; S.hidro.alturaEdificio = 6;
        S.hidro.tramos.push({ ...G("defaultTramoAgua")("AF-1"), um: 40, L: 25, alt: 3 });
        S.fuego.area = 500; S.fuego.altura = 6; S.fuego.Lramal = 30; S.fuego.Lmontante = 12;
        S.aire.consumos.push({ ...G("defaultConsumo")("Herramienta"), cant: 4, lmin: 200, bar: 6, uso: .5 }); S.aire.Lprincipal = 60; S.aire.Lramales = 40;
        S.clean = { rooms: [{ ...G("defaultRoom")("Cuarto A"), area: 60, height: 3, occ: 4, procW: 500 }], ci: 0 };
        rec(); G("traerSistemaACotizacion()"); rec();
      });
      escenario("soportería y elevación", () => { for (const h of [3, 8, 12, 20]) { S.soporte = { ...G("defaultSoporte")(), alturaTrabajo: h, basesEquipo: 2, rielM: 50, mesesElevacion: 3, sismico: true }; rec(); }
        for (const mat of ["cobre", "acero", "cpvc", "pead"]) { S.hidro.material = mat; rec(); } });
      escenario("obra civil completa", () => { Object.assign(S.civil, { demoler: true, demolMuroM2: 40, demolPlafonM2: 30, demolPisoM2: 50, firmeM2: 60, azulejoM2: 20, pinturaM2: 30, puertasLimpias: 2, puertasSimples: 3, visores: 4, passbox: 1 });
        for (const id of Object.keys(G("SIS_MURO"))) { S.civil.muro = id; rec(); } for (const id of Object.keys(G("SIS_PISO"))) { S.civil.piso = id; rec(); } });
      let sinReceta = [];
      escenario("tarjetas de PU y documentos", () => {
        const Q = G("QUOTE"); const partidas = [...(Q.lines || []), ...(Q.aux || [])];
        G("catalogoConceptos")().secciones.forEach((s2) => s2.partidas.forEach((p) => partidas.push(p)));
        const idsRec = new Set(); partidas.forEach((p) => { const r = G("recetaDe")(p); if (r) idsRec.add(r.id); G("analizarPU")(p); });
        sinReceta = G("Object.keys(RECETAS)").filter((k) => !idsRec.has(k));
        for (const modo of ["privada", "licitacion"]) { S.quote.modo = modo; rec(); }
        try { G("buildLicitacionPdf")(); G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }); G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" }); } catch (e) { c.aviso("un generador de documentos falló: " + String(e.message).slice(0, 100)); }
      });
      const leidas = w.__leidas, meta = w.__meta;
      const total = (prefijo) => Object.keys(leidas).filter((p) => p.startsWith(prefijo)).reduce((a, p) => a + (leidas[p] || 0), 0);
      const hojas = (prefijo) => Object.keys(meta).filter((p) => p.startsWith(prefijo));
      // controles positivos: si el instrumento no ve lecturas que sí existen, el resultado no vale
      const ctrl = { "PU_SOP.baseEquipo": leidas["PU_SOP.baseEquipo"], "PU_SOP.rielUnistrut": leidas["PU_SOP.rielUnistrut"], "PU_CIVIL.firme": leidas["PU_CIVIL.firme"], "PU_CIVIL.azulejo": leidas["PU_CIVIL.azulejo"] };
      Object.entries(ctrl).forEach(([k, v]) => { if (v > 0) c.ok(`control positivo ${k}: ${v} lecturas`); else c.aviso(`control positivo ${k}: 0 lecturas (el escenario no lo ejercitó; revisar el instrumento)`); });
      PU_SOP_MUERTAS.forEach((k) => { const n = leidas["PU_SOP." + k]; if (n === undefined) c.aviso(`PU_SOP.${k}: no existe (¿renombrada?)`); else if (n > 0) c.falla(`PU_SOP.${k}: ${n} lecturas en ejecución`); else c.ok(`PU_SOP.${k}: 0 lecturas en ejecución`); });
      PU_CIVIL_MUERTAS.forEach((k) => { const n = leidas["PU_CIVIL." + k]; if (n === undefined) c.aviso(`PU_CIVIL.${k}: no existe`); else if (n > 0) c.falla(`PU_CIVIL.${k}: ${n} lecturas en ejecución`); else c.ok(`PU_CIVIL.${k}: 0 lecturas en ejecución`); });
      for (const r of RECETAS_SIN_PARTIDA) { const n = total("RECETAS." + r + "."); if (!hojas("RECETAS." + r + ".").length) c.aviso(`RECETAS.${r}: no existe`); else if (n > 0) c.falla(`RECETAS.${r}: ${n} lecturas — ahora hay una partida que la empareja`); else c.ok(`RECETAS.${r}: 0 lecturas (ninguna partida la empareja)`); }
      c.info("recetas que ninguna partida del catálogo empareja en los escenarios: " + (sinReceta.join(", ") || "ninguna"));
      const ns = leidas["EQ_CAT.soldadora.jornada"]; if (ns > 0) c.falla(`EQ_CAT.soldadora.jornada: ${ns} lecturas`); else c.ok("EQ_CAT.soldadora.jornada: 0 lecturas");
      // SOP_ACERO / SOP_COBRE: 0 en producción, y control con la llamada explícita que hace la prueba L.2
      const nA = total("SOP_ACERO."), nC = total("SOP_COBRE.");
      if (nA + nC > 0) c.falla(`SOP_ACERO/SOP_COBRE: ${nA + nC} lecturas durante los escenarios de producción`); else c.ok("SOP_ACERO y SOP_COBRE: 0 lecturas durante los escenarios de producción");
      if (total("SOP_PLASTICO.") > 0) c.ok(`SOP_PLASTICO sí se lee en producción (${total("SOP_PLASTICO.")} lecturas): es la única tabla de espSoporte que vive`); else c.info("SOP_PLASTICO no se leyó en estos escenarios (depende de que haya tubería termoplástica)");
      G("espSoporte(20,'cobre'); espSoporte(20,'acero')");
      if (total("SOP_COBRE.") > 0 && total("SOP_ACERO.") > 0) c.ok("control: la llamada explícita espSoporte(20,'cobre'/'acero') SÍ lee ambas tablas (así es como solo la alcanza la prueba L.2)");
      else c.aviso("control: la llamada explícita no leyó las tablas (revisar espSoporte)");
      if (w.__errs.length) c.aviso("errores de ventana: " + w.__errs.slice(0, 3).join(" | "));
    } catch (e) { c.aviso("la corrida dinámica se interrumpió: " + String(e.stack || e).split("\n").slice(0, 2).join(" ")); }
  }
}

/* ============================ salida ======================================== */
const fallas = resultados.filter((r) => r.estado === "FALLA").length;
const avisos = resultados.filter((r) => r.estado === "AVISO").length;
if (JSON_OUT) console.log(JSON.stringify({ archivo: HTML, rev: REV, sha256: sha, resultados, fallas, avisos }, null, 1));
else {
  console.log(`verificacion.mjs · precios y tablas sin uso · archivo: ${HTML}`);
  console.log(`rev ${REV} · sha256 ${sha}… · script del <script>: líneas ${lineaInicio}–${lineaInicio + raw.split("\n").length - 1}\n`);
  for (const r of resultados) { console.log(`[${r.estado}] ${r.id} · ${r.titulo}`); r.detalle.forEach((d) => console.log(d)); console.log(""); }
  console.log(fallas ? `RESULTADO: ${fallas} chequeo(s) FALLAN: alguna clave de la bitácora YA se lee o su tabla tiene acceso genérico. Revisar bitácora_precios_sin_uso.md.`
    : `RESULTADO: todo sigue sin uso${avisos ? ` (con ${avisos} aviso(s) que conviene revisar)` : ""}. La bitácora sigue vigente.`);
}
process.exit(fallas ? 1 : 0);
