#!/usr/bin/env node
/* =============================================================================
   comparar15.mjs · Comparador de estados de los 15 motores de SuiteEmp
   =============================================================================
   Regla permanente del dueño: ningún número de los motores ni de las
   cotizaciones puede moverse entre una revisión y otra.

   Uso:   node comparar15.mjs <base.html> <nuevo.html> [opciones]
   Ver LEEME.md para todas las opciones. Resumen:
     --escenarios=a,b     sólo esos escenarios (id exacto o prefijo)
     --lista              imprime los escenarios y sale
     --sin-guardado       omite el modo «proyecto guardado por la base y abierto en las dos»
     --sin-xlsx           omite el libro de Excel de la propuesta
     --sin-pdf            omite los PDF (memorias, cotizaciones, propuesta y licitación)
     --hilos=N            hilos de trabajo (por omisión min(4, núcleos-1))
     --max=N              diferencias que se imprimen por celda (por omisión 5)
     --json=ruta          vuelca el resultado completo
     --ignorar-texto      las diferencias de sólo texto no cuentan para el código de salida
     --ver-texto          en el detalle por celda también imprime las diferencias de texto
     --max-familias=N     cuántos grupos de diferencias imprime (por omisión 60)
     --con-css            deja el CSS al cargar cada archivo (por omisión se quita: no afecta
                          a ningún cálculo y acorta cada carga)
     --codigo[=regex]     además compara el texto de las funciones y constantes de los dos
                          archivos (sin comentarios ni espacios), lista lo que cambió con
                          las diferencias por tramos y dice si lo quitado tenía referencias
     --solo-codigo        únicamente la comparación de código
     --autoprueba         comprueba el propio comparador (nuevo contra sí mismo = 0
                          diferencias; nuevo contra una copia con un precio movido = detecta)

   Qué compara (todo con igualdad EXACTA, Object.is en números, cero tolerancia):
     LOADS, totals(), VENT, DUCT, CLEAN, SYS, QUOTE, catalogoConceptos(),
     cotizacionDeMotor(mot) de cada motor, VALID, KAIZEN (el de recompute y el que
     sale de llamar computeKaizen() explícitamente), VALOR (igual con
     computeIngValor()), ELEC, HIDRO, FUEGO, AIRE, CIVIL, SOPORTE, la porción de
     S que alimenta a cada motor (su «estado») y las celdas numéricas y fórmulas
     de los libros de Excel de la propuesta (es y en), y los NÚMEROS de cada PDF que emite
     la suite (memoria y cotización de cada motor, memoria integral, memoria general,
     cédula de equipos, propuesta es/en y licitación), en orden y con su contexto; el
     texto de los PDF sin números sólo se informa (rev 2.9.15).
   Cada escenario se corre en DOS modos: «nativo» (cada archivo arma el escenario con sus
   propios valores de arranque) y «guardado» (la BASE guarda el proyecto con projSave y los
   DOS archivos lo abren con projOpen: lo que le pasa a un usuario al actualizar). Además se
   comprueba «ida y vuelta»: en un mismo archivo, construir el escenario y reabrir el
   proyecto que él mismo guardó no debe mover un número.
   Las marcas de revisión (el «2.9.12» de cada archivo) se normalizan dentro de los textos.
   El semáforo de completitud se muestra como renglón informativo: no cuenta.
   Código de salida: 0 = cero diferencias; 1 = alguna diferencia numérica o estructural
   (o un escenario que sólo falla en una de las dos versiones); 2 = sólo diferencias de
   texto; 3 = error de ejecución en las dos versiones.
   ========================================================================== */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------------------
   jsdom: se busca junto al script, en la carpeta de trabajo y en las carpetas
   del proyecto. También se puede fijar con JSDOM_DIR=<carpeta con node_modules>.
   ------------------------------------------------------------------------ */
function cargarJsdom() {
  const cands = [process.env.JSDOM_DIR, AQUI, path.join(AQUI, ".."), process.cwd(),
    "C:/Users/ASUS/Desktop/Emp_Suite",
    "C:/Users/ASUS/AppData/Local/Temp/claude/C--Users-ASUS-Desktop-Emp-Suite/adef6c9e-0ac8-4195-9f3c-aee92b7d87f2/scratchpad/tests2"].filter(Boolean);
  for (const c of cands) {
    try { return createRequire(path.join(c, "x.js"))("jsdom"); } catch { /* siguiente */ }
  }
  throw new Error("No encuentro jsdom. Instálalo (npm i jsdom) o fija JSDOM_DIR=<carpeta con node_modules>.");
}
const { JSDOM } = cargarJsdom();

/* ---------------------------------------------------------------------------
   Carga de una copia del HTML en jsdom. Igual que harness.mjs y, además:
   Math.random determinista y Date congelada, para que dos cargas del mismo
   archivo den exactamente lo mismo. Los ids que la aplicación fabrica con
   Math.random se registran y se normalizan al comparar.
   ------------------------------------------------------------------------ */
const CACHE_HTML = new Map();
function leerHtml(f, conCss) {
  const k = f + "|" + conCss;
  if (!CACHE_HTML.has(k)) {
    let html = fs.readFileSync(f, "utf8").replace(/@font-face\{[^}]*\}/g, "");
    /* El CSS no influye en ningún cálculo; quitarlo acorta cada carga. */
    if (!conCss) html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "<style></style>");
    CACHE_HTML.set(k, html);
  }
  return CACHE_HTML.get(k);
}
const FECHA_FIJA = Date.UTC(2026, 8, 19, 12, 0, 0);
async function cargar(f, opts = {}) {
  const html = leerHtml(f, !!opts.conCss);
  const tokens = new Set();
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "https://emp.local/",
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.requestAnimationFrame = (fn) => setTimeout(fn, 0);
      w.cancelAnimationFrame = (t) => clearTimeout(t);
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.URL.createObjectURL = () => "blob:x"; w.URL.revokeObjectURL = () => {};
      Object.defineProperty(w.navigator, "serviceWorker", { value: { register: () => Promise.resolve({}), addEventListener() {} } });
      w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.Blob = Blob;
      w.CSS = { escape: (s) => String(s).replace(/([^\w-])/g, "\\$1") };
      w.__errs = []; w.addEventListener("error", (e) => w.__errs.push(e.message));
      /* Math.random determinista (mulberry32) que además anota los ids que reparte. */
      let s = 20260919 >>> 0;
      w.Math.random = () => {
        s = (s + 0x6D2B79F5) >>> 0; let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        const v = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        tokens.add(v.toString(36).slice(2, 8)); return v;
      };
      /* Date congelada: new Date() y Date.now() devuelven siempre el mismo instante. */
      const RD = w.Date;
      const FD = function (...a) { if (!new.target) return new RD(FECHA_FIJA).toString(); return Reflect.construct(RD, a.length ? a : [FECHA_FIJA], new.target); };
      FD.prototype = RD.prototype; FD.now = () => FECHA_FIJA; FD.UTC = RD.UTC; FD.parse = RD.parse;
      Object.defineProperty(RD.prototype, "constructor", { value: FD, writable: true, configurable: true });
      w.Date = FD;
    },
  });
  await new Promise((r) => setTimeout(r, 250));
  const w = dom.window;
  w.__tokens = tokens;
  return w;
}

/* ---------------------------------------------------------------------------
   Aplanado estable: cualquier valor → Map ruta → hoja (número, texto, booleano,
   null). Claves ordenadas, funciones y undefined fuera, ciclos marcados, ids
   fabricados con Math.random normalizados a «<rnd>».
   ------------------------------------------------------------------------ */
const TOPE_HOJAS = 400000;
function normalizarTexto(s, tokens) {
  if (!tokens || !tokens.size || s.length < 6) return s;
  let out = s, cambio = false;
  const re = /[a-z0-9]{6,}/g; let m;
  const reemplazos = [];
  while ((m = re.exec(s))) {
    const run = m[0];
    for (let p = 0; p + 6 <= run.length; p++) {
      if (tokens.has(run.substr(p, 6))) { reemplazos.push([m.index + p, 6]); p += 5; }
    }
  }
  if (reemplazos.length) {
    cambio = true; out = "";
    let pos = 0;
    for (const [i, len] of reemplazos) { out += s.slice(pos, i) + "<rnd>"; pos = i + len; }
    out += s.slice(pos);
  }
  return cambio ? out : s;
}
function tipoDe(v) { return Object.prototype.toString.call(v).slice(8, -1); }
function aplanar(v, ruta, out, ctx, pila) {
  if (out.size >= TOPE_HOJAS) { ctx.truncado = true; return; }
  const t = typeof v;
  if (v === undefined || t === "function" || t === "symbol") return;
  if (v === null) { out.set(ruta, null); return; }
  if (t === "number" || t === "boolean") { out.set(ruta, v); return; }
  if (t === "bigint") { out.set(ruta, Number(v)); return; }
  if (t === "string") { let s = v; for (const rv of ctx.rev) if (s.includes(rv)) { ctx.hits.n++; s = s.split(rv).join("<REV>"); } out.set(ruta, normalizarTexto(s, ctx.tokens)); return; }
  if (pila.includes(v)) { out.set(ruta, "<ciclo>"); return; }
  pila.push(v);
  const tp = tipoDe(v);
  if (Array.isArray(v) || ArrayBuffer.isView(v)) {
    for (let i = 0; i < v.length; i++) aplanar(v[i], `${ruta}[${i}]`, out, ctx, pila);
  } else if (tp === "Map") {
    let i = 0; v.forEach((val, key) => { aplanar(val, `${ruta}{${typeof key === "object" ? i : normalizarTexto(String(key), ctx.tokens)}}`, out, ctx, pila); i++; });
  } else if (tp === "Set") {
    let i = 0; v.forEach((val) => { aplanar(val, `${ruta}{${i++}}`, out, ctx, pila); });
  } else if (tp === "Date") {
    out.set(ruta, "<fecha>");
  } else if (tp === "RegExp") {
    out.set(ruta, String(v));
  } else if (tp === "Error") {
    out.set(ruta, "<error> " + v.message);
  } else {
    const ks = Object.keys(v).map((k) => [normalizarTexto(k, ctx.tokens), k]).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    for (const [kn, k] of ks) aplanar(v[k], ruta ? `${ruta}.${kn}` : kn, out, ctx, pila);
  }
  pila.pop();
}
const SIN_FUNCION = "<<sin función>>";
/* `rev` es el número de revisión del archivo («2.9.12»): dondequiera que aparezca dentro de un
   texto se cambia por «<REV>», porque una marca de revisión distinta es lo ÚNICO que se espera
   que cambie en un texto entre dos revisiones (p. ej. la memoria de la casa guarda REV en cada
   desviación). `hits.n` cuenta cuántas veces se normalizó para poder informarlo. */
function aplanarBloque(bloque, tokens, rev, hits) {
  const out = new Map(), ctx = { tokens, truncado: false, rev: Array.isArray(rev) ? rev : (rev ? [rev] : []), hits: hits || { n: 0 } };
  aplanar(bloque, "", out, ctx, []);
  if (ctx.truncado) out.set("<<truncado>>", TOPE_HOJAS);
  return out;
}

/* ---------------------------------------------------------------------------
   Comparación exacta de dos mapas aplanados.
   clase: numerica | cero-con-signo | tipo | texto | solo-base | solo-nuevo
   ------------------------------------------------------------------------ */
const TOPE_DIFS_GUARDADAS = 400;
function compararMapas(A, B) {
  const difs = []; const cuenta = { numerica: 0, "cero-con-signo": 0, tipo: 0, texto: 0, "solo-base": 0, "solo-nuevo": 0 };
  let comparadas = 0;
  const anota = (d) => { cuenta[d.clase]++; if (difs.length < TOPE_DIFS_GUARDADAS) difs.push(d); };
  for (const [k, a] of A) {
    if (!B.has(k)) { anota({ ruta: k, clase: "solo-base", base: a }); continue; }
    comparadas++;
    const b = B.get(k);
    if (typeof a === "number" && typeof b === "number") {
      if (!Object.is(a, b)) anota({ ruta: k, clase: (a === 0 && b === 0) ? "cero-con-signo" : "numerica", base: a, nuevo: b });
    } else if (typeof a === "string" && typeof b === "string") {
      if (a !== b) anota({ ruta: k, clase: "texto", base: a, nuevo: b });
    } else if (a !== b) {
      anota({ ruta: k, clase: "tipo", base: a, nuevo: b });
    }
  }
  for (const [k, b] of B) if (!A.has(k)) anota({ ruta: k, clase: "solo-nuevo", nuevo: b });
  return { comparadas, cuenta, difs };
}
const sumaCuenta = (c) => Object.values(c).reduce((a, b) => a + b, 0);
/* Lo que cuenta como diferencia «numérica o estructural» (código de salida 1). */
const cuentaNum = (c) => c.numerica + c["cero-con-signo"] + c.tipo + c["solo-base"] + c["solo-nuevo"];

/* ---------------------------------------------------------------------------
   ESCENARIOS. Cada uno se aplica IGUAL a los dos archivos, con las funciones
   de arranque de cada versión (defaultZone, defaultCarga...), así que el
   escenario prueba también que los valores de arranque no se movieron.
   ------------------------------------------------------------------------ */
const MOTORES = ["load", "clean", "equip", "duct", "vent", "quote", "valor", "kaizen", "elec", "hidro", "fuego", "aire", "civil", "soporte", "estr"];
const FAMILIAS_TECH = ["VRF", "DX_split", "paquete", "chiller_fancoil", "AHU", "PTAC"];

