// Caso 3.3 · Metros hidráulicos inventados en la cotización.
// Uso: node casos/3.3.mjs <html>
// Proyecto base de la auditoría (2 zonas, todos los cruces autorizados) con la
// hidrosanitaria por omisión (4 WC fluxómetro, 2 mingitorios, 4 lavabos,
// 1 fregadero, 2 mangueras => 72 UM > 0) pero SIN tramos de agua capturados.
// Se mide el renglón de red hidráulica que computeQuote manda al catálogo y lo
// que de ese renglón llega a lo que se entrega al cliente:
//   - libro de propuesta (buildPropuestaXlsx, español/MXN)
//   - PDF de propuesta (buildPropuestaPdf, español/MXN)
// Sub-caso de control: los tramos por omisión (L = 25 m y 18 m => 43 m capturados).
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);
const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
// Texto del PDF: une los fragmentos (...) Tj para que un renglón partido se lea seguido.
const textoPdf = (b) => (dec(b).match(/\((?:\\.|[^\\)])*\) Tj/g) || []).map((s) => s.slice(1, -4)).join(" ");

function medir(tramos) {
  S.hidro = { ...G("defaultHidro")(), tramos };
  G("recompute")();
  const H = G("HIDRO"), Q = G("QUOTE");
  const lin = Q.aux.find((a) => a.mot === "hidro" && a.un === "ML");
  const x = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
  const pdf = textoPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
  const frasePdf = (pdf.match(/\(\d+ m [^)]*\)/g) || []).filter((s) => /tramo|supuest|captur/i.test(s));
  return {
    umTotal: H.umTotal, nTramos: H.tramos.length,
    sumaLtramos: H.tramos.reduce((a, t) => a + t.L, 0),
    desc: lin ? lin.desc : null, qty: lin ? lin.qty : null, unit: lin ? lin.unit : null, total: lin ? lin.total : null,
    dicenTramosCalculados: lin ? /de los tramos calculados/.test(lin.desc) : false,
    declaraSupuesto: lin ? /supuest/i.test(lin.desc) : false,
    libroXlsxTraeElRenglon: lin ? x.includes(lin.desc.replace(/&/g, "&amp;")) : false,
    libroXlsxDiceTramosCalculados: /m de los tramos calculados/.test(x),
    pdfPropuestaFrase: frasePdf,
    pdfPropuestaDiceTramosCalculados: /tramos calculados/.test(pdf),
    quoteTot: Q.tot,
  };
}

const sinTramos = medir([]);
// Segunda forma de caer en el supuesto: tramos capturados pero con longitud 0 m.
const tramosEnCero = medir([
  { ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 0, alt: 3 },
  { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 0, alt: 3 },
]);
const conTramos = medir([
  { ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 },
  { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 },
]);

imprime({
  caso: "3.3",
  valor: sinTramos.desc,
  detalle: { sinTramos, tramosEnCero, controlConTramos: conTramos, errores: w.__errs },
});
