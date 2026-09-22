// Caso 3.1 · Hoja CUMPLIMIENTO_URS con veredictos fijos.
// Uso: node casos/3.1.mjs <ruta-html>
// Arma dos cuartos limpios y un sistema contra incendio con aviso de error,
// genera el libro de propuesta en español (el mismo que entrega la suite) y lee
// de las hojas CUMPLIMIENTO_URS y DESGLOSE_AREAS lo que se imprime al cliente.
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);

/* Entradas explícitas del caso */
S.clean = {
  ci: 0,
  rooms: [
    // ISO 5 con 20 cambios/h fijados a mano: muy por debajo del rango de su clase (240–480).
    { ...G("defaultRoom")("Sala A"), iso: "iso5", level: "med", achSet: 20, area: 40, height: 3, dp: 15, crackLen: 6, oaFrac: 0.1, occ: 2, procW: 25 },
    // ISO 7 al mínimo de su rango (30), sin fijar cambios de aire.
    { ...G("defaultRoom")("Sala B"), iso: "iso7", level: "min", achSet: 0, area: 60, height: 2.7, dp: 12.5, crackLen: 6, oaFrac: 0.1, occ: 4, procW: 25 },
  ],
};
// Contra incendio alimentado por red municipal con 5 m de columna: el motor emite un aviso de error.
S.fuego = { ...G("defaultFuego")(), fuente: "municipal", presFuente: 5 };
G("recompute")();

const bytes = G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" });
const txt = Buffer.from(bytes).toString("utf8");

/* Cada hoja es un XML sin comprimir (STORE) dentro del ZIP: se separan por <worksheet ...</worksheet>. */
const hojas = [...txt.matchAll(/<worksheet[\s\S]*?<\/worksheet>/g)].map((m) => m[0]);
const des = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const filas = (xml) => [...xml.matchAll(/<row\b[\s\S]*?<\/row>/g)].map((r) =>
  [...r[0].matchAll(/<c\b[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => {
    const m = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(c[1] || "");
    if (m) return des(m[1]);
    const v = /<v>([\s\S]*?)<\/v>/.exec(c[1] || "");
    return v ? v[1] : "";
  }));
const urs = hojas.find((h) => h.includes("CUMPLIMIENTO DE URS"));
const area = hojas.find((h) => h.includes("AREAS CLASIFICADAS"));
if (!urs) throw new Error("no se encontró la hoja CUMPLIMIENTO_URS");

const fUrs = filas(urs).filter((f) => /^\d+$/.test(f[0] || "") && f.length >= 7);
const renglon = (f) => `${f[2]} | ${f[3]} | ${f[4]} | ${f[5]}`;
const clasif = fUrs.filter((f) => /^Clasificacion del cuarto/.test(f[2])).map(renglon);
const cascada = fUrs.filter((f) => /^Cascada de presion/.test(f[2])).map(renglon);
const nfpa = fUrs.filter((f) => /^Densidad de descarga/.test(f[2])).map(renglon);
const desglose = area ? filas(area).filter((f) => f[0] === "Sala A" || f[0] === "Sala B").map((f) => `${f[0]} | ${f[1]}`) : [];

const sem = G("semaforoSuite")();
const R = G("CLEAN").list;
imprime({
  caso: "3.1",
  valor: { clasificacion: clasif, cascada, nfpa13: nfpa, desglose_areas_clase: desglose },
  detalle: {
    entradas: S.clean.rooms.map((c) => ({ name: c.name, iso: c.iso, level: c.level, achSet: c.achSet, area: c.area, height: c.height, dp: c.dp })),
    motor_cuartos: R.map((r) => ({ name: r.name, clase: r.cls.label, ach: r.ach, rangoClase: r.cls.ach, dP: r.dP, achMin_en_resultado: r.achMin === undefined ? "no existe" : r.achMin })),
    fuego: { fuente: S.fuego.fuente, presFuente: S.fuego.presFuente, alcanza: G("FUEGO").alcanza, mcaTotal: +G("FUEGO").mcaTotal.toFixed(1),
      errores: G("FUEGO").avisos.filter((a) => a.lvl === "err").length, semaforo: (sem.find((s) => s.id === "fuego") || {}).nivel },
    todos_los_veredictos: fUrs.map((f) => `${f[0]}. ${f[1]} | ${f[2]} | ${f[5]}`),
    errores_js: w.__errs,
  },
});
process.exit(0);
