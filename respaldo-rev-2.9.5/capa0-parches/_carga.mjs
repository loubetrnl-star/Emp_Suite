// Cargador compartido para los casos numéricos de la Capa 0.
// Mismo arranque que pruebas.mjs. Uso en un caso:
//   import { cargar, proyectoBase } from "./_carga.mjs";
//   const w = await cargar(process.argv[2]);   // ruta del HTML a medir
//   const G = (e) => w.eval(e);
// Cada caso imprime UNA línea JSON al final: {"caso":"x.y","valor":...,"detalle":...}
import { JSDOM } from "jsdom";
import fs from "node:fs";

export async function cargar(f) {
  const html = fs.readFileSync(f, "utf8").replace(/@font-face\{[^}]*\}/g, "");
  const capturas = [];
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "https://emp.local/",
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.requestAnimationFrame = (fn) => setTimeout(fn, 0);
      w.cancelAnimationFrame = (t) => clearTimeout(t);
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      /* Los documentos (PDF/XLSX/ZIP) salen por Blob + createObjectURL: se guardan aquí
         para que un caso pueda leer lo que la suite entregaría al cliente. */
      w.URL.createObjectURL = (b) => { capturas.push(b); return "blob:x" + capturas.length; };
      w.URL.revokeObjectURL = () => {};
      Object.defineProperty(w.navigator, "serviceWorker", { value: { register: () => Promise.resolve({}), addEventListener() {} } });
      w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.Blob = Blob;
      w.CSS = { escape: (s) => String(s).replace(/([^\w-])/g, "\\$1") };
      w.__errs = []; w.addEventListener("error", (e) => w.__errs.push(e.message));
    },
  });
  await new Promise((r) => setTimeout(r, 250));
  dom.window.__capturas = capturas;
  return dom.window;
}

/* Proyecto de referencia de la auditoría: 2 zonas, todos los cruces autorizados. */
export function proyectoBase(w) {
  const G = (e) => w.eval(e);
  const S = G("S");
  S.meta.name = "Caso Capa 0"; S.meta.client = "Prueba";
  S.zones = [
    { ...G("defaultZone")("Producción"), area: 400, height: 6, occ: 30 },
    { ...G("defaultZone")("Oficinas"), area: 100, height: 3, occ: 10 },
  ];
  S.zi = 0;
  Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "caso" }; });
  G("recompute")();
  return S;
}

export function imprime(obj) { console.log(JSON.stringify(obj)); }
