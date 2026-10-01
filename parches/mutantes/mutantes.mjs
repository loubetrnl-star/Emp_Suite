#!/usr/bin/env node
/* Compuerta de mutantes (Fase 1, rev 2.9.24). Aplica cada mutación de parches/mutantes/<motor>.json a una COPIA de
   index.html en la carpeta temporal, corre el banco completo contra la copia y exige que falle. Un mutante que sobrevive
   (banco en verde con la lógica alterada) es una prueba que falta.
   Uso: node parches/mutantes/mutantes.mjs <motor|todos> [--index index.html] [--solo id] [--dir <temporal>] [--paralelo N]
   --paralelo N: N bancos a la vez (por omisión 1). Desde que el banco espera sus condiciones asíncronas (commit «Banco ·
   18.10, 18.16 y 18.19 …») varios bancos simultáneos no dan fallos falsos; la salida sale en el orden de la lista.
   Formato del JSON: [{ "id": "vent.m01", "que": "caudales IMC de campana en muro a la mitad", "logica": true,
                        "buscar": "texto exacto y único en index.html", "reemplazar": "texto mutado", "estado": "vigente|fase2:H-nnn" }]
   - "logica": true = lógica de cálculo (debe morir); false = valor por omisión/piso/texto (se reporta aparte).
   - "estado": fase2:H-nnn = la línea mutada es un piso/estimación que la Fase 2 retira; se reporta pero no cierra la compuerta.
   Salida: tabla por mutante (MUERTO/VIVO) y código de salida 1 si queda vivo un mutante de lógica vigente. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const args = process.argv.slice(2);
const opt = (k, def) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : def; };
const motorArg = args.find((a) => !a.startsWith("--") && !["index.html"].includes(a)) || "todos";
const indexFile = path.resolve(RAIZ, opt("--index", "index.html"));
const solo = opt("--solo", null);
const tmp = opt("--dir", fs.mkdtempSync(path.join(os.tmpdir(), "suiteemp-mutantes-")));
const paralelo = Math.max(1, parseInt(opt("--paralelo", "1"), 10) || 1);
const html = fs.readFileSync(indexFile, "utf8");
const motores = motorArg === "todos" ? fs.readdirSync(AQUI).filter((f) => /^[a-z]+\.json$/.test(f)).map((f) => f.replace(/\.json$/, "")) : [motorArg];
let vivosLogica = 0;
const filas = [];
/* Banco contra la copia mutada, sin bloquear: así pueden correr varios a la vez (--paralelo). Mismo criterio que antes:
   código de salida distinto de 0 (o proceso muerto por el tope de 15 min) = el banco lo mató. */
const banco = (copia) => new Promise((res) => {
  const p = spawn(process.execPath, ["pruebas.mjs", copia], { cwd: RAIZ });
  let salida = "";
  p.stdout.on("data", (d) => { salida += d; }); p.stderr.on("data", (d) => { salida += d; });
  const tope = setTimeout(() => p.kill("SIGKILL"), 900000);
  p.on("close", (status) => { clearTimeout(tope); res({ status, salida }); });
});
const trabajos = [];
for (const motor of motores) {
  const f = path.join(AQUI, `${motor}.json`);
  if (!fs.existsSync(f)) { console.log(`${motor}: sin parches/mutantes/${motor}.json`); continue; }
  trabajos.push(...JSON.parse(fs.readFileSync(f, "utf8")).filter((m) => !solo || m.id === solo));
}
const lineas = new Array(trabajos.length);
let siguiente = 0, tomado = 0;
const emitir = () => { while (siguiente < trabajos.length && lineas[siguiente] !== undefined) { if (lineas[siguiente]) console.log(lineas[siguiente]); siguiente++; } };
async function uno(m) {
    const n = html.split(m.buscar).length - 1;
    if (n !== 1) { filas.push([m.id, "INVÁLIDO", `«buscar» aparece ${n} veces (debe ser 1)`, m.que]); if (m.logica !== false && !/^fase2/.test(m.estado || "")) vivosLogica++; return `${"INVÁLIDO".padEnd(7)} ${m.id.padEnd(16)} «buscar» aparece ${n} veces (debe ser 1) · ${m.que}`; }
    const mutado = html.replace(m.buscar, m.reemplazar);
    const copia = path.join(tmp, `${m.id}.html`);
    fs.writeFileSync(copia, mutado);
    const r = await banco(copia);
    const salida = r.salida;
    const resumen = (salida.match(/(\d+) de (\d+) comprobaciones correctas/) || []).slice(1).join("/");
    const murio = r.status !== 0;
    const fallas = [...salida.matchAll(/^ ✗ (\S+)/gm)].map((x) => x[1]).slice(0, 6).join(" ");
    const estado = murio ? "MUERTO" : "VIVO";
    if (!murio && m.logica !== false && !/^fase2/.test(m.estado || "")) vivosLogica++;
    filas.push([m.id, estado, `${resumen}${murio ? " · lo matan: " + fallas : ""}${/^fase2/.test(m.estado || "") ? " · " + m.estado : ""}${m.logica === false ? " · no es lógica" : ""}`, m.que]);
    return `${estado.padEnd(7)} ${m.id.padEnd(16)} ${resumen.padEnd(9)} ${m.que}${murio ? "  ← " + fallas : ""}`;
}
async function obrero() { while (tomado < trabajos.length) { const i = tomado++; lineas[i] = await uno(trabajos[i]); emitir(); } }
await Promise.all(Array.from({ length: Math.min(paralelo, Math.max(1, trabajos.length)) }, obrero));
console.log(`\n${filas.length} mutante(s) · vivos en lógica vigente: ${vivosLogica} · copias en ${tmp}`);
process.exit(vivosLogica ? 1 : 0);
