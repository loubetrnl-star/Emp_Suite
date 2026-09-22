// Caso 3.4 · Kaizen propone 15 cambios/h a un cuarto limpio sin leer su clase ISO.
// Uso: node casos/3.4.mjs <html>
// Proyecto base (2 zonas, enlaces autorizados) + cinco cuartos limpios de 120 m² × 3 m, 24 h:
//   "Limpio ISO 5" iso5 · 360 cambios/h (mínimo declarado de la clase en ISO_CLASSES: 240)
//   "Limpio ISO 6" iso6 · 135 cambios/h (mínimo declarado: 90)
//   "Limpio ISO 7" iso7 ·  45 cambios/h (mínimo declarado: 30)
//   "Limpio ISO 8" iso8 ·  25 cambios/h (mínimo declarado: 10; ayuda/combos: "muchos URS piden ≥ 15")
//   "Limpio ISO 8 alto" iso8 · 40 cambios/h (arriba del máximo 25: aquí se ve si ISO 8 baja a 15 o a 10)
// valor = por cada cuarto: a cuántos cambios/h lleva la propuesta de Kaizen (null si no propone),
//         si el texto cita una clase distinta de la de la zona, y si esa propuesta queda por
//         debajo del mínimo que la propia suite declara para la clase.
// La lectura del número propuesto no depende de la redacción exacta: toma "Bajar a N" del
// cambio y, si no está, el primer número tras "contra" en el estado actual.
// También se extrae la hoja INGENIERIA_VALOR del libro en español (mismo método que pruebas.mjs:
// el xlsx es un ZIP STORE y su texto se lee directo).
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);
const dz = G("defaultZone");
const limpio = (nombre, iso, ach) => ({ ...dz(nombre), spaceType: "cleanroom", iso, achClean: ach,
  area: 120, height: 3, occ: 2, lights: 720, equip: 2400, ach: 0.05, runHours: 24 });
S.zones.push(
  limpio("Limpio ISO 5", "iso5", 360),
  limpio("Limpio ISO 6", "iso6", 135),
  limpio("Limpio ISO 7", "iso7", 45),
  limpio("Limpio ISO 8", "iso8", 25),
  limpio("Limpio ISO 8 alto", "iso8", 40));
S.tab = "valor";
G("KZ_CACHE").key = null; G("VZ_CACHE").key = null;
G("recompute")();

const K = G("KAIZEN"), V = G("VALOR");
const CL = G("ISO_CLASSES"), simZone = G("simZone"), LOADS = G("LOADS");
const mov = K.ops.filter((o) => o.muda === "mov");

const bytes = G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" });
const txt = Buffer.from(bytes).toString("utf8");
const ini = txt.indexOf("INGENIERIA DE VALOR — MEDIDAS DETECTADAS");
const hoja = ini >= 0 ? txt.slice(ini, ini + 200000) : "";

const propuestoDe = (op) => {
  const a = /Bajar a (\d+(?:\.\d+)?)/.exec(op.cambio || "");
  if (a) return +a[1];
  const b = /contra\D*?(\d+(?:\.\d+)?)/.exec(op.ahora || "");
  return b ? +b[1] : null;
};

const valor = {}, detalle = {};
S.zones.forEach((z, i) => {
  if (z.spaceType !== "cleanroom") return;
  const cls = CL[z.iso] || CL.iso8;
  const minCls = cls.ach[0];
  const op = mov.find((o) => o.zona === z.name);
  const propone = op ? propuestoDe(op) : null;
  const clasesCitadas = op ? [...`${op.ahora} ${op.cambio}`.matchAll(/ISO\s*(\d)\b/g)].map((m) => "iso" + m[1]) : [];
  valor[z.name] = op ? {
    propone,
    bajoMinimoClase: propone != null && propone < minCls,
    citaOtraClase: clasesCitadas.some((c) => c !== z.iso),
  } : null;
  const r = LOADS[i];
  detalle[z.name] = {
    iso: z.iso, achClean: z.achClean, minimoClase: minCls, rangoClase: cls.ach,
    ahora: op ? op.ahora : null, cambio: op ? op.cambio : null,
    tr_actual: +r.tons.toFixed(3),
    ahorroTR_a15: +(r.tons - simZone(z, { achClean: 15 }).tons).toFixed(3),
    ahorroTR_aMinClase: +(r.tons - simZone(z, { achClean: minCls }).tons).toFixed(3),
    kaizen_tr: op ? +op.tr.toFixed(3) : null,
    enHojaXlsx: op ? hoja.indexOf(op.ahora.replace(/</g, "&lt;")) >= 0 : false,
  };
});
detalle.textoISO8enHoja = (hoja.match(/que pide el URS para ISO 8/g) || []).length;
detalle.propsValorKaizenMov = V.props.filter((p) => p.medida === "kaizen:mov").length;
detalle.errores = w.__errs;
imprime({ caso: "3.4", valor, detalle });
process.exit(0);
