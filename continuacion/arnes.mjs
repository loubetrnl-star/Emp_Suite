// Arnés de sólo lectura para experimentos: carga una copia de index.html en jsdom exactamente como pruebas.mjs, sin correr
// el banco (carga en ~3 s). Uso desde un script propio (en x15/, ignorado por git):
//   import { cargar } from "<repo>/continuacion/arnes.mjs";
//   const w = await cargar();                  // index.html del repositorio; o cargar("/ruta/a/otra/copia.html")
//   const G = (e) => w.eval(e); const S = G("S");   // estado y funciones globales de la app; errores en w.__errs
import { JSDOM } from "jsdom";
import fs from "node:fs";
export async function cargar(f = new URL("../index.html", import.meta.url)) {
  const html = fs.readFileSync(f, "utf8").replace(/@font-face\{[^}]*\}/g, "");
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
    },
  });
  await new Promise((r) => setTimeout(r, 250));
  return dom.window;
}