function permisos(c, modo) {
  const S = c.S();
  if (modo === "ninguno") { S.perms = {}; return; }
  const ks = modo === "todos" ? Object.keys(c.G("LINKS")) : modo;
  ks.forEach((k) => { S.perms[k] = { ts: 1, via: "comparador" }; });
}
function zona(c, nombre, ov) {
  const b = c.G("defaultZone")(nombre);
  return { ...b, ...ov, walls: { ...b.walls, ...(ov.walls || {}) }, glass: { ...b.glass, ...(ov.glass || {}) } };
}
function zonasLlenas(c) {
  return [
    zona(c, "Producción", { spaceType: "production", area: 800, height: 7, occ: 45, lights: 16000, equip: 60000, ach: .5, runHours: 24,
      walls: { N: 60, NE: 10, E: 40, S: 60, W: 40 }, roof: 800, glass: { S: 12, E: 6 }, lightType: "led" }),
    zona(c, "Oficinas", { spaceType: "office", area: 250, height: 3, occ: 30, lights: 3500, equip: 6000, runHours: 12, plenum: true,
      walls: { N: 25, E: 12, S: 25, W: 12 }, roof: 250, glass: { N: 20, S: 15 }, lightType: "fluorescent" }),
    zona(c, "Sala limpia ISO 7", { spaceType: "cleanroom", iso: "iso7", achClean: 45, ffuHeat: 900, area: 150, height: 3.2, occ: 8, lights: 4000, equip: 12000, runHours: 24,
      walls: { N: 30, E: 20 }, roof: 150 }),
    zona(c, "Site de datos", { spaceType: "server", area: 40, height: 3, occ: 2, lights: 600, equip: 25000, runHours: 24, swing: 1.5,
      walls: { E: 10 }, roof: 40 }),
  ];
}
function llenar(c, o = {}) {
  const { G } = c; const S = c.S();
  S.meta.name = "Proyecto comparador"; S.meta.client = "Cliente de prueba"; S.meta.engineer = "Ing. de prueba"; S.meta.location = "Tijuana, B.C.";
  S.zones = zonasLlenas(c); S.zi = 0;
  S.vent = { ...S.vent, mode: "general", spaceType: "production", area: 800, height: 7, ach: 6, occ: 45 };
  const seg = G("defaultSegment");
  const ac = (t, q, C) => ({ type: t, qty: q, C });
  S.duct.segments = [
    { ...seg("SA-PRINCIPAL", 12000), length: 45, fittings: [ac("elbow_90_smooth", 4, .21), ac("tee_branch", 2, .65), ac("trans_gradual", 2, .05), ac("damper_open", 1, .2)] },
    { ...seg("SA-RAMAL-1", 4000), shape: "round", length: 20, method: "velocity", targetV: 7, fittings: [ac("elbow_90_miter", 3, .42), ac("exit_diffuser", 1, 1)] },
    { ...seg("SA-RAMAL-2", 3000), shape: "rect", length: 25, aspect: 2, hmax: 400, fittings: [ac("elbow_90_rect", 2, .28), ac("wye_45", 1, .3)] },
    { ...seg("RA-1", 9000), service: "return", length: 35, fittings: [ac("entry_bell", 1, .03), ac("elbow_45", 3, .15)] },
    { ...seg("EX-1", 2500), service: "exhaust", shape: "round", length: 30, fittings: [ac("flex_connector", 1, .25), ac("fire_damper", 1, .35)] },
  ];
  const room = G("defaultRoom");
  S.clean = { rooms: [
    { ...room("Sala ISO 7"), iso: "iso7", level: "med", area: 150, height: 3.2, occ: 8, procW: 3000 },
    { ...room("Sala ISO 5"), iso: "iso5", level: "high", area: 40, height: 3, occ: 3, procW: 1500, dp: 15, crackLen: 8, oaFrac: .15 },
    { ...room("Vestidor ISO 8"), iso: "iso8", level: "low", area: 30, height: 2.7, occ: 4, procW: 200 },
  ], ci: 0 };
  const carga = G("defaultCarga");
  S.elec.tomarHVAC = true;
  S.elec.cargas = [
    { ...carga("Compresor de proceso"), tipo: "motor", kW: 15, L: 40 },
    { ...carga("Alumbrado nave"), tipo: "alumbrado", kW: 12, L: 30, ph: 1, V: 127 },
    { ...carga("Contactos"), tipo: "contactos", kW: 6, L: 35, ph: 1, V: 127 },
    { ...carga("Horno"), tipo: "resistiva", kW: 20, L: 25 },
    { ...carga("UPS site"), tipo: "ups", kW: 10, L: 18 },
    { ...carga("Línea de proceso"), tipo: "proceso", kW: 25, L: 50, fp: .8, cant: 2 },
  ];
  S.hidro.muebles = [{ id: "wc_flux", cant: 8 }, { id: "ming_flux", cant: 4 }, { id: "lavabo", cant: 12 }, { id: "regadera", cant: 6 }, { id: "fregadero", cant: 2 }, { id: "lavaojos", cant: 2 }];
  const tr = typeof G("defaultTramoAgua") === "function" ? G("defaultTramoAgua") : (tag) => ({ id: "h" + tag, tag, servicio: "fria", um: 0, L: 0, alt: 0, tipoUM: "auto" });
  S.hidro.tramos = [{ ...tr("AF-1"), um: 150, L: 60, alt: 3 }, { ...tr("AC-1"), servicio: "caliente", um: 40, L: 30, alt: 2 }, { ...tr("AF-2"), um: 60, L: 25, alt: 1 }];
  Object.assign(S.hidro, { presRed: 30, habitantes: 120, alturaEdificio: 9, dot: "cuartolimpio", calentador: "deposito", uso: "publico", material: "cobre" });
  Object.assign(S.fuego, { area: 1500, altura: 8, riesgo: "ord2", rociador: "k115", Lramal: 45, Lmontante: 20, presFuente: 25, fuente: "cisterna", tomarArea: true });
  const cons = G("defaultConsumo");
  S.aire.consumos = [
    { ...cons("Herramienta neumática"), tipo: "generico", cant: 12, lmin: 150, bar: 6, uso: .4 },
    { ...cons("Actuadores"), tipo: "actuador", cant: 30, lmin: 20, bar: 6, uso: .6 },
    { ...cons("Proceso"), tipo: "generico", cant: 4, lmin: 400, bar: 7, uso: .8 },
  ];
  Object.assign(S.aire, { Lprincipal: 120, Lramales: 90, clase: "1.4.1", material: "aluminio" });
  Object.assign(S.civil, { demoler: true, demolMuroM2: 120, demolPlafonM2: 300, demolPisoM2: 200, firmeM2: 300, azulejoM2: 60, pinturaM2: 800, puertasLimpias: 4, puertasSimples: 6, visores: 4, passbox: 2 });
  Object.assign(S.soporte, { sismico: true, mesesElevacion: 4, rielM: 60, sismoSDS: 1.0 });
  /* Partidas de equipo: el primer modelo de cuatro familias del catálogo. */
  const fp = G("familyPool"), fams = G("FAMILIES");
  S.quote.items = fams.slice(0, 4).map((f, i) => { const m = fp(f.id)[0]; return m ? { id: m.id, fam: f.id, qty: 1 + i, unit: null } : null; }).filter(Boolean);
  permisos(c, o.perms === undefined ? "todos" : o.perms);
}
/* Un escenario = { id, titulo, build(c) }. `soloNuevo(c)` (opcional) devuelve true
   si el escenario sólo se puede correr en la versión nueva. */
const ESCENARIOS = [];
const esc = (id, titulo, build, extra = {}) => ESCENARIOS.push({ id, titulo, build, ...extra });

