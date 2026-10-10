#!/usr/bin/env node
/* Cobertura del banco por motor (decisión del dueño, 9-oct-2026). Lee la cobertura cruda de V8 que deja c8 y la reparte
   por regiones de index.html (encabezados de sección «MOTOR …»; rangos de línea abajo, criterio de la casa).
   Uso: npx c8 --temp-directory <dir> --clean=false --reporter=text-summary node pruebas.mjs index.html
        node parches/cobertura-motores.mjs <dir> index.html
   «código ejecutado» = caracteres no blancos con conteo > 0 en el rango más interno de V8; jsdom normaliza CRLF → LF. */
import fs from "node:fs"; import path from "node:path";
const [dir, htmlFile] = process.argv.slice(2);
const html = fs.readFileSync(htmlFile, "utf8");
const m = /<script\b[^>]*>([\s\S]*?)<\/script>/i.exec(html);
const src = m[1].split(String.fromCharCode(13)).join(""); const linea0 = html.slice(0, m.index + m[0].indexOf(">") + 1).split("\n").length;
let scripts = [];
for (const f of fs.readdirSync(dir)) for (const s of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).result) scripts.push(s);
const cand = scripts.filter((s) => s.functions.some((fn) => fn.functionName === "" && fn.ranges[0].endOffset === src.length));
console.log("scripts:", scripts.length, "candidatos (tamaño del <script>):", cand.map((s) => s.url).join(" | "));
const s = cand[0]; if (!s) process.exit(1);
/* cuenta por byte: el rango más interno manda (V8 block coverage) */
const cnt = new Int32Array(src.length).fill(-1);
const rangos = s.functions.flatMap((fn) => fn.ranges.map((r) => ({ ...r, len: r.endOffset - r.startOffset }))).sort((a, b) => b.len - a.len);
for (const r of rangos) for (let i = r.startOffset; i < Math.min(r.endOffset, src.length); i++) cnt[i] = r.count;
const lineaDe = (() => { const st = [0]; for (let i = 0; i < src.length; i++) if (src[i] === "\n") st.push(i + 1); return (off) => { let lo = 0, hi = st.length - 1; while (lo < hi) { const md = (lo + hi + 1) >> 1; if (st[md] <= off) lo = md; else hi = md - 1; } return lo + linea0; }; })();
const funcs = s.functions.filter((fn) => fn.functionName !== "" || fn.ranges[0].startOffset > 0).map((fn) => ({ n: fn.functionName, l: lineaDe(fn.ranges[0].startOffset), c: fn.ranges[0].count, len: fn.ranges[0].endOffset - fn.ranges[0].startOffset }));
const REG = { load: [[3119, 3691]], equip: [[3692, 3928]], aire: [[6880, 7370]], civil: [[7371, 7679]], soporte: [[7680, 8976]], vent: [[8977, 9168]], clean: [[9169, 9361]], duct: [[9362, 10098]], elec: [[10103, 10949]], hidro: [[10950, 11444], [6317, 6576]], fuego: [[11445, 11726]] };
const st = [0]; for (let i = 0; i < src.length; i++) if (src[i] === "\n") st.push(i + 1);
const off = (l) => st[l - linea0] ?? src.length;
const filas = [];
for (const [mot, rs] of Object.entries(REG)) {
  let total = 0, cub = 0, ftot = 0, fcub = 0; const nunca = [];
  for (const [a, b] of rs) {
    for (let i = off(a); i < off(b + 1); i++) { if (/\s/.test(src[i])) continue; total++; if (cnt[i] > 0) cub++; }
    for (const f of funcs) if (f.l >= a && f.l <= b && f.len > 40) { ftot++; if (f.c > 0) fcub++; else if (f.n) nunca.push(`${f.n}:${f.l}`); }
  }
  filas.push({ mot, bytes: (100 * cub / total).toFixed(1), funcs: `${fcub}/${ftot}`, fpct: (100 * fcub / ftot).toFixed(1), nunca: nunca.slice(0, 8).join(", ") + (nunca.length > 8 ? ` …(+${nunca.length - 8})` : "") });
}
filas.sort((a, b) => a.bytes - b.bytes);
for (const f of filas) console.log(`${f.mot.padEnd(8)} código ejecutado ${f.bytes.padStart(5)} % · funciones ${f.funcs.padStart(7)} (${f.fpct} %) · nunca llamadas: ${f.nunca}`);
