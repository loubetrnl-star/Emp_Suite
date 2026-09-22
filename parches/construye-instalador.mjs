// Arma SuiteEmp-<rev>-instalador.zip con entradas en "/" (no "\"), deflate.
// Uso: node construye-instalador.mjs <index.html> <carpeta-base-2.9.5> <salida.zip>
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const [indexSrc, baseDir, salida] = process.argv.slice(2);
const html = fs.readFileSync(indexSrc, "utf8");
const REV = /const REV = "([^"]+)"/.exec(html)[1];
const FECHA = /const REV_FECHA = "([^"]+)"/.exec(html)[1];

const archivos = {};
const leer = (rel) => fs.readFileSync(path.join(baseDir, rel));
for (const rel of ["Abrir SuiteEmp.bat", "Instalar SuiteEmp como aplicacion.bat", "servidor-local.ps1", "manifest.webmanifest",
  "icons/favicon.ico", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"]) archivos[rel] = leer(rel);

archivos["index.html"] = Buffer.from(html, "utf8");
// rev 2.9.12 · el manifiesto toma el color de fondo del tema vigente (theme-color de index.html).
const tema = (/<meta name="theme-color" content="(#[0-9A-Fa-f]{6})"/.exec(html) || [])[1];
if (tema) archivos["manifest.webmanifest"] = Buffer.from(archivos["manifest.webmanifest"].toString("utf8")
  .replace(/"background_color": "#[0-9A-Fa-f]{6}"/, `"background_color": "${tema}"`)
  .replace(/"theme_color": "#[0-9A-Fa-f]{6}"/, `"theme_color": "${tema}"`), "utf8");
archivos["sw.js"] = Buffer.from(leer("sw.js").toString("utf8")
  .replace(/SuiteEmp rev [\d.]+ \([^)]+\)/, `SuiteEmp rev ${REV} (${FECHA})`)
  .replace(/const CACHE = "suiteemp-[^"]+";/, `const CACHE = "suiteemp-${REV}";`), "utf8");
archivos["LEEME.txt"] = Buffer.from(leer("LEEME.txt").toString("utf8")
  .replace(/SuiteEmp rev [\d.]+ \([^)]+\)/, `SuiteEmp rev ${REV} (${FECHA})`), "utf8");

// ---- ZIP writer mínimo (PKZIP 2.0, deflate, nombres UTF-8) ----
const dosTime = (d) => ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff;
const dosDate = (d) => (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
const ahora = new Date();
const locales = [], centrales = [];
let offset = 0;
for (const [rel, data] of Object.entries(archivos)) {
  const nombre = Buffer.from("SuiteEmp/" + rel, "utf8");
  const comp = zlib.deflateRawSync(data, { level: 9 });
  const crc = zlib.crc32(data) >>> 0;
  const lh = Buffer.alloc(30);
  lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
  lh.writeUInt16LE(dosTime(ahora), 10); lh.writeUInt16LE(dosDate(ahora), 12); lh.writeUInt32LE(crc, 14);
  lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nombre.length, 26); lh.writeUInt16LE(0, 28);
  locales.push(lh, nombre, comp);
  const ch = Buffer.alloc(46);
  ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
  ch.writeUInt16LE(dosTime(ahora), 12); ch.writeUInt16LE(dosDate(ahora), 14); ch.writeUInt32LE(crc, 16);
  ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nombre.length, 28);
  ch.writeUInt32LE(offset, 42);
  centrales.push(ch, nombre);
  offset += 30 + nombre.length + comp.length;
}
const cd = Buffer.concat(centrales);
const fin = Buffer.alloc(22);
fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(Object.keys(archivos).length, 8); fin.writeUInt16LE(Object.keys(archivos).length, 10);
fin.writeUInt32LE(cd.length, 12); fin.writeUInt32LE(offset, 16);
fs.writeFileSync(salida, Buffer.concat([...locales, cd, fin]));
console.log(`OK ${salida} · rev ${REV} · ${Object.keys(archivos).length} archivos`);