esc("vacio", "Proyecto vacío recién abierto", () => {});
esc("prueba", "Proyecto de prueba del arnés (2 zonas, todos los cruces autorizados)", (c) => {
  const S = c.S(), G = c.G;
  S.meta.name = "Proyecto de prueba"; S.meta.client = "EMP interno"; S.meta.engineer = "Ing. de prueba";
  S.zones = [
    { ...G("defaultZone")("Producción"), area: 400, height: 6, occ: 30, lights: 8000, equip: 12000, walls: { N: 40, S: 40, E: 30, O: 30 }, roof: 400 },
    { ...G("defaultZone")("Oficinas"), area: 100, height: 3, occ: 10, lights: 1500, equip: 2000, walls: { N: 12, S: 12, E: 10, O: 10 }, roof: 100 },
  ];
  S.zi = 0; permisos(c, "todos");
});
esc("lleno", "Proyecto lleno: 4 zonas, cargas, muebles, aire, ductos, cuartos limpios, partidas", (c) => llenar(c));
esc("lleno-sin-cruces", "Proyecto lleno con TODOS los cruces sin autorizar", (c) => llenar(c, { perms: "ninguno" }));
esc("lleno-cruces-parciales", "Proyecto lleno con sólo algunos cruces autorizados", (c) => llenar(c, { perms: ["load>duct", "equip>quote", "elec>quote", "hidro>quote", "load>quote", "vent>elec"] }));
esc("zonas-oaFixed-fluorescent", "Zonas con oaFixed y lightType fluorescent (y una LED sin oaFixed)", (c) => {
  llenar(c);
  const S = c.S();
  S.zones.forEach((z, i) => { z.lightType = i === 3 ? "led" : "fluorescent"; z.oaFixed = [3000, 1500, 2200, 0][i]; });
});
["chiller", "vrf", "rooftop", "split"].forEach((k) => esc(`sys-${k}`, `Arquitectura forzada (sysForce) = ${k}`, (c) => { llenar(c); c.S().sysForce = k; }));
FAMILIAS_TECH.forEach((k) => esc(`tech-${k}`, `Tecnología forzada (forceTech) = ${k}`, (c) => { llenar(c); c.S().forceTech = k; }));
esc("zonas-materiales", "Envolvente: otros muros, techos y vidrios en cada zona (paneles, tilt-up, lámina, low-e, policarbonato)", (c) => {
  llenar(c);
  const Z = c.S().zones;
  const mats = [["wall_panel_rockwool_100", "roof_panel_rockwool_100", "glass_lowe"], ["wall_tiltup_20_xps50", "roof_tpo_reflectiva_xps75", "glass_reflective"],
    ["usg_drywall_steel_r19", "roof_usg_ceiling_r30", "glass_dgu_lowe_lam"], ["wall_lamina_sin_aisl", "roof_lamina_fibra_75", "glass_policarbonato_16"]];
  Z.forEach((z, i) => { [z.wallMat, z.roofMat, z.glassMat] = mats[i % mats.length]; });
  Z[0].glass.N = 8; Z[0].glass.W = 5; Z[1].glass.E = 9; Z[3].glass.S = 3;
});
esc("barra-calcular-todos", "SÓLO NUEVA · botón Calcular de la barra pulsado en cada motor (la base corre lo mismo sin el botón)", (c) => {
  llenar(c);
  c.G("recompute")();
  c.w.eval(`Object.keys(MOTOR_ACC).forEach(function (id) { try { accCalcular(id); } catch (e) { window.__errs.push("accCalcular " + id + ": " + e.message); } })`);
}, { requiere: "accCalcular", buildBase: (c) => llenar(c) });
esc("barra-calcular-vacio", "SÓLO NUEVA · botón Calcular pulsado en un proyecto vacío (debe avisar y no mover nada)", (c) => {
  c.G("recompute")();
  c.w.eval(`Object.keys(MOTOR_ACC).forEach(function (id) { try { accCalcular(id); } catch (e) { window.__errs.push("accCalcular " + id + ": " + e.message); } })`);
}, { requiere: "accCalcular", buildBase: () => {} });
esc("peakScan-false", "peakScan = false (carga a la hora de diseño, sin barrido)", (c) => { llenar(c); c.S().peakScan = false; });
esc("bldDiv-08", "Diversidad de edificio 0.8", (c) => { llenar(c); c.S().bldDiv = .8; });
esc("cotiz-USD", "Cotización en USD (tipo de cambio 17.9)", (c) => { llenar(c); Object.assign(c.S().quote, { currency: "USD", fx: 17.9 }); });
esc("cotiz-sin-items", "Cotización sin partidas de equipo agregadas", (c) => { llenar(c); c.S().quote.items = []; });
esc("plaza-mexicali", "Plaza y sitio Mexicali", (c) => { llenar(c); const S = c.S(); S.quote.plaza = "mexicali"; S.site = { key: "mexicali", db: 46, wb: 23, alt: 3 }; });
esc("plaza-otra-factor", "Plaza «otra» con factor manual 1.09", (c) => { llenar(c); const S = c.S(); S.quote.plaza = "otra"; S.quote.plazaFactor = 1.09; });
esc("sitio-custom", "Sitio personalizado (db 41, wb 22, 300 m)", (c) => { llenar(c); c.S().site = { key: "custom", db: 41, wb: 22, alt: 300 }; });
esc("cotiz-licitacion", "Cotización en modo licitación, base CMIC, IVA 8 %", (c) => {
  llenar(c);
  Object.assign(c.S().quote, { modo: "licitacion", basePrecio: "cmic", iva: .08, contingencia: .1, indirect: .2, utility: .1, fasar: 1.5, priceFactor: 1.05, scaleExp: .8, instPct: .3 });
});
esc("ductos-accesorios", "Ductos con todos los accesorios, redondo/rectangular, métodos y candados", (c) => {
  llenar(c);
  const S = c.S(), seg = c.G("defaultSegment");
  const F = c.G("FITTINGS");
  const todos = F.map(([type, , C], i) => ({ type, qty: 1 + (i % 3), C }));
  S.duct.meta.material = "galvanized";
  S.duct.segments = [
    { ...seg("T-1", 15000), length: 60, fittings: todos },
    { ...seg("T-2", 6000), shape: "round", method: "velocity", targetV: 8, length: 40, fittings: todos.slice(0, 8) },
    { ...seg("T-3", 3500), shape: "rect", aspect: 4, hmax: 300, length: 18, fittings: todos.slice(5) },
    { ...seg("T-4", 1200), shape: "round", method: "equal_friction", targetF: 1, length: 12, fittings: [] },
    { ...seg("T-5", 8000), service: "return", shape: "rect", length: 50, lock: true, w: 800, h: 500, fittings: todos.slice(2, 9) },
    { ...seg("T-6", 2000), service: "exhaust", shape: "round", lock: true, d: 350, length: 22, fittings: todos.slice(0, 4) },
  ];
});
esc("soporte-sismico-viga", "Soportería con sísmico, SDS 1.5, estructura de viga de acero", (c) => {
  llenar(c); Object.assign(c.S().soporte, { sismico: true, sismoSDS: 1.5, estructuraTipo: "viga_acero", alturaTrabajo: 7.5, alturaColgadoM: .8, mesesElevacion: 5, basesEquipo: 6 });
});
esc("soporte-sin-sismico-manual", "Soportería sin sísmico y con metros capturados (sin usar motores)", (c) => {
  llenar(c); Object.assign(c.S().soporte, { sismico: false, usarMotores: false, ductoM: 250, tubHidroM: 120, tubFuegoM: 300, tubAireM: 180, rielM: 90, estructuraTipo: "deck" });
});
esc("soporte-losa-fc", "Soportería sísmica sobre losa f'c 300", (c) => {
  llenar(c); Object.assign(c.S().soporte, { sismico: true, sismoSDS: 1.2, estructuraTipo: "losa_concreto", estructuraFc: 300 });
});
esc("civil-demolicion", "Obra civil con demolición y acabados por m²", (c) => {
  llenar(c); Object.assign(c.S().civil, { demoler: true, demolMuroM2: 400, demolPlafonM2: 900, demolPisoM2: 700, muro: "panel_mgo", plafon: "panel_mgo", piso: "epoxi_esd", firmeM2: 900, azulejoM2: 200, pinturaM2: 2500, puertasLimpias: 9, passbox: 5, mediaCanaDoble: false });
});
esc("civil-manual", "Obra civil con geometría capturada (sin usar zonas)", (c) => {
  llenar(c); Object.assign(c.S().civil, { usarZonas: false, areaManual: 500, alturaManual: 3.5, murosManual: 220 });
});
const ventBase = { area: 60, height: 4, occ: 6 };
esc("vent-kitchen", "Ventilación: campana de cocina", (c) => { llenar(c); c.S().vent = { ...c.S().vent, ...ventBase, mode: "kitchen", hoodL: 3, hoodW: 1.2, hoodType: "island", duty: "heavy" }; });
esc("vent-industrial", "Ventilación: extracción industrial de proceso (rige el caudal de proceso)", (c) => { llenar(c); c.S().vent = { ...c.S().vent, ...ventBase, mode: "industrial", ach: 1, processCFM: 30000 }; });
esc("vent-louver", "Ventilación: persiana", (c) => { llenar(c); c.S().vent = { ...c.S().vent, ...ventBase, mode: "louver", louverW: 2.4, louverH: 1.8, freeArea: .55, faceVel: 450 }; });
esc("vent-mua", "Ventilación: aire de reposición", (c) => { llenar(c); c.S().vent = { ...c.S().vent, ...ventBase, mode: "mua", ach: 12 }; });
esc("cuartos-limpios", "Cuartos limpios ISO 5 a 8, niveles bajo/medio/alto y achSet manual", (c) => {
  llenar(c);
  const room = c.G("defaultRoom");
  c.S().clean = { rooms: [
    { ...room("ISO 5"), iso: "iso5", level: "high", area: 60, height: 3.2, occ: 5, procW: 4000 },
    { ...room("ISO 6"), iso: "iso6", level: "med", area: 80, height: 3, occ: 6, procW: 2500, achSet: 110 },
    { ...room("ISO 7"), iso: "iso7", level: "low", area: 200, height: 3, occ: 12, procW: 6000, dp: 20 },
    { ...room("ISO 8"), iso: "iso8", level: "med", area: 300, height: 3.5, occ: 20, procW: 9000, oaFrac: .2 },
  ], ci: 1 };
  c.S().zones[2].iso = "iso5"; c.S().zones[2].achClean = 300;
});
esc("instalaciones-variantes", "Eléctrico 440 V aluminio, hidráulico privado, fuego extra 1 con red, aire ISO 1.2.1 inox N+1", (c) => {
  llenar(c);
  const S = c.S();
  Object.assign(S.elec, { sistema: "3F4H-440", material: "aluminio", tempAmb: 45, nCond: 6, trafoKVA: 300, Ltablero: 60, fpObjetivo: .92 });
  Object.assign(S.hidro, { uso: "privado", material: "cpvc", calentador: "paso", dot: "oficina", habitantes: 300, diasReserva: 2, presRed: 18 });
  Object.assign(S.fuego, { riesgo: "extra1", rociador: "k160", material: "cpvc", fuente: "red", presFuente: 40, areaDiseno: 300 });
  Object.assign(S.aire, { clase: "1.2.1", material: "inox_304", redundancia: "n1", presionUso: 7, fugas: .15, reserva: .3, horas: 6000 });
});
esc("propuestas-aceptadas", "Todas las propuestas entre disciplinas aceptadas (propAceptar)", (c) => {
  llenar(c, { perms: "ninguno" });
  c.G("recompute")();
  c.w.eval(`Object.keys(PROPUESTAS).forEach(function (id) { try { propAceptar(id); } catch (e) { window.__errs.push("propAceptar " + id + ": " + e.message); } })`);
});
esc("propuestas-propio", "Todas las propuestas marcadas «capturo lo mío» (propPropio)", (c) => {
  llenar(c, { perms: "ninguno" });
  c.G("recompute")();
  c.w.eval(`Object.keys(PROPUESTAS).forEach(function (id) { try { propPropio(id); } catch (e) { window.__errs.push("propPropio " + id + ": " + e.message); } })`);
});
esc("herencia-propio", "Campos heredables capturados a mano (regla 1 rota a propósito)", (c) => {
  llenar(c);
  const S = c.S();
  c.G("recompute")();
  c.w.eval(`Object.keys(HEREDA).forEach(function (p) { try { marcarPropio(p); } catch (e) { window.__errs.push("marcarPropio " + p + ": " + e.message); } })`);
  S.vent.area = 123; S.vent.height = 4.5; S.vent.occ = 17; S.fuego.area = 999; S.fuego.altura = 5.5;
});
esc("valor-decisiones", "Ingeniería de valor: primera medida aceptada, segunda descartada", (c) => {
  llenar(c);
  c.G("recompute")();
  c.w.eval(`(function () { var ps = (VALOR && VALOR.props) || []; try { if (ps[0]) veDecidir(ps[0].id, "aceptada"); if (ps[1]) veDecidir(ps[1].id, "descartada"); } catch (e) { window.__errs.push("veDecidir: " + e.message); } })()`);
});
esc("kaizen-items", "Kaizen con mejoras capturadas en distintas etapas del ciclo PDCA", (c) => {
  llenar(c);
  const S = c.S();
  S.kaizen.items.push({ titulo: "Mejora A", estado: "planear", owner: "Ing. A", ahorro: 15000, nota: "" });
  S.kaizen.items.push({ titulo: "Mejora B", estado: "hacer", owner: "Ing. B", ahorro: 42000, nota: "en obra" });
  S.kaizen.items.push({ titulo: "Mejora C", estado: "verificar", owner: "", ahorro: 8000, nota: "" });
  S.kaizen.items.push({ titulo: "Mejora D", estado: "actuar", owner: "", ahorro: 0, nota: "" });
});
esc("unidades-IP", "Unidades imperiales (S.units = IP): los motores no deben notarlo", (c) => { llenar(c); c.S().units = "IP"; });
esc("sin-zonas-con-datos", "Sin zonas pero con datos capturados en las demás disciplinas", (c) => {
  llenar(c); c.S().zones = []; c.S().zi = 0;
});
/* rev 2.9.15 · Capturas parciales: un proyecto vacío con UNA sola disciplina capturada y todos los cruces
   autorizados. Ejercitan el semáforo (qué cuenta como captura real) y los pisos internos de los motores con
   casi nada capturado, que es donde un cambio de «datos» a «sin datos» o un piso movido se esconderían. */
const parcial = (id, titulo, fn) => esc(`parcial-${id}`, `Captura parcial · ${titulo}`, (c) => {
  const S = c.S(); S.meta.name = `Parcial ${id}`; permisos(c, "todos"); fn(S, c.G);
});
parcial("fuego", "sólo contra incendio (300 m²)", (S) => { S.fuego.area = 300; });
parcial("civil-directas", "sólo cantidades directas de obra civil (firme y puertas, sin área)", (S) => { S.civil.firmeM2 = 80; S.civil.puertasSimples = 3; });
parcial("soporte-riel", "sólo riel de soportería (60 m)", (S) => { S.soporte.rielM = 60; });
parcial("vent-cocina-sin-medidas", "ventilación en modo cocina sin medidas de campana", (S) => { S.vent.mode = "kitchen"; });
parcial("vent-cocina", "ventilación en modo cocina con campana de 2.5 × 1.1 m", (S) => { S.vent.mode = "kitchen"; S.vent.hoodL = 2.5; S.vent.hoodW = 1.1; });
parcial("ductos-sin-caudal", "un tramo de ducto capturado sin caudal", (S, G) => { S.duct.segments.push(G("defaultSegment")("TR-1", 0)); });
parcial("ductos-con-caudal", "un tramo de ducto de 3,400 m³/h", (S, G) => { S.duct.segments.push(G("defaultSegment")("TR-1", 3400)); });
parcial("limpio", "sólo un cuarto limpio de 60 m² × 3 m", (S, G) => { const r = G("cleanRooms")()[0]; r.area = 60; r.height = 3; });
parcial("equipo-manual", "sólo un equipo elegido a mano en la cotización", (S, G) => {
  const f = G("FAMILIES")[0], m = G("familyPool")(f.id)[0];
  if (m) S.quote.items.push({ id: m.id, fam: f.id, qty: 1, unit: null });
});
parcial("zona-sola", "una zona de 120 m² × 3 m y nada más", (S) => { S.zones[0].area = 120; S.zones[0].height = 3; });

/* ---------------------------------------------------------------------------
   Recolección: corre los motores y junta todo lo que se compara.
   ------------------------------------------------------------------------ */
