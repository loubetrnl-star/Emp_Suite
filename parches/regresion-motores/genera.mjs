#!/usr/bin/env node
/* Regresión por motor: construye un proyecto fijo, lo guarda como fixture (formato de guardado de la suite) y escribe las
   cifras esperadas de cada motor junto con la versión del motor con la que se generaron.
   Uso: node parches/regresion-motores/genera.mjs [index.html] [motor ... | todos]
   Regla: el esperado de un motor sólo se regenera cuando SUBIÓ su versión en MOTOR_VER (con hallazgo en MOTOR_CAMBIOS),
   o si se pasa el motor como argumento a propósito. Si las cifras cambian con la misma versión, avisa y no regenera. */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const require = createRequire(path.join(RAIZ, "pruebas.mjs"));
const { JSDOM } = require("jsdom");
const args = process.argv.slice(2);
const file = args[0] && args[0].endsWith(".html") ? args[0] : path.join(RAIZ, "index.html");
const solo = args.filter((a) => !a.endsWith(".html"));
const dom = new JSDOM(fs.readFileSync(file, "utf8"), { runScripts: "dangerously", url: "https://emp.local/", pretendToBeVisual: true });
const w = dom.window; await new Promise((r) => setTimeout(r, 1500));
const G = (e) => w.eval(e);
w.eval(String.raw`
  reemplazarEstado(defaultState());
  S.meta = { ...S.meta, name: "Regresión por motor", client: "EMP interno", location: "Tijuana", engineer: "Banco de pruebas", date: "2026-09-21" };
  S.site = { key: "tijuana" };
  const dz = defaultZone;
  S.zones = [
    { ...dz("Producción"), area: 400, height: 6, occ: 30, lights: 8000, equip: 12000, walls: { N: 40, S: 40, E: 30, W: 30, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 400, glass: { N: 6, S: 4, E: 0, W: 0, NE: 0, SE: 0, SW: 0, NW: 0 } },
    { ...dz("Oficinas"), area: 100, height: 3, occ: 10, lights: 1500, equip: 2000, walls: { N: 12, S: 12, E: 10, W: 10, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 100 },
    { ...dz("Limpio ISO 7"), spaceType: "cleanroom", iso: "iso7", achClean: 45, area: 120, height: 3, occ: 2, lights: 720, equip: 2400, runHours: 24, fanPa: 600, fanEta: 55 },
    { ...dz("Laboratorio HR"), area: 80, height: 3, occ: 4, lights: 1200, equip: 2500, hrControl: "si" },
  ];
  const r0 = cleanRooms()[0]; r0.name = "Cuarto limpio 1"; r0.area = 120; r0.height = 3; r0.iso = "iso7"; r0.occ = 2;
  S.duct.segments = [{ ...defaultSegment("TR-1", 6000), length: 18 }, { ...defaultSegment("TR-2", 3400), length: 12 }, { ...defaultSegment("RT-1", 5000), service: "return", length: 15 }];
  /* H-262: ventilación ya no hereda de carga térmica. El proyecto fijo captura en su pestaña los mismos valores que antes le
     copiaba la herencia (700 m² = suma de zonas, 4.71 m de altura media, 46 personas) para que las cifras no cambien. */
  S.vent = { ...S.vent, mode: "general", area: 700, height: 4.71, occ: 46 };
  S.elec.cargas = [{ ...defaultCarga("Compresor de proceso"), tipo: "motor", kW: 15, V: 220, ph: 3, cant: 1, L: 30, fp: .85 }, { ...defaultCarga("Alumbrado"), tipo: "alumbrado", kW: 9.5, V: 127, ph: 1, cant: 1, L: 40, fp: .95 }];
  S.elec.trafoKVA = 300;
  /* H-179 (rev 2.9.24): defaultElec() ya no trae distancia al tablero ni transformador supuestos; el proyecto fijo los captura
     explícitos con los mismos valores que siempre tuvo (30 m, Z 4 %, fp objetivo 0.95). */
  S.elec.Ltablero = 30; S.elec.trafoZ = 4; S.elec.fpObjetivo = .95;
  /* rev 2.9.23 (decisión del dueño 22-sep-2026): la red es de COBRE tipo L para que el golden ejercite la ruta de precios de referencia (con IVA/por tramo → MXN/m) y, en un diámetro, la de proveedor local numérico. */
  S.hidro = { ...defaultHidro(), material: "cobre", tramos: [{ ...defaultTramoAgua("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...defaultTramoAgua("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 0 }],
    muebles: [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }] };
  /* H-264: contra incendio ya no hereda; captura lo que la herencia le imponía al abrir (700 m² = suma de zonas, 6 m = zona más alta). */
  S.fuego = { ...defaultFuego(), area: 700, altura: 6, Lramal: 30, Lmontante: 12, presFuente: 30 };
  S.aire = { ...defaultAire(), Lprincipal: 60, consumos: [{ ...defaultConsumo("Sopleteo"), cant: 2, lmin: 400, bar: 6, uso: .5 }, { ...defaultConsumo("Actuadores"), cant: 4, lmin: 250, bar: 6, uso: .3 }] };
  S.civil = { ...defaultCivil(), firmeM2: 120, puertasSimples: 3, puertasLimpias: 2, demoler: true, demolMuroM2: 40 };
  S.soporte = { ...defaultSoporte(), rielM: 60, mesesElevacion: 3 };
  const fam = FAMILIES[0], m = familyPool(fam.id)[0]; if (m) S.quote.items = [{ id: m.id, fam: fam.id, qty: 2, unit: null }];
  /* Ruta de referencias con un precio de REFERENCIA DE PRUEBA AISLADO (no es una fuente real; decisión del dueño 22-sep-2026: sin IUSA, únicamente California, sólo material). 1/2" queda como proveedor local numérico. */
  const refPrueba = (p) => ({ precio: p, moneda: "USD", iva: false, porTramo: 1, origen: "referencia", alcance: "material", fuente: "REFERENCIA DE PRUEBA del fixture de regresión (no es una fuente real)", edicion: "", pagina: "", ubicacion: "San Diego, CA (fixture)", lista: "no especificado", url: "", fecha: "2026-09-22" });
  S.quote.hidroPU = { cobre_1_2_: 128, cobre_3_4_: refPrueba(3.1), cobre_1_: refPrueba(4.6), cobre_1_1_4_: refPrueba(6.2), cobre_1_1_2_: refPrueba(8.0), cobre_2_: refPrueba(12.9), cobre_2_1_2_: refPrueba(22.7), cobre_3_: refPrueba(30.8), cobre_4_: refPrueba(57.4) };
  S.quote.fx = 18.5; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "fixture de regresión";
  Object.keys(LINKS).forEach((k) => { S.perms[k] = { ts: 1, via: "regresión" }; });
  S.kaizen.items = [{ id: "k1", titulo: "Ajustar horario de FFU", estado: "hacer", owner: "", ahorro: 0, nota: "" }];
  S.tab = "tablero"; recompute();
`);
const MV = G("MOTOR_VER"), REV = G("REV");
const cifras = {}; Object.keys(MV).forEach((id) => { cifras[id] = G(`cifrasMotor(${JSON.stringify(id)})`); });
const proyecto = JSON.parse(G(`JSON.stringify({ v: FORMATO_GUARDADO, ...S })`));
fs.writeFileSync(path.join(AQUI, "regresion-motores.emp.json"), JSON.stringify(proyecto, null, 1));
const esperadoPath = path.join(AQUI, "regresion-motores.esperado.json");
let previo = null; try { previo = JSON.parse(fs.readFileSync(esperadoPath, "utf8")); } catch { /* primera vez */ }
const esperado = { generadoCon: REV, fecha: new Date().toISOString().slice(0, 10), motores: {} };
Object.keys(MV).forEach((id) => {
  const p = previo && previo.motores && previo.motores[id];
  const regenera = !p || p.ver !== MV[id] || solo.includes(id) || solo.includes("todos");
  esperado.motores[id] = regenera ? { ver: MV[id], cifras: cifras[id] } : p;
  if (!regenera && JSON.stringify(p.cifras) !== JSON.stringify(cifras[id])) console.log(`OJO ${id}: las cifras cambiaron sin subir MOTOR_VER (v${MV[id]}). No se regenera: sube la versión con su hallazgo, o pasa "${id}" como argumento si es a propósito.`);
  if (regenera) console.log(`${id}: esperado v${MV[id]}${p ? ` (antes v${p.ver})` : " (nuevo)"}`);
});
fs.writeFileSync(esperadoPath, JSON.stringify(esperado, null, 1));
console.log("fixture y esperado escritos en", AQUI);
process.exit(0);
