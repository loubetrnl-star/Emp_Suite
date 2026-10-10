#!/usr/bin/env node
/* Revisión estática de index.html (decisión del dueño, 9-oct-2026). Sólo verificación: no toca index.html.
   Uso: node parches/revision-estatica.mjs [index.html] [--json salida.json]
   1. node --check sobre cada <script> en línea (sintaxis).
   2. ESLint 10 (devDependency exacta) con la regla no-undef: identificadores sin declarar. Los globales del navegador
      se toman de la ventana de jsdom (el mismo entorno del banco), no de una lista escrita a mano.
   Los números de línea se reportan en index.html. Sale con 1 si hay errores de sintaxis; los hallazgos de no-undef se
   listan para revisión y no fallan la corrida. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(RAIZ, "pruebas.mjs"));
const { ESLint } = require("eslint");
const { JSDOM } = require("jsdom");
const args = process.argv.slice(2);
const file = path.resolve(RAIZ, args.find((a) => a.endsWith(".html")) || "index.html");
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

const html = fs.readFileSync(file, "utf8");
const bloques = [];
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(m[1]) || /type\s*=\s*["']?(application\/json|text\/template)/i.test(m[1])) continue;
  const inicio = m.index + m[0].indexOf(">") + 1;
  bloques.push({ linea0: html.slice(0, inicio).split("\n").length, codigo: m[2] });
}
console.log(`index.html: ${file}\nbloques <script> en línea: ${bloques.length}`);

/* 1 · sintaxis */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "suiteemp-estatica-"));
let errSintaxis = 0;
bloques.forEach((b, i) => {
  const f = path.join(tmp, `bloque-${i}.js`);
  fs.writeFileSync(f, b.codigo);
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status !== 0) { errSintaxis++; console.log(`node --check bloque ${i} (línea ${b.linea0}): ERROR\n${r.stderr}`); }
  else console.log(`node --check bloque ${i} (línea ${b.linea0}): sin errores de sintaxis`);
});
fs.rmSync(tmp, { recursive: true, force: true });

/* 2 · no-undef con los globales de la ventana de jsdom */
const w = new JSDOM("<!doctype html>", { pretendToBeVisual: true }).window;
const globals = {};
for (let o = w; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) for (const k of Object.getOwnPropertyNames(o)) globals[k] = "readonly";
for (const k of ["window", "self", "globalThis", "document", "navigator", "location"]) globals[k] = "readonly";
const eslint = new ESLint({
  cwd: RAIZ, overrideConfigFile: true,
  overrideConfig: [{ languageOptions: { ecmaVersion: "latest", sourceType: "script", globals }, rules: { "no-undef": "error" } }],
});
const hallazgos = [];
for (const [i, b] of bloques.entries()) {
  const [res] = await eslint.lintText(b.codigo);
  for (const m of res.messages) hallazgos.push({ bloque: i, linea: b.linea0 + m.line - 1, col: m.column, regla: m.ruleId || "parse", texto: m.message });
}
const porNombre = {};
for (const h of hallazgos) { const k = h.texto; (porNombre[k] ||= []).push(h.linea); }
console.log(`\nESLint ${ESLint.version} · no-undef · ${hallazgos.length} hallazgo(s), ${Object.keys(porNombre).length} distinto(s)`);
for (const [k, ls] of Object.entries(porNombre).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${k} · ${ls.length}× · líneas ${ls.slice(0, 8).join(", ")}${ls.length > 8 ? " …" : ""}`);
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify({ file, errSintaxis, hallazgos }, null, 1));
process.exit(errSintaxis ? 1 : 0);