const NO_EXISTE = "<<no existe en esta versión>>";
function envolver(w) {
  const ev = (codigo, requiere) => {
    if (requiere && w.eval(`typeof ${requiere}`) === "undefined") return NO_EXISTE;
    try { return w.eval(`(function(){ try { return (${codigo}); } catch (e) { return { __error: String((e && e.message) || e) }; } })()`); }
    catch (e) { return { __error: "eval: " + e.message }; }
  };
  return ev;
}
const SLICES = {
  load: "({ zones: S.zones, site: S.site, bldDiv: S.bldDiv, forceTech: S.forceTech, peakScan: S.peakScan, zi: S.zi })",
  clean: "S.clean", equip: "({ sysForce: S.sysForce, sel: S.sel, qfam: S.qfam })", duct: "S.duct", vent: "S.vent", quote: "S.quote",
  valor: "(S.kaizen && S.kaizen.ve)", kaizen: "({ items: S.kaizen && S.kaizen.items, desv: S.kaizen && S.kaizen.desv })",
  elec: "S.elec", hidro: "S.hidro", fuego: "S.fuego", aire: "S.aire", civil: "S.civil", soporte: "S.soporte",
};
/* Devuelve { motor: { salida: <objeto>, estado: <objeto> } , ... , _extras }. */
function recolectar(w) {
  const ev = envolver(w);
  const fallos = [];
  const paso = w.eval(`(function () {
    var o = { errores: [] };
    try { S.tab = "tablero"; recompute(); } catch (e) { o.errores.push("recompute: " + (e && e.message)); }
    o.kzLazy = KAIZEN; o.vzLazy = VALOR;
    if (typeof computeKaizen === "function") { try { o.kzExp = computeKaizen(); KAIZEN = o.kzExp; } catch (e) { o.kzExp = { __error: String(e && e.message) }; } }
    if (typeof computeIngValor === "function") { try { o.vzExp = computeIngValor(); VALOR = o.vzExp; } catch (e) { o.vzExp = { __error: String(e && e.message) }; } }
    return o;
  })()`);
  if (paso.errores.length) fallos.push(...paso.errores);
  const cot = (mot) => ev(`cotizacionDeMotor(${JSON.stringify(mot)})`, "cotizacionDeMotor");
  const R = {};
  const uno = (motor, salida) => { R[motor] = { salida, estado: SLICES[motor] ? ev(SLICES[motor]) : undefined, cotizacion: cot(motor) }; };
  uno("load", { LOADS: ev("LOADS"), totals: ev("totals()", "totals") });
  uno("clean", { CLEAN: ev("CLEAN") });
  uno("equip", { SYS: ev("SYS") });
  uno("duct", { DUCT: ev("DUCT") });
  uno("vent", { VENT: ev("VENT") });
  uno("quote", { QUOTE: ev("QUOTE"), catalogoConceptos: ev("catalogoConceptos()", "catalogoConceptos") });
  uno("valor", { lazy: paso.vzLazy, explicito: paso.vzExp === undefined ? NO_EXISTE : paso.vzExp });
  uno("kaizen", { lazy: paso.kzLazy, explicito: paso.kzExp === undefined ? NO_EXISTE : paso.kzExp });
  uno("elec", { ELEC: ev("ELEC"), filasPropuesta: ev("propuestaElecFilas()", "propuestaElecFilas") });
  uno("hidro", { HIDRO: ev("HIDRO") });
  uno("fuego", { FUEGO: ev("FUEGO") });
  uno("aire", { AIRE: ev("AIRE") });
  uno("civil", { CIVIL: ev("CIVIL") });
  uno("soporte", { SOPORTE: ev("SOPORTE") });
  /* Estructural es externo (StructCalc, archivo aparte): «no aplica». */
  R.estr = { salida: ev(`(function(){ var d = (typeof DISCIPLINAS !== "undefined" ? DISCIPLINAS : []).find(function (x) { return x.id === "estr"; }); return { grupo: d ? d.grupo : null, hayMotorEnEstado: typeof ESTR !== "undefined" || typeof ESTRUCTURAL !== "undefined" }; })()`) };
  R.valid = { salida: { VALID: ev("VALID") } };
  R.semaforo = { salida: { semaforo: ev("semaforoSuite().map(function (s) { return { id: s.id, nivel: s.nivel, texto: s.texto, faltan: s.faltan }; })", "semaforoSuite") } };
  /* Huella de cobertura: lo que este escenario efectivamente calcula (para probar que no es un
     escenario vacío que «empata» por no hacer nada). No se compara: se imprime. */
  R._cobertura = ev(`(function () {
    var t = totals(), q = QUOTE;
    var partidas = 0; try { partidas = catalogoConceptos().secciones.reduce(function (a, s) { return a + s.partidas.length; }, 0); } catch (e) {}
    return { arq: SYS && SYS.chosen && SYS.chosen.id, tons: Math.round(t.tons * 100) / 100, zonas: LOADS.length, directo: Math.round(q.direct), partidas: partidas,
      kVA: Math.round(ELEC.kVAconectada * 10) / 10, hidroLs: Math.round(HIDRO.Qtotal * 100) / 100, rociad: FUEGO.nTotal, hpAire: AIRE.principal ? AIRE.principal.hp : 0,
      civil: Math.round(CIVIL.total), soporte: Math.round(SOPORTE.total), kzOps: KAIZEN.ops.length, vzProps: VALOR.props.length, ffu: CLEAN.sum ? CLEAN.sum.ffu : 0,
      segs: DUCT.segs.length, cfm: Math.round(VENT.demand || 0),
      tec: LOADS.map(function (l) { return l.eq && l.eq.tech ? l.eq.tech : "-"; }).join("/"),
      estr: (typeof DISCIPLINAS !== "undefined" ? (DISCIPLINAS.find(function (x) { return x.id === "estr"; }) || {}).grupo : null) || "-" };
  })()`);
  R._rev = ev("REV");
  R._errores = (w.__errs || []).slice(); R._fallos = fallos;
  return R;
}

/* ---------------------------------------------------------------------------
   Libro de Excel de la propuesta: sólo celdas numéricas y fórmulas.
   ------------------------------------------------------------------------ */
function leerZipStore(buf) {
  const arch = new Map(); let off = 0;
  while (off + 30 <= buf.length && buf.readUInt32LE(off) === 0x04034b50) {
    const metodo = buf.readUInt16LE(off + 8), csize = buf.readUInt32LE(off + 18), nlen = buf.readUInt16LE(off + 26), elen = buf.readUInt16LE(off + 28);
    const nombre = buf.toString("utf8", off + 30, off + 30 + nlen);
    const ini = off + 30 + nlen + elen;
    if (metodo === 0) arch.set(nombre, buf.toString("utf8", ini, ini + csize));
    off = ini + csize;
  }
  return arch;
}
const desxml = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
function xlsxCeldas(bytes) {
  const arch = leerZipStore(Buffer.from(bytes));
  const wb = arch.get("xl/workbook.xml") || "";
  const hojas = [...wb.matchAll(/<sheet name="([^"]*)" sheetId="(\d+)"/g)].map((m) => ({ nombre: desxml(m[1]), n: +m[2] }));
  const num = new Map(), form = new Map();
  hojas.forEach((h) => {
    const xml = arch.get(`xl/worksheets/sheet${h.n}.xml`) || "";
    for (const m of xml.matchAll(/<c r="([A-Z]+\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cuerpo = m[2] || "";
      const v = /<v>([^<]*)<\/v>/.exec(cuerpo), f = /<f>([^<]*)<\/f>/.exec(cuerpo);
      if (f) form.set(`${h.nombre}!${m[1]}`, desxml(f[1]));
      else if (v && !/t="inlineStr"/.test(m[0])) num.set(`${h.nombre}!${m[1]}`, Number(v[1]));
    }
  });
  return { hojas: hojas.map((h) => h.nombre), num, form };
}
function recolectarXlsx(w) {
  const salida = {};
  for (const [id, opt] of [["es", "{lang:'es'}"], ["en", "{lang:'en', mon:'USD'}"]]) {
    try {
      if (w.eval("typeof buildPropuestaXlsx") === "undefined") { salida[id] = NO_EXISTE; continue; }
      const bytes = w.eval(`buildPropuestaXlsx(${opt})`);
      salida[id] = xlsxCeldas(bytes);
    } catch (e) { salida[id] = { error: String(e && e.message || e) }; }
  }
  return salida;
}
function compararXlsx(A, B) {
  const cuenta = { numerica: 0, "cero-con-signo": 0, tipo: 0, texto: 0, "solo-base": 0, "solo-nuevo": 0, reubicado: 0, formula: 0 };
  const difs = []; let comparadas = 0;
  if (A === NO_EXISTE || B === NO_EXISTE) return { comparadas: 0, cuenta, difs, noComparable: true };
  if (A.error || B.error) {
    if (A.error !== B.error) { cuenta.tipo++; difs.push({ ruta: "<<error al generar>>", clase: "tipo", base: A.error || "ok", nuevo: B.error || "ok" }); }
    return { comparadas, cuenta, difs };
  }
  const anota = (d) => { cuenta[d.clase]++; if (difs.length < TOPE_DIFS_GUARDADAS) difs.push(d); };
  /* Números: por celda; si una celda difiere y el conjunto de valores de la hoja es idéntico,
     es una reubicación (cambio de maquetación), no un número movido. */
  const porHoja = (mapa) => { const h = new Map(); for (const [k, v] of mapa) { const s = k.slice(0, k.indexOf("!")); if (!h.has(s)) h.set(s, []); h.get(s).push(v); } return h; };
  const hA = porHoja(A.num), hB = porHoja(B.num);
  const multiIgual = (x = [], y = []) => x.length === y.length && [...x].sort().join("|") === [...y].sort().join("|");
  for (const [k, a] of A.num) {
    if (!B.num.has(k)) { const hoja = k.slice(0, k.indexOf("!")); anota({ ruta: k, clase: multiIgual(hA.get(hoja), hB.get(hoja)) ? "reubicado" : "solo-base", base: a }); continue; }
    comparadas++;
    const b = B.num.get(k);
    if (!Object.is(a, b)) anota({ ruta: k, clase: (a === 0 && b === 0) ? "cero-con-signo" : "numerica", base: a, nuevo: b });
  }
  for (const [k, b] of B.num) if (!A.num.has(k)) { const hoja = k.slice(0, k.indexOf("!")); anota({ ruta: k, clase: multiIgual(hA.get(hoja), hB.get(hoja)) ? "reubicado" : "solo-nuevo", nuevo: b }); }
  const fA = porHoja(A.form), fB = porHoja(B.form);
  for (const [k, a] of A.form) {
    const hoja = k.slice(0, k.indexOf("!"));
    if (!B.form.has(k)) { anota({ ruta: k, clase: multiIgual(fA.get(hoja), fB.get(hoja)) ? "reubicado" : "solo-base", base: a }); continue; }
    comparadas++;
    if (a !== B.form.get(k)) anota({ ruta: k, clase: "formula", base: a, nuevo: B.form.get(k) });
  }
  for (const [k, b] of B.form) if (!A.form.has(k)) { const hoja = k.slice(0, k.indexOf("!")); anota({ ruta: k, clase: multiIgual(fA.get(hoja), fB.get(hoja)) ? "reubicado" : "solo-nuevo", nuevo: b }); }
  return { comparadas, cuenta, difs };
}

/* ---------------------------------------------------------------------------
   PDF (rev 2.9.15). La suite escribe sus PDF sin comprimir (operador Tj), así que el texto
   se lee directo del archivo. Se comparan los NÚMEROS de cada PDF en orden, con igualdad
   exacta de su escritura (un número mal redondeado también cuenta). Antes se quita el pie
   «Página i de n» (un texto corregido puede recorrer la paginación sin mover un cálculo) y se
   normaliza la marca de revisión. Un cambio de texto sin números sólo se informa.
   ------------------------------------------------------------------------ */
const PDF_FIJOS = [
  ["memoria-integral", "buildMemoriaIntegralPdf()", "buildMemoriaIntegralPdf"],
  ["memoria-general", "buildMemoriaPdf()", "buildMemoriaPdf"],
  ["cedula-equipos", "buildCedulaEquiposPdf()", "buildCedulaEquiposPdf"],
  ["propuesta-es", "buildPropuestaPdf({ lang: 'es', mon: 'MXN' })", "buildPropuestaPdf"],
  ["propuesta-en", "buildPropuestaPdf({ lang: 'en', mon: 'USD' })", "buildPropuestaPdf"],
  ["licitacion", "buildLicitacionPdf()", "buildLicitacionPdf"],
];
function pdfTexto(bytes) {
  const s = typeof bytes === "string" ? bytes : Buffer.from(bytes).toString("latin1");
  const ESC = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" };
  const runs = [];
  for (const m of s.matchAll(/Tm \(((?:\\[\s\S]|[^\\)])*)\) Tj/g)) {
    runs.push(m[1].replace(/\\([0-7]{1,3}|[\s\S])/g, (x, c) => (/^[0-7]/.test(c) ? String.fromCharCode(parseInt(c, 8)) : (ESC[c] || c))));
  }
  return runs.join("\n");
}
function pdfNumeros(texto, revs) {
  let t = texto.replace(/P\u00e1gina \d+ de \d+|Pagina \d+ de \d+|Page \d+ of \d+/g, "");
  for (const r of revs || []) t = t.split(r).join("<rev>");
  const nums = [];
  for (const m of t.matchAll(/-?\d+(?:[.,]\d+)*/g)) nums.push({ v: m[0], i: m.index });
  return { t, nums };
}
function recolectarPdf(w, revs) {
  const salida = {};
  const lista = [];
  try {
    const ids = w.eval("typeof MOTOR_ACC === 'undefined' ? [] : Object.keys(MOTOR_ACC).filter(function (k) { return !MOTOR_ACC[k].externo; })");
    for (const id of ids) {
      lista.push([`memoria-${id}`, `MOTOR_ACC[${JSON.stringify(id)}].memoria()`, null]);
      const cot = w.eval(`MOTOR_ACC[${JSON.stringify(id)}].cot || null`);
      if (cot && cot !== "propuesta") lista.push([`cotizacion-${id}`, `buildCotizacionMotorPdf(${JSON.stringify(cot)})`, "buildCotizacionMotorPdf"]);
    }
  } catch (e) { salida["<<lista>>"] = { error: String((e && e.message) || e) }; }
  lista.push(...PDF_FIJOS);
  for (const [nombre, expr, requiere] of lista) {
    try {
      if (requiere && w.eval(`typeof ${requiere}`) === "undefined") { salida[nombre] = NO_EXISTE; continue; }
      const b = w.eval(expr);
      if (b == null) { salida[nombre] = { error: "sin salida" }; continue; }
      salida[nombre] = pdfNumeros(pdfTexto(b), revs);
    } catch (e) { salida[nombre] = { error: String((e && e.message) || e) }; }
  }
  return salida;
}
function compararPdf(A, B) {
  const cuenta = { numerica: 0, "solo-base": 0, "solo-nuevo": 0, tipo: 0, texto: 0 };
  const difs = []; let comparadas = 0;
  const anota = (d) => { cuenta[d.clase]++; if (difs.length < TOPE_DIFS_GUARDADAS) difs.push(d); };
  const ctx = (o, i) => o.t.slice(Math.max(0, i - 48), i + 28).replace(/\s+/g, " ").trim();
  for (const n of [...new Set([...Object.keys(A || {}), ...Object.keys(B || {})])]) {
    const a = (A || {})[n], b = (B || {})[n];
    if (a === NO_EXISTE || b === NO_EXISTE) continue;
    if (!a || !b) { anota({ ruta: n, clase: a ? "solo-base" : "solo-nuevo", base: a ? "pdf" : "-", nuevo: b ? "pdf" : "-" }); continue; }
    if (a.error || b.error) { if (a.error !== b.error) anota({ ruta: n, clase: "tipo", base: a.error || "ok", nuevo: b.error || "ok" }); continue; }
    if (a.t !== b.t) {
      /* Texto: se muestra el primer renglón que cambió (sólo informa; no cuenta como número). */
      const la = a.t.split(/\n/), lb = b.t.split(/\n/);
      let k = 0; while (k < la.length && k < lb.length && la[k] === lb[k]) k++;
      let h = 0; while (h < la.length - k && h < lb.length - k && la[la.length - 1 - h] === lb[lb.length - 1 - h]) h++;
      anota({ ruta: `${n}:texto`, clase: "texto", base: la.slice(k, la.length - h).join(" / ").slice(0, 400) || "(nada)", nuevo: lb.slice(k, lb.length - h).join(" / ").slice(0, 400) || "(nada)" });
    }
    const x = a.nums, y = b.nums;
    /* Prefijo y sufijo comunes; lo del medio se alinea por la subsecuencia común más larga. */
    let p = 0; while (p < x.length && p < y.length && x[p].v === y[p].v) p++;
    let q = 0; while (q < x.length - p && q < y.length - p && x[x.length - 1 - q].v === y[y.length - 1 - q].v) q++;
    comparadas += p + q;
    const X = x.slice(p, x.length - q), Y = y.slice(p, y.length - q);
    if (!X.length && !Y.length) continue;
    if (X.length * Y.length > 4e6) { anota({ ruta: `${n}#${p}`, clase: "numerica", base: `${X.length} número(s) desde «${ctx(a, X[0] ? X[0].i : 0)}»`, nuevo: `${Y.length} número(s)` }); continue; }
    const L = Array.from({ length: X.length + 1 }, () => new Int32Array(Y.length + 1));
    for (let i = X.length - 1; i >= 0; i--) for (let j = Y.length - 1; j >= 0; j--) L[i][j] = X[i].v === Y[j].v ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, dels = [], inss = [];
    const vacia = () => {
      const k = Math.min(dels.length, inss.length);
      for (let z = 0; z < k; z++) anota({ ruta: `${n}#${p + dels[z]}`, clase: "numerica", base: `${X[dels[z]].v} ‹${ctx(a, X[dels[z]].i)}›`, nuevo: `${Y[inss[z]].v} ‹${ctx(b, Y[inss[z]].i)}›` });
      for (let z = k; z < dels.length; z++) anota({ ruta: `${n}#${p + dels[z]}`, clase: "solo-base", base: `${X[dels[z]].v} ‹${ctx(a, X[dels[z]].i)}›` });
      for (let z = k; z < inss.length; z++) anota({ ruta: `${n}#${p + inss[z]}`, clase: "solo-nuevo", nuevo: `${Y[inss[z]].v} ‹${ctx(b, Y[inss[z]].i)}›` });
      dels = []; inss = [];
    };
    while (i < X.length || j < Y.length) {
      if (i < X.length && j < Y.length && X[i].v === Y[j].v) { vacia(); comparadas++; i++; j++; }
      else if (j >= Y.length || (i < X.length && L[i + 1][j] >= L[i][j + 1])) { dels.push(i); i++; }
      else { inss.push(j); j++; }
    }
    vacia();
  }
  return { comparadas, cuenta, difs };
}

