#!/usr/bin/env node
/* Compuerta de mutantes (Fase 1, rev 2.9.24). Aplica cada mutación de parches/mutantes/<motor>.json a una COPIA de
   index.html en la carpeta temporal, corre el banco completo contra la copia y exige que falle. Un mutante que sobrevive
   (banco en verde con la lógica alterada) es una prueba que falta.
   Uso: node parches/mutantes/mutantes.mjs <motor|todos> [--index index.html] [--solo id] [--dir <temporal>]
   Formato del JSON: [{ "id": "vent.m01", "que": "caudales IMC de campana en muro a la mitad", "logica": true,
                        "buscar": "texto exacto y único en index.html", "reemplazar": "texto mutado", "estado": "vigente|fase2:H-nnn" }]
   - "logica": true = lógica de cálculo (debe morir); false = valor por omisión/piso/texto (se reporta aparte).
   - "estado": fase2:H-nnn = la línea mutada es un piso/estimación que la Fase 2 retira; se reporta pero no cierra la compuerta.
   Salida: tabla por mutante (MUERTO/VIVO) y código de salida 1 si queda vivo un mutante de lógica vigente. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const args = process.argv.slice(2);
const opt = (k, def) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : def; };
const motorArg = args.find((a) => !a.startsWith("--") && !["index.html"].includes(a)) || "todos";
const indexFile = path.resolve(RAIZ, opt("--index", "index.html"));
const solo = opt("--solo", null);
const tmp = opt("--dir", fs.mkdtempSync(path.join(os.tmpdir(), "suiteemp-mutantes-")));
const html = fs.readFileSync(indexFile, "utf8");
const motores = motorArg === "todos" ? fs.readdirSync(AQUI).filter((f) => /^[a-z]+\.json$/.test(f)).map((f) => f.replace(/\.json$/, "")) : [motorArg];
let vivosLogica = 0;
const filas = [];
for (const motor of motores) {
  const f = path.join(AQUI, `${motor}.json`);
  if (!fs.existsSync(f)) { console.log(`${motor}: sin parches/mutantes/${motor}.json`); continue; }
  const lista = JSON.parse(fs.readFileSync(f, "utf8")).filter((m) => !solo || m.id === solo);
  for (const m of lista) {
    const n = html.split(m.buscar).length - 1;
    if (n !== 1) { filas.push([m.id, "INVÁLIDO", `«buscar» aparece ${n} veces (debe ser 1)`, m.que]); if (m.logica !== false && !/^fase2/.test(m.estado || "")) vivosLogica++; continue; }
    const mutado = html.replace(m.buscar, m.reemplazar);
    const copia = path.join(tmp, `${m.id}.html`);
    fs.writeFileSync(copia, mutado);
    const r = spawnSync(process.execPath, ["pruebas.mjs", copia], { cwd: RAIZ, encoding: "utf8", maxBuffer: 64 << 20, timeout: 900000 });
    const salida = (r.stdout || "") + (r.stderr || "");
    const resumen = (salida.match(/(\d+) de (\d+) comprobaciones correctas/) || []).slice(1).join("/");
    const murio = r.status !== 0;
    const fallas = [...salida.matchAll(/^ ✗ (\S+)/gm)].map((x) => x[1]).slice(0, 6).join(" ");
    const estado = murio ? "MUERTO" : "VIVO";
    if (!murio && m.logica !== false && !/^fase2/.test(m.estado || "")) vivosLogica++;
    filas.push([m.id, estado, `${resumen}${murio ? " · lo matan: " + fallas : ""}${/^fase2/.test(m.estado || "") ? " · " + m.estado : ""}${m.logica === false ? " · no es lógica" : ""}`, m.que]);
    console.log(`${estado.padEnd(7)} ${m.id.padEnd(16)} ${resumen.padEnd(9)} ${m.que}${murio ? "  ← " + fallas : ""}`);
  }
}
console.log(`\n${filas.length} mutante(s) · vivos en lógica vigente: ${vivosLogica} · copias en ${tmp}`);
process.exit(vivosLogica ? 1 : 0);