/* ---------------------------------------------------------------------------
   Un escenario completo: dos modos.
     nativo   : cada archivo construye el escenario con sus propios valores de arranque.
     guardado : el archivo BASE guarda el proyecto (projSave) y los DOS lo abren (projOpen),
                que es lo que le pasa a un usuario al actualizar la suite.
   ------------------------------------------------------------------------ */
async function correrEnVentana(file, esc, opts, guardadoTexto, guardar) {
  const w = await cargar(file, opts);
  let saved = null, errorGuardar = null, tiene = true;
  try {
    const c = { w, G: (e) => w.eval(e), S: () => w.eval("S") };
    if (guardadoTexto) {
      const key = w.eval("STORE_KEY");
      w.localStorage.setItem(key, guardadoTexto);
      const id = JSON.parse(guardadoTexto)[0].id;
      w.eval(`projOpen(${JSON.stringify(id)})`);
    } else {
      /* Escenario que sólo existe en la versión nueva: si esta ventana no tiene la función que
         exige, corre la variante sin ella (buildBase), que es lo que la base habría hecho. */
      tiene = !esc.requiere || w.eval(`typeof ${esc.requiere}`) !== "undefined";
      (tiene ? esc.build : (esc.buildBase || esc.build))(c);
    }
    const R = recolectar(w);
    /* El aplanado se hace ANTES de cerrar la ventana: después ya no hay que tocarla. */
    const A = aplanarR(R, w.__tokens, opts.revs);
    const meta = { fallos: R._fallos, erroresVentana: R._errores, cobertura: R._cobertura };
    if (guardar) {
      try { w.eval("projSave(true)"); saved = w.localStorage.getItem(w.eval("STORE_KEY")); }
      catch (e) { errorGuardar = "projSave: " + e.message; }
    }
    const X = opts.xlsx ? recolectarXlsx(w) : null;
    const PDF = opts.pdf ? recolectarPdf(w, opts.revs) : null;
    return { A, X, PDF, meta, saved, errorGuardar, tiene };
  } catch (e) {
    return { error: (e && e.stack) || String(e) };
  } finally { try { w.close(); } catch { /* ya cerrada */ } }
}
function aplanarR(R, tokens, revs) {
  const out = {}, hits = { n: 0 };
  const rev = revs && revs.length ? revs : (typeof R._rev === "string" && R._rev ? [R._rev] : []);
  for (const m of Object.keys(R)) {
    if (m.startsWith("_")) continue;
    const salida = aplanarBloque(R[m].salida, tokens, rev, hits);
    const estado = R[m].estado === undefined ? new Map() : aplanarBloque(R[m].estado, tokens, rev, hits);
    const cotizacion = R[m].cotizacion === undefined ? new Map() : aplanarBloque(R[m].cotizacion, tokens, rev, hits);
    out[m] = { salida, estado, cotizacion };
  }
  Object.defineProperty(out, "__hits", { value: hits.n, enumerable: false });
  Object.defineProperty(out, "__rev", { value: rev, enumerable: false });
  return out;
}
/* Quita del mapa las hojas que valen NO_EXISTE (función ausente en esa versión) y
   devuelve la lista de claves que faltan, para no contarlas como diferencia. */
function purgaNoExiste(mapa) {
  const raices = [];
  for (const [k, v] of mapa) if (v === NO_EXISTE) raices.push(k);
  return raices;
}
function quitarRaiz(mapa, p) {
  for (const k of [...mapa.keys()]) {
    if (p === "" || k === p || (k.startsWith(p) && /^[.\[{]/.test(k.slice(p.length)))) mapa.delete(k);
  }
}
function compararR(Ab, An, motorBase) {
  const filas = {};
  for (const m of Object.keys(Ab)) {
    const fila = {};
    for (const parte of ["salida", "estado", "cotizacion"]) {
      const A = Ab[m][parte], B = An[m] ? An[m][parte] : new Map();
      const nbA = purgaNoExiste(A), nbB = purgaNoExiste(B);
      const noComp = [...new Set([...nbA, ...nbB])];
      /* Si una raíz falta en una sola versión, se saca también de la otra. */
      noComp.forEach((k) => { quitarRaiz(A, k); quitarRaiz(B, k); });
      const r = compararMapas(A, B);
      r.noComparable = noComp;
      fila[parte] = r;
    }
    filas[m] = fila;
  }
  return filas;
}

const primeraLinea = (t) => String(t || "").split(/\r?\n/)[0];
async function procesarEscenario(id, base, nuevo, opts) {
  const e = ESCENARIOS.find((x) => x.id === id);
  const res = { id, titulo: e.titulo, modos: {}, errores: [], requiere: null };
  const revDe = (f) => { const m = /const REV = "([^"]+)"/.exec(leerHtml(f, !!opts.conCss)); return m ? m[1] : null; };
  const optsV = { xlsx: opts.xlsx, pdf: opts.pdf, conCss: opts.conCss, revs: [...new Set([revDe(base), revDe(nuevo)].filter(Boolean))] };
  const modo = async (nombreModo, textoGuardado, guardarBase) => {
    const rb = await correrEnVentana(base, e, optsV, textoGuardado, guardarBase);
    /* rev 2.9.15 · La nueva también guarda (y su guardado se descarta): el Excel y los PDF se leen
       después de guardar, y guardar sólo en una de las dos daba textos distintos (proyecto abierto o no). */
    const rn = await correrEnVentana(nuevo, e, optsV, textoGuardado, guardarBase);
    if (rb.error || rn.error) {
      res.modos[nombreModo] = { errorBase: rb.error || null, errorNuevo: rn.error || null };
      if (!!rb.error !== !!rn.error) res.errores.push(`${nombreModo}: falla sólo en ${rb.error ? "la BASE" : "la versión NUEVA"}: ${primeraLinea(rb.error || rn.error)}`);
      else res.errores.push(`${nombreModo}: falla en las dos: ${primeraLinea(rb.error)}`);
      return { rb, rn };
    }
    const filas = compararR(rb.A, rn.A);
    const xl = { es: null, en: null };
    if (opts.xlsx) for (const k of ["es", "en"]) xl[k] = compararXlsx(rb.X[k], rn.X[k]);
    const pdf = opts.pdf ? compararPdf(rb.PDF, rn.PDF) : null;
    res.modos[nombreModo] = { filas, xlsx: xl, pdf, fallosBase: rb.meta.fallos, fallosNuevo: rn.meta.fallos, erroresVentanaBase: rb.meta.erroresVentana, erroresVentanaNuevo: rn.meta.erroresVentana,
      errorGuardar: rb.errorGuardar, cobertura: rb.meta.cobertura, coberturaNuevo: rn.meta.cobertura,
      rev: { revs: rb.A.__rev, hitsBase: rb.A.__hits, hitsNuevo: rn.A.__hits } };
    return { rb, rn };
  };
  const nat = await modo("nativo", null, !!opts.guardado);
  if (e.requiere) res.requiere = { nombre: e.requiere, enBase: !!(nat.rb && nat.rb.tiene), enNuevo: !!(nat.rn && nat.rn.tiene) };
  if (opts.guardado) {
    if (nat.rb && nat.rb.saved && !nat.rb.error) {
      const gua = await modo("guardado", nat.rb.saved, false);
      const ok = [nat.rb, nat.rn, gua.rb, gua.rn].every((x) => x && !x.error);
      if (ok) res.rt = { base: idaYVuelta(nat.rb.A, gua.rb.A), nuevo: idaYVuelta(nat.rn.A, gua.rn.A) };
      if (res.rt) {
        const pb = new Set(res.rt.base.paths);
        res.rt.soloNuevo = res.rt.nuevo.paths.filter((p) => !pb.has(p));
        const pn = new Set(res.rt.nuevo.paths);
        res.rt.soloBase = res.rt.base.paths.filter((p) => !pn.has(p));
      }
    } else res.errores.push("guardado: la base no pudo guardar el proyecto (projSave)");
  }
  return res;
}
/* Ida y vuelta: el MISMO archivo, construyendo el escenario (nativo) contra abriendo el proyecto
   que él mismo guardó. Sólo salida y cotización (el «estado» lleva id de proyecto y sellos). Sirve
   para probar que el modo «guardado» de verdad cargó el proyecto y que guardar/abrir no mueve un
   número: si los dos abrieran un proyecto vacío, todo «empataría» por no haber nada. */
function idaYVuelta(A1, A2) {
  const paths = [];
  for (const m of Object.keys(A1)) {
    for (const parte of ["salida", "cotizacion"]) {
      const a = new Map(A1[m][parte]), b = new Map(A2[m][parte]);
      const r = compararMapas(a, b);
      /* Se recorre el resultado completo, no las 400 diferencias guardadas: por eso se cuenta aparte. */
      r.difs.forEach((d) => { if (d.clase !== "texto") paths.push(`${m}.${parte}.${patronRuta(d.ruta)}`); });
      if (sumaCuenta(r.cuenta) > r.difs.length) paths.push(`${m}.${parte}.<<+${sumaCuenta(r.cuenta) - r.difs.length} más>>`);
    }
  }
  return { num: paths.length, paths: [...new Set(paths)] };
}

/* ---------------------------------------------------------------------------
   Comparación de código: funciones y constantes de nivel superior, sin
   comentarios y con espacios colapsados.
   ------------------------------------------------------------------------ */
function extraerScript(html) {
  const i = html.indexOf("<script>"), j = html.lastIndexOf("</script>");
  return html.slice(i + 8, j);
}
function sentencias(js) {
  const out = []; const n = js.length; let i = 0, depth = 0, buf = [], cod = [], ini = true, esFuncion = false, ultimo = "", ultimaPalabra = "";
  const nombreDe = (t) => {
    let m = /^(?:async\s+)?function\s*\*?\s*([\w$]+)/.exec(t); if (m) return "function " + m[1];
    m = /^(?:const|let|var)\s+([\w$]+)/.exec(t); if (m) return "const " + m[1];
    m = /^class\s+([\w$]+)/.exec(t); if (m) return "class " + m[1];
    return null;
  };
  const cierra = () => {
    const t = buf.join("").replace(/\s+/g, " ").trim();
    if (t) out.push({ nombre: nombreDe(t), texto: t, codigo: cod.join("").replace(/\s+/g, " ").trim() });
    buf = []; cod = []; ini = true; esFuncion = false; ultimo = ""; ultimaPalabra = "";
  };
  const salta = (q) => { // cadena con comilla q
    let j = i + 1; while (j < n && js[j] !== q) { if (js[j] === "\\") j++; j++; }
    return j + 1;
  };
  const saltaPlantilla = () => {
    let j = i + 1;
    while (j < n && js[j] !== "`") {
      if (js[j] === "\\") { j += 2; continue; }
      if (js[j] === "$" && js[j + 1] === "{") {
        let d = 1; j += 2;
        while (j < n && d > 0) {
          const ch = js[j];
          if (ch === "{") d++; else if (ch === "}") d--;
          else if (ch === '"' || ch === "'") { let k = j + 1; while (k < n && js[k] !== ch) { if (js[k] === "\\") k++; k++; } j = k; }
          else if (ch === "`") { const salvo = i; i = j; j = saltaPlantilla(); i = salvo; j -= 1; }
          j++;
        }
        continue;
      }
      j++;
    }
    return j + 1;
  };
  while (i < n) {
    const ch = js[i], nx = js[i + 1];
    if (/\s/.test(ch)) { if (buf.length && !/\s$/.test(buf[buf.length - 1])) { buf.push(" "); cod.push(" "); } i++; continue; }
    if (ch === "/" && nx === "/") { while (i < n && js[i] !== "\n") i++; continue; }
    if (ch === "/" && nx === "*") { i = js.indexOf("*/", i + 2) + 2; if (i < 2) break; continue; }
    if (ini) { ini = false; esFuncion = /^(async\s+function|function|class)\b/.test(js.slice(i, i + 16)); }
    if (ch === '"' || ch === "'") { const j = salta(ch); buf.push(js.slice(i, j)); cod.push('""'); i = j; ultimo = ch; ultimaPalabra = ""; continue; }
    if (ch === "`") { const j = saltaPlantilla(); const tr = js.slice(i, j); buf.push(tr); cod.push('`' + (tr.match(/\$\{[^{}]*\}/g) || []).join(" ") + '`'); i = j; ultimo = "`"; ultimaPalabra = ""; continue; }
    if (ch === "/") {
      const regexOk = ultimo === "" || /[(,=:\[!&|?{};+\-*%<>~^]/.test(ultimo) || /^(return|typeof|case|in|of|delete|void|throw|new)$/.test(ultimaPalabra);
      if (regexOk) {
        let j = i + 1, clase = false;
        while (j < n && (clase || js[j] !== "/") && js[j] !== "\n") { if (js[j] === "\\") j++; else if (js[j] === "[") clase = true; else if (js[j] === "]") clase = false; j++; }
        j++; while (/[a-z]/.test(js[j] || "")) j++;
        buf.push(js.slice(i, j)); cod.push("/r/"); i = j; ultimo = "/"; ultimaPalabra = ""; continue;
      }
    }
    if (/[\w$]/.test(ch)) { let j = i; while (j < n && /[\w$]/.test(js[j])) j++; ultimaPalabra = js.slice(i, j); buf.push(ultimaPalabra); cod.push(ultimaPalabra); i = j; ultimo = "a"; continue; }
    buf.push(ch); cod.push(ch); ultimo = ch; ultimaPalabra = "";
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      if (depth === 0 && ch === "}" && esFuncion) { i++; cierra(); continue; }
    } else if (ch === ";" && depth === 0) { i++; cierra(); continue; }
    i++;
  }
  cierra();
  return out;
}
function mapaSentencias(js) {
  /* Clave estable: «function X» / «const X»; las sentencias sin nombre (listeners, llamadas
     sueltas) se identifican por su texto inicial, no por su posición, para que añadir o
     quitar una no desalinee a todas las demás. */
  const m = new Map(), cods = new Map(); const cont = new Map();
  sentencias(js).forEach((s) => {
    const base = s.nombre || `<expr ${s.texto.slice(0, 70)}>`;
    const k = cont.has(base) ? `${base}#${cont.get(base) + 1}` : base; cont.set(base, (cont.get(base) || 0) + 1);
    m.set(k, s.texto); cods.set(k, s.codigo);
  });
  m.codigo = cods;
  return m;
}
const tokensDe = (t) => t.match(/\w+|\s+|[^\w\s]/g) || [];
/* Diferencias por tramos entre dos textos: recorte de prefijo y sufijo comunes por token y
   LCS por programación dinámica en lo que queda. Devuelve [{base, nuevo}] con contexto. */
function tramosDiferencia(a, b, maxTramos = 6) {
  const ta = tokensDe(a), tb = tokensDe(b);
  let i = 0; while (i < ta.length && i < tb.length && ta[i] === tb[i]) i++;
  let ja = ta.length, jb = tb.length; while (ja > i && jb > i && ta[ja - 1] === tb[jb - 1]) { ja--; jb--; }
  const A = ta.slice(i, ja), B = tb.slice(i, jb);
  const ctx = (arr, x, y) => arr.slice(Math.max(0, x - 12), x).join("") + "«" + arr.slice(x, y).join("") + "»" + arr.slice(y, y + 12).join("");
  if (A.length * B.length > 16e6) return [{ base: ctx(ta, i, ja).slice(0, 400), nuevo: ctx(tb, i, jb).slice(0, 400) }];
  const n = A.length, m = B.length, W = m + 1;
  const L = new Uint16Array((n + 1) * W);
  for (let x = n - 1; x >= 0; x--) for (let y = m - 1; y >= 0; y--) L[x * W + y] = A[x] === B[y] ? L[(x + 1) * W + y + 1] + 1 : Math.max(L[(x + 1) * W + y], L[x * W + y + 1]);
  const tramos = []; let x = 0, y = 0, sx = -1, sy = -1;
  const cierra = () => { if (sx >= 0) { tramos.push({ base: ctx(ta, i + sx, i + x).slice(0, 400), nuevo: ctx(tb, i + sy, i + y).slice(0, 400) }); sx = -1; } };
  while (x < n || y < m) {
    if (x < n && y < m && A[x] === B[y]) { cierra(); x++; y++; continue; }
    if (sx < 0) { sx = x; sy = y; }
    if (y < m && (x >= n || L[x * W + y + 1] >= L[(x + 1) * W + y])) y++; else x++;
  }
  cierra();
  return tramos.slice(0, maxTramos);
}
function compararCodigo(base, nuevo) {
  const A = mapaSentencias(extraerScript(fs.readFileSync(base, "utf8")));
  const B = mapaSentencias(extraerScript(fs.readFileSync(nuevo, "utf8")));
  const cambiadas = [], quitadas = [], nuevas = [];
  for (const [k, t] of A) { if (!B.has(k)) quitadas.push(k); else if (B.get(k) !== t) cambiadas.push({ nombre: k, tramos: tramosDiferencia(t, B.get(k)), largoBase: t.length, largoNuevo: B.get(k).length }); }
  for (const k of B.keys()) if (!A.has(k)) nuevas.push(k);
  /* Lo quitado: ¿alguien más lo usaba? Se busca su nombre, como palabra, en el resto del
     código de la BASE (sin comentarios) y en el código NUEVO. REV_NOTA es prosa, no código. */
  const refs = (mapa, nombre, propio) => {
    const id = nombre.replace(/^(function|const|class) /, "").replace(/#\d+$/, "");
    if (!/^[\w$]+$/.test(id)) return null;
    const re = new RegExp("(?<![A-Za-z0-9_$])" + id.replace(/[$]/g, "[$]") + "(?![A-Za-z0-9_$])");
    const dnd = [];
    for (const [k] of mapa) if (k !== propio && k !== "const REV_NOTA" && re.test(mapa.codigo.get(k))) dnd.push(k);
    return dnd;
  };
  const huerfanos = quitadas.filter((k) => /^(function|const|class) /.test(k)).map((k) => ({ nombre: k, enBase: refs(A, k, k), enNuevo: refs(B, k, null) }));
  return { total: { base: A.size, nuevo: B.size }, cambiadas, quitadas, nuevas, huerfanos };
}

/* ---------------------------------------------------------------------------
   Informe
   ------------------------------------------------------------------------ */
const FILAS = [...MOTORES, "valid", "xlsx-es", "xlsx-en", "pdf", "semaforo"];
const INFO = new Set(["semaforo"]);
const NOMBRE_FILA = { estr: "estr (externo)", valid: "valid (cruzada)", "xlsx-es": "xlsx propuesta es", "xlsx-en": "xlsx propuesta en", pdf: "pdf (números)", semaforo: "semáforo (info)" };
const fmt = (v) => (typeof v === "string" ? JSON.stringify(v.length > 110 ? v.slice(0, 107) + "…" : v) : typeof v === "number" ? (Object.is(v, -0) ? "-0" : String(v)) : String(v));
function patronRuta(r) { return r.replace(/\[\d+\]/g, "[*]").replace(/\{\d+\}/g, "{*}"); }
function celdaDe(res, modoNombre, fila, opts) {
  /* Devuelve {sim, num, txt, comp, difs[], partes{}} de un (escenario, modo, fila). */
  const md = res.modos[modoNombre];
  if (!md) return { sim: " ", num: 0, txt: 0, comp: 0, difs: [], cuenta: {} };
  if (md.errorBase || md.errorNuevo) return { sim: "E", num: 1, txt: 0, comp: 0, difs: [{ ruta: "<<ejecución>>", clase: "tipo", base: md.errorBase ? "error" : "ok", nuevo: md.errorNuevo ? "error" : "ok" }], cuenta: {} };
  if (fila === "estr") {
    const f = md.filas.estr; const d = f.salida.difs;
    const ok = d.length === 0 && f.salida.comparadas > 0;
    return { sim: ok ? "-" : "X", num: ok ? 0 : d.length, txt: 0, comp: f.salida.comparadas, difs: d.map((x) => ({ ...x, ruta: "salida." + x.ruta })), cuenta: f.salida.cuenta, noAplica: true };
  }
  if (fila === "xlsx-es" || fila === "xlsx-en") {
    const x = md.xlsx && md.xlsx[fila.slice(5)];
    if (!x) return { sim: " ", num: 0, txt: 0, comp: 0, difs: [], cuenta: {} };
    if (x.noComparable) return { sim: "?", num: 0, txt: 0, comp: 0, difs: [], cuenta: x.cuenta };
    const c = x.cuenta; const n = c.numerica + c["cero-con-signo"] + c.tipo + c["solo-base"] + c["solo-nuevo"] + c.formula;
    return { sim: n ? "X" : (c.reubicado ? "r" : "="), num: n, txt: 0, reub: c.reubicado, comp: x.comparadas, difs: x.difs, cuenta: c };
  }
  if (fila === "pdf") {
    const x = md.pdf;
    if (!x) return { sim: " ", num: 0, txt: 0, comp: 0, difs: [], cuenta: {} };
    const c = x.cuenta; const n = c.numerica + c["solo-base"] + c["solo-nuevo"] + c.tipo;
    return { sim: n ? "X" : (c.texto ? "t" : "="), num: n, txt: c.texto, comp: x.comparadas, difs: x.difs, cuenta: c };
  }
  const f = md.filas[fila]; if (!f) return { sim: " ", num: 0, txt: 0, comp: 0, difs: [], cuenta: {} };
  let num = 0, txt = 0, comp = 0; const difs = []; const cuenta = {};
  for (const parte of ["salida", "estado", "cotizacion"]) {
    const r = f[parte]; comp += r.comparadas;
    num += cuentaNum(r.cuenta); txt += r.cuenta.texto;
    r.difs.forEach((d) => difs.push({ ...d, ruta: `${parte}.${d.ruta}` }));
    for (const [k, v] of Object.entries(r.cuenta)) cuenta[k] = (cuenta[k] || 0) + v;
  }
  let sim = "=";
  if (num) sim = "X"; else if (txt) sim = "t";
  if (INFO.has(fila) && sim !== "=") sim = "i";
  return { sim, num, txt, comp, difs, cuenta };
}

function imprimirInforme(resultados, opts, tiempo) {
  const out = []; const P = (s = "") => out.push(s);
  const modos = ["nativo", ...(opts.guardado ? ["guardado"] : [])];
  P("=".repeat(100));
  P(`COMPARADOR DE ESTADOS DE LOS 15 MOTORES · ${resultados.length} escenarios · modos: ${modos.join(" + ")} · ${(tiempo / 1000).toFixed(1)} s`);
  P(`  base : ${opts.base}`); P(`  nuevo: ${opts.nuevo}`);
  P("  igualdad exacta (Object.is en números), cero tolerancia");
  P("=".repeat(100));
  let tNumSN = 0, tTxtSN = 0, tNum = 0, tTxt = 0, tReub = 0, tCeldas = 0, tHojas = 0;
  const totalFilas = {}; FILAS.forEach((f) => { totalFilas[f] = { num: 0, txt: 0, comp: 0 }; });
  const familias = new Map(); // (fila|patron|clase) -> {n, ej, escen:Set}
  const detalle = [];
  for (const modo of modos) {
    P(""); P(`--- Resumen «motor x escenario» · modo ${modo} ---   (= iguales   X difieren   t sólo texto   - no aplica   r reubicado   i informativo   ? no comparable   E error)`);
    const ancho = 3;
    const cab = resultados.map((_, i) => String(i + 1).padStart(ancho)).join("");
    P(`${"".padEnd(20)}${cab}   iguales/difieren`);
    for (const fila of FILAS) {
      let linea = (NOMBRE_FILA[fila] || fila).padEnd(20), ig = 0, di = 0;
      for (const r of resultados) {
        const c = celdaDe(r, modo, fila, opts);
        linea += c.sim.padStart(ancho);
        if (c.sim === "=" || c.sim === "-" || c.sim === "r") ig++; else if (c.sim === "X" || c.sim === "E" || c.sim === "t") di++;
        {
          totalFilas[fila].num += c.num; totalFilas[fila].txt += c.txt; totalFilas[fila].comp += c.comp;
          if (!INFO.has(fila)) { tNum += c.num; tTxt += c.txt; if (r.requiere) { tNumSN += c.num; tTxtSN += c.txt; } tReub += c.reub || 0; tCeldas += c.comp; }
          if (c.num || c.txt || (c.reub)) {
            (c.difs || []).forEach((d) => {
              const k = `${fila}|${modo}|${patronRuta(d.ruta)}|${d.clase}`;
              if (!familias.has(k)) familias.set(k, { n: 0, ej: d, escen: new Set(), fila, modo });
              const f = familias.get(k); f.n++; f.escen.add(r.id);
            });
            detalle.push({ id: r.id, modo, fila, c });
          }
        }
      }
      linea += `   ${String(ig).padStart(2)}/${di}`;
      P(linea);
    }
  }
  P(""); P("Escenarios (número de columna):");
  resultados.forEach((r, i) => P(`  ${String(i + 1).padStart(2)}  ${r.id.padEnd(28)} ${r.titulo}${r.requiere ? "  [SOLO EN LA NUEVA]" : ""}`));
  /* Cobertura: lo que cada escenario efectivamente calcula (valores de la BASE). */
  P(""); P("COBERTURA · lo que cada escenario calcula de verdad (valores de la BASE; si fueran todos cero el escenario «empataría» sin probar nada)");
  const cols = [["arq", "arq", 8], ["tons", "TR", 7], ["zonas", "zon", 4], ["segs", "tram", 5], ["cfm", "vent cfm", 9], ["ffu", "FFU", 5], ["kVA", "kVA", 7], ["hidroLs", "L/s", 6], ["rociad", "roc", 5], ["hpAire", "HP", 4], ["directo", "directo MXN", 13], ["partidas", "part", 5], ["civil", "civil", 10], ["soporte", "soporte", 9], ["kzOps", "kz", 3], ["vzProps", "vz", 3], ["tec", "tecnología por zona", 26]];
  P(`  ${"#".padStart(2)} ${"escenario".padEnd(28)}${cols.map(([, t, w]) => t.padStart(w)).join(" ")}`);
  resultados.forEach((r, i) => {
    const cv = r.modos.nativo && r.modos.nativo.cobertura;
    if (!cv || cv.__error) { P(`  ${String(i + 1).padStart(2)} ${r.id.padEnd(28)}(sin datos de cobertura)`); return; }
    P(`  ${String(i + 1).padStart(2)} ${r.id.padEnd(28)}${cols.map(([k, , w]) => String(cv[k] === undefined || cv[k] === null ? "-" : typeof cv[k] === "number" ? cv[k].toLocaleString("es-MX", { maximumFractionDigits: 2 }) : cv[k]).padStart(w)).join(" ")}`);
  });
  /* Ida y vuelta */
  let tRT = 0;
  if (opts.guardado) {
    P(""); P("IDA Y VUELTA · el mismo archivo, escenario construido (nativo) contra proyecto guardado y abierto (guardado): salida y cotización");
    P(`  ${"escenario".padEnd(28)}${"base".padStart(7)}${"nuevo".padStart(7)}${"sólo nuevo".padStart(12)}  (diferencias numéricas/estructurales entre construir y reabrir)`);
    resultados.forEach((r) => {
      if (!r.rt) return;
      tRT += r.rt.soloNuevo.length;
      P(`  ${r.id.padEnd(28)}${String(r.rt.base.num).padStart(7)}${String(r.rt.nuevo.num).padStart(7)}${String(r.rt.soloNuevo.length).padStart(12)}${r.rt.soloNuevo.length ? "  <- " + r.rt.soloNuevo.slice(0, 3).join(" ; ") : ""}`);
    });
    const rtBaseTot = resultados.reduce((a, r) => a + (r.rt ? r.rt.base.num : 0), 0), rtNuevoTot = resultados.reduce((a, r) => a + (r.rt ? r.rt.nuevo.num : 0), 0);
    P(`  totales: base ${rtBaseTot}, nuevo ${rtNuevoTot}, sólo en nuevo ${tRT}. (Una diferencia que existe igual en las dos versiones es propia del escenario —p. ej. la memoria de la casa vive en localStorage, no en el proyecto—; sólo cuenta lo que aparece SOLO en la nueva.)`);
  }
  /* Errores de ejecución */
  const errs = resultados.filter((r) => r.errores.length);
  if (errs.length) { P(""); P("ERRORES DE EJECUCIÓN:"); errs.forEach((r) => r.errores.forEach((e) => P(`  [${r.id}] ${e}`))); }
  const av = resultados.filter((r) => Object.values(r.modos).some((m) => (m.fallosBase && m.fallosBase.length) || (m.fallosNuevo && m.fallosNuevo.length) || (m.erroresVentanaBase && m.erroresVentanaBase.length) || (m.erroresVentanaNuevo && m.erroresVentanaNuevo.length)));
  if (av.length) {
    P(""); P("AVISOS (excepciones capturadas dentro de la ventana; no son diferencias):");
    av.forEach((r) => Object.entries(r.modos).forEach(([mn, m]) => {
      [["base", m.fallosBase], ["nuevo", m.fallosNuevo], ["base(ventana)", m.erroresVentanaBase], ["nuevo(ventana)", m.erroresVentanaNuevo]].forEach(([q, l]) => (l || []).slice(0, 3).forEach((e) => P(`  [${r.id}/${mn}/${q}] ${String(e).slice(0, 200)}`)));
    }));
  }
  /* Diferencias agrupadas por familia de ruta */
  if (familias.size) {
    P(""); P("=".repeat(100)); P("DIFERENCIAS AGRUPADAS por (fila, modo, ruta con índices [*], clase) · con un ejemplo por grupo"); P("=".repeat(100));
    /* Primero lo numérico/estructural, luego el texto, al final lo informativo; dentro, por frecuencia. */
    const peso = (f) => (INFO.has(f.fila) ? 2 : f.ej.clase === "texto" ? 1 : 0);
    const orden = [...familias.values()].sort((a, b) => (peso(a) - peso(b)) || b.n - a.n);
    orden.slice(0, opts.maxFamilias).forEach((f) => {
      const d = f.ej;
      P(`* [${f.fila}/${f.modo}] ${patronRuta(d.ruta)}  (${d.clase}) · ${f.n} apariciones en ${f.escen.size} escenario(s)`);
      P(`    ej. ${d.ruta}`);
      if (d.clase === "solo-base") P(`        base : ${fmt(d.base)}   nuevo: (no existe)`);
      else if (d.clase === "solo-nuevo") P(`        base : (no existe)   nuevo: ${fmt(d.nuevo)}`);
      else P(`        base : ${fmt(d.base)}   nuevo: ${fmt(d.nuevo)}`);
    });
    if (orden.length > opts.maxFamilias) P(`  … y ${orden.length - opts.maxFamilias} grupos más (usa --max-familias=N o --json)`);
    P("");
    P("Detalle por escenario y motor (las primeras diferencias de cada celda):");
    detalle.filter((d) => !INFO.has(d.fila)).slice(0, opts.maxCeldas).forEach((d) => {
      P(`  [${d.id}/${d.modo}] ${d.fila}: ${d.c.num} numéricas/estructurales, ${d.c.txt} de texto, ${d.c.comp} hojas comparadas`);
      d.c.difs.filter((x) => x.clase !== "texto" || opts.verTexto).slice(0, opts.max).forEach((x) => {
        P(`      ${x.ruta}  (${x.clase})`);
        P(`          base : ${x.clase === "solo-nuevo" ? "(no existe)" : fmt(x.base)}`);
        P(`          nuevo: ${x.clase === "solo-base" ? "(no existe)" : fmt(x.nuevo)}`);
      });
    });
  }
  P(""); P("=".repeat(100));
  P("TOTALES POR FILA (todos los escenarios y modos)");
  P(`${"fila".padEnd(20)}${"num/estruct".padStart(14)}${"texto".padStart(10)}${"hojas comparadas".padStart(20)}`);
  FILAS.forEach((f) => P(`${(NOMBRE_FILA[f] || f).padEnd(20)}${String(totalFilas[f].num).padStart(14)}${String(totalFilas[f].txt).padStart(10)}${totalFilas[f].comp.toLocaleString("es-MX").padStart(20)}`));
  P("");
  P(`hojas numéricas/textuales comparadas: ${tCeldas.toLocaleString("es-MX")}`);
  /* Estructural es externo (StructCalc, archivo aparte): debe seguir declarado así en las dos versiones. */
  const cv0 = resultados.find((r) => r.modos.nativo && r.modos.nativo.cobertura && r.modos.nativo.coberturaNuevo);
  if (cv0) {
    const gb = cv0.modos.nativo.cobertura.estr, gn = cv0.modos.nativo.coberturaNuevo.estr, ok = gb === "externo" && gn === "externo";
    P(`estr (StructCalc, archivo aparte): grupo declarado «${gb}» en la base y «${gn}» en la nueva -> ${ok ? "no aplica" : "¡CAMBIÓ o no está declarado externo!"}`);
    if (!ok) tNum++;
  }
  P(`DIFERENCIAS NUMÉRICAS O ESTRUCTURALES (base contra nuevo): ${tNum}`);
  P(`diferencias de ida y vuelta (guardar/abrir) que sólo aparecen en la nueva: ${tRT}`);
  tNum += tRT;
  P(`diferencias sólo de texto           : ${tTxt}${opts.ignorarTexto ? "  (no cuentan: --ignorar-texto)" : ""}`);
  P(`celdas de Excel reubicadas (maquetación, no numéricas): ${tReub}`);
  const infoDifs = totalFilas.semaforo.num + totalFilas.semaforo.txt;
  P(`diferencias INFORMATIVAS del semáforo de completitud (texto de estado, no numéricas, no cuentan): ${infoDifs}${infoDifs ? "  <- ver el renglón «semáforo (info)» de las tablas: cambió qué disciplinas dicen «Con datos» / «Sin datos»" : ""}`);
  const rv = resultados.map((r) => r.modos.nativo && r.modos.nativo.rev).filter(Boolean);
  if (rv.length) P(`marcas de revisión normalizadas dentro de textos («${rv[0].revs.join("» y «")}» -> «<REV>»): base ${rv.reduce((a, x) => a + x.hitsBase, 0)}, nuevo ${rv.reduce((a, x) => a + x.hitsNuevo, 0)} (sólo modo nativo; no son diferencias)`);
  const sn = resultados.filter((r) => r.requiere);
  if (sn.length) {
    P(""); P("ESCENARIOS QUE SÓLO EXISTEN EN LA VERSIÓN NUEVA (usan una función que la base no tiene; la base corre la variante sin ella)");
    sn.forEach((r) => {
      const dif = (m) => { let n = 0, t = 0; FILAS.filter((f) => !INFO.has(f)).forEach((f) => { const c = celdaDe(r, m, f, opts); n += c.num; t += c.txt; }); return [n, t]; };
      const [n1, t1] = dif("nativo"); const [n2, t2] = opts.guardado ? dif("guardado") : [0, 0];
      const estado = !r.requiere.enNuevo ? "la función tampoco existe en la nueva: no se ejercita" : r.requiere.enBase ? "la función existe en las dos" : `«${r.requiere.nombre}» sólo en la nueva`;
      P(`  ${r.id.padEnd(26)} ${estado} · numéricas/estructurales nativo ${n1} guardado ${n2} · texto ${t1 + t2}`);
    });
    P(`  diferencias numéricas/estructurales en estos escenarios: ${tNumSN} (ya incluidas en el total de arriba) · de texto: ${tTxtSN}`);
  }
  const soloUno = errs.some((r) => r.errores.some((e) => /falla sólo en/.test(e)));
  const enDos = errs.some((r) => r.errores.some((e) => /falla en las dos|no pudo guardar/.test(e)));
  let codigo = 0;
  if (tNum > 0 || soloUno) codigo = 1;
  else if (enDos) codigo = 3;
  else if (tTxt > 0 && !opts.ignorarTexto) codigo = 2;
  P(codigo === 0 ? "RESULTADO: CERO DIFERENCIAS." : codigo === 1 ? "RESULTADO: HAY DIFERENCIAS NUMÉRICAS O ESTRUCTURALES." : codigo === 2 ? "RESULTADO: cero diferencias numéricas; sólo cambió texto." : "RESULTADO: error de ejecución.");
  return { texto: out.join("\n"), codigo, tNum, tTxt };
}

function imprimirCodigo(cd, filtro) {
  const out = []; const P = (s = "") => out.push(s);
  const re = new RegExp(filtro, "i");
  const corto = (k) => (k.length > 90 ? k.slice(0, 87) + "…" : k);
  P("=".repeat(100)); P("COMPARACIÓN DE CÓDIGO (sin comentarios ni espacios · sentencias de primer nivel)"); P("=".repeat(100));
  P(`sentencias: base ${cd.total.base}, nuevo ${cd.total.nuevo} · cambiadas ${cd.cambiadas.length} · añadidas ${cd.nuevas.length} · quitadas ${cd.quitadas.length}`);
  const motor = cd.cambiadas.filter((x) => re.test(x.nombre)), otras = cd.cambiadas.filter((x) => !re.test(x.nombre));
  P(""); P(`CAMBIADAS que casan con /${filtro.length > 60 ? filtro.slice(0, 57) + "…" : filtro}/i (cálculo y catálogos): ${motor.length}`);
  motor.forEach((x) => {
    P(`* ${x.nombre}   (${x.largoBase} -> ${x.largoNuevo} caracteres · ${x.tramos.length} tramo(s))`);
    x.tramos.forEach((t, i) => { P(`    [${i + 1}] base : ${t.base}`); P(`        nuevo: ${t.nuevo}`); });
  });
  P(""); P(`Otras sentencias cambiadas (interfaz, PDF, textos…): ${otras.length}`);
  P("  " + otras.map((x) => corto(x.nombre)).join(", "));
  P(""); P(`AÑADIDAS (${cd.nuevas.length}): ` + cd.nuevas.map(corto).join(", "));
  P(""); P(`QUITADAS (${cd.quitadas.length}): ` + cd.quitadas.map(corto).join(", "));
  P(""); P("Lo QUITADO con nombre, ¿lo usaba otra sentencia? (búsqueda por palabra en el código sin comentarios)");
  cd.huerfanos.forEach((h) => {
    const usa = (h.enBase || []).filter((k) => !cd.quitadas.includes(k));
    P(`  ${h.nombre.padEnd(34)} ${!usa.length && !(h.enNuevo || []).length ? "sin referencias: código muerto, quitarlo no mueve nada" : `REFERENCIADO por [base] ${usa.map(corto).join(", ") || "—"}  [nuevo] ${(h.enNuevo || []).map(corto).join(", ") || "—"}`}`);
  });
  return out.join("\n");
}

/* ---------------------------------------------------------------------------
   Orquestación
   ------------------------------------------------------------------------ */
function parseArgs(argv) {
  const o = { pos: [], escenarios: null, guardado: true, xlsx: true, pdf: true, hilos: Math.max(1, Math.min(4, os.cpus().length - 1)), max: 5, maxFamilias: 60, maxCeldas: 40,
    json: null, ignorarTexto: false, codigo: null, soloCodigo: false, autoprueba: false, lista: false, conCss: false, verTexto: false };
  for (const a of argv) {
    if (!a.startsWith("--")) { o.pos.push(a); continue; }
    const [k, v] = a.slice(2).split(/=(.*)/s);
    switch (k) {
      case "escenarios": o.escenarios = v.split(","); break;
      case "sin-guardado": o.guardado = false; break;
      case "sin-xlsx": o.xlsx = false; break;
      case "sin-pdf": o.pdf = false; break;
      case "hilos": o.hilos = Math.max(1, +v || 1); break;
      case "max": o.max = +v; break;
      case "max-familias": o.maxFamilias = +v; break;
      case "json": o.json = v; break;
      case "ignorar-texto": o.ignorarTexto = true; break;
      case "ver-texto": o.verTexto = true; break;
      case "con-css": o.conCss = true; break;
      case "codigo": o.codigo = v || "^(function (compute|calc|build|size|sel|peak|valid|kaizen|catalogo|cotizacion|listPrice|hunter|hazen|sincronizar|geoProyecto|totals|zoneKey|loadOf|recompute|ffu|psy|dbAt|matById|spaceOf|precio|costo|semaforo|prop|estado|veEstado|despiece|selConductor|demandaDe|muebleDe|veDecidir|seguro|linkAllowed|num|defaultZone|defaultSegment|defaultElec|defaultHidro|defaultFuego|defaultAire|defaultCivil|defaultSoporte|defaultCarga|defaultConsumo|defaultRoom|defaultTramo|sanearEstado|reemplazarEstado|vaciarEstado|limpiarCaches)|const (QUOTE_SEED|PRICE_SEED|PLAZAS|BASES_PRECIO|SITES|LINKS|TIPO_CARGA|MUEBLES|SPACES|ISO_CLASSES|FITTINGS|TUB_|DOTACION|RIESGO|ROCIADOR|COMPRESORES|SECADORES|SEC_ORDEN|DISCIPLINAS|PROPUESTAS|HEREDA|P\\b|SHGC|LIGHT|OA_|FFU|CARRIER|FAMILIES|PU_SOP))"; break;
      case "solo-codigo": o.soloCodigo = true; if (!o.codigo) o.codigo = ".*"; break;
      case "autoprueba": o.autoprueba = true; break;
      case "lista": o.lista = true; break;
      default: console.error(`Opción desconocida: --${k}`); process.exit(3);
    }
  }
  return o;
}
function elegir(ids) {
  if (!ids) return ESCENARIOS.map((e) => e.id);
  const sel = [];
  ids.forEach((p) => { const m = ESCENARIOS.filter((e) => e.id === p || e.id.startsWith(p)); if (!m.length) { console.error(`Escenario desconocido: ${p}`); process.exit(3); } m.forEach((e) => { if (!sel.includes(e.id)) sel.push(e.id); }); });
  return sel;
}
async function correrTodo(base, nuevo, ids, opts) {
  const resultados = new Array(ids.length);
  if (opts.hilos <= 1) {
    for (let i = 0; i < ids.length; i++) { resultados[i] = await procesarEscenario(ids[i], base, nuevo, opts); process.stderr.write(`\r  ${i + 1}/${ids.length} ${ids[i].padEnd(30)}`); }
    process.stderr.write("\n"); return resultados;
  }
  return await new Promise((resolve, reject) => {
    let sig = 0, hechos = 0; const ws = [];
    const dar = (wk) => { if (sig < ids.length) { const i = sig++; wk.__i = i; wk.postMessage({ i, id: ids[i] }); } else { wk.terminate(); } };
    for (let h = 0; h < Math.min(opts.hilos, ids.length); h++) {
      const wk = new Worker(fileURLToPath(import.meta.url), { workerData: { base, nuevo, opts } });
      wk.on("message", (m) => {
        if (m.error) { reject(new Error(m.error)); return; }
        resultados[m.i] = m.r; hechos++; process.stderr.write(`\r  ${hechos}/${ids.length} ${m.r.id.padEnd(30)}`);
        if (hechos === ids.length) { process.stderr.write("\n"); ws.forEach((x) => x.terminate()); resolve(resultados); } else dar(wk);
      });
      wk.on("error", reject);
      ws.push(wk); dar(wk);
    }
  });
}
async function autoprueba(nuevo, opts) {
  console.log("AUTOPRUEBA 1/2 · el archivo nuevo contra sí mismo (debe dar CERO diferencias)");
  const o1 = { ...opts, escenarios: ["vacio", "prueba", "lleno", "sys-", "peakScan", "cotiz-USD", "vent-kitchen", "propuestas-aceptadas", "valor-decisiones"], max: 3 };
  const t0 = Date.now();
  const r1 = await correrTodo(nuevo, nuevo, elegir(o1.escenarios), o1);
  const i1 = imprimirInforme(r1, { ...o1, base: nuevo, nuevo }, Date.now() - t0);
  const ok1 = i1.tNum === 0 && i1.tTxt === 0;
  console.log(i1.texto.split("\n").slice(-6).join("\n"));
  console.log(ok1 ? "  -> autoprueba 1 CORRECTA: sin diferencias contra sí mismo.\n" : "  -> autoprueba 1 FALLA: el comparador ve diferencias donde no las hay (no determinista).\n");
  console.log("AUTOPRUEBA 2/2 · copia del nuevo con UN precio movido (ductKg 165 -> 166) y un coeficiente de accesorio (0.28 -> 0.29): debe DETECTARLO");
  let html = fs.readFileSync(nuevo, "utf8");
  const cuenta = (re) => (html.match(re) || []).length;
  const a = cuenta(/ductKg: 165,/g), b = cuenta(/elbow_90_rect", "Codo 90° rectangular con álabes", \.28\]/g);
  html = html.replace("ductKg: 165,", "ductKg: 166,").replace('["elbow_90_rect", "Codo 90° rectangular con álabes", .28]', '["elbow_90_rect", "Codo 90° rectangular con álabes", .29]');
  const tmp = path.join(os.tmpdir(), `comparar15-mutada-${process.pid}.html`);
  fs.writeFileSync(tmp, html);
  const o2 = { ...opts, escenarios: ["lleno", "ductos-accesorios"], max: 2 };
  const r2 = await correrTodo(nuevo, tmp, elegir(o2.escenarios), o2);
  const i2 = imprimirInforme(r2, { ...o2, base: nuevo, nuevo: tmp }, 0);
  fs.unlinkSync(tmp);
  /* rev 2.9.15 · El precio movido también tiene que verse en los números de los PDF. */
  const pdfN = !opts.pdf ? -1 : r2.reduce((acc, r) => acc + ["nativo", "guardado"].reduce((x, m) => x + (r.modos && r.modos[m] ? celdaDe(r, m, "pdf", o2).num : 0), 0), 0);
  if (opts.pdf) console.log(`  PDF: ${pdfN} número(s) distinto(s) detectado(s) en los PDF de la copia mutada`);
  const ok2 = i2.tNum > 0 && a === 1 && b === 1 && (pdfN !== 0);
  console.log(i2.texto.split("\n").filter((l) => /^\*|RESULTADO|DIFERENCIAS NUM/.test(l)).slice(0, 14).join("\n"));
  console.log(ok2 ? "  -> autoprueba 2 CORRECTA: el comparador detecta el precio y el coeficiente movidos.\n" : `  -> autoprueba 2 FALLA (ocurrencias sustituidas ${a}/${b}, diferencias vistas ${i2.tNum}).\n`);
  console.log("AUTOPRUEBA 3/3 · cero tolerancia: iva 0.16 -> 0.16000000000000003 (un solo ulp) en una copia; debe DETECTARLO");
  let html3 = fs.readFileSync(nuevo, "utf8");
  const c3 = (html3.match(/  iva: 0\.16,/g) || []).length;
  html3 = html3.replace("  iva: 0.16,", "  iva: 0.16000000000000003,");
  const tmp3 = path.join(os.tmpdir(), `comparar15-ulp-${process.pid}.html`);
  fs.writeFileSync(tmp3, html3);
  const o3 = { ...opts, escenarios: ["lleno"], max: 2 };
  const r3 = await correrTodo(nuevo, tmp3, elegir(o3.escenarios), o3);
  const i3 = imprimirInforme(r3, { ...o3, base: nuevo, nuevo: tmp3 }, 0);
  fs.unlinkSync(tmp3);
  const ok3 = i3.tNum > 0 && c3 === 1;
  console.log(i3.texto.split("\n").filter((l) => /^\*|RESULTADO|DIFERENCIAS NUM/.test(l)).slice(0, 8).join("\n"));
  console.log(ok3 ? "  -> autoprueba 3 CORRECTA: detecta una diferencia de un solo ulp.\n" : `  -> autoprueba 3 FALLA (ocurrencias ${c3}, diferencias vistas ${i3.tNum}).\n`);
  return ok1 && ok2 && ok3 ? 0 : 1;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.lista) { ESCENARIOS.forEach((e, i) => console.log(`${String(i + 1).padStart(2)}  ${e.id.padEnd(28)} ${e.titulo}`)); return 0; }
  const [base, nuevo] = opts.pos;
  if (opts.autoprueba) { if (!nuevo && !base) { console.error("uso: node comparar15.mjs --autoprueba <nuevo.html>"); return 3; } return await autoprueba(nuevo || base, opts); }
  if (!base || !nuevo || !fs.existsSync(base) || !fs.existsSync(nuevo)) { console.error("uso: node comparar15.mjs <base.html> <nuevo.html> [opciones]  (ver LEEME.md)"); return 3; }
  let codigoTxt = null;
  if (opts.codigo) codigoTxt = imprimirCodigo(compararCodigo(base, nuevo), opts.codigo);
  if (opts.soloCodigo) { console.log(codigoTxt); return 0; }
  const t0 = Date.now();
  const res = await correrTodo(base, nuevo, elegir(opts.escenarios), opts);
  const inf = imprimirInforme(res, { ...opts, base, nuevo }, Date.now() - t0);
  console.log(inf.texto);
  if (codigoTxt) console.log("\n" + codigoTxt);
  if (opts.json) fs.writeFileSync(opts.json, JSON.stringify({ base, nuevo, resultados: res }, (k, v) => (typeof v === "number" && !Number.isFinite(v) ? String(v) : v)));
  return inf.codigo;
}

const ESPRINCIPAL = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (isMainThread) {
  if (ESPRINCIPAL) main().then((c) => { process.exitCode = c; }).catch((e) => { console.error(e); process.exitCode = 3; });
} else {
  parentPort.on("message", async ({ i, id }) => {
    try { const r = await procesarEscenario(id, workerData.base, workerData.nuevo, workerData.opts); parentPort.postMessage({ i, r }); }
    catch (e) { parentPort.postMessage({ i, error: (e && e.stack) || String(e) }); }
  });
}
/* Para reutilizar desde otros scripts de diagnóstico. */
export { cargar, ESCENARIOS, recolectar, aplanarBloque, aplanarR, compararMapas, xlsxCeldas, recolectarXlsx, NO_EXISTE };
