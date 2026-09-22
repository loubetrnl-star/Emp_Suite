// Caso 1.1 · Licitación con 0 % de indirectos y utilidad.
// Uso: node casos/1.1.mjs <ruta del html>
// Mide:
//  (a) estructuraSobrecosto(1,000,000) con el estado por omisión (sin capturas): importe integrado.
//  (b) El PDF de licitación que la suite entrega al pulsar el botón (proyecto de referencia):
//      % de indirectos y de utilidad impresos en "Integración del sobrecosto".
//  (c) Si la tarjeta de licitación en Cotización ofrece campo editable para esos dos %.
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);

// (a) Estado por omisión, directo explícito de $1,000,000
const CD = 1000000;
const E = G("estructuraSobrecosto")(CD);
const r2 = (x) => Math.round(x * 100) / 100;

// (b) Documento entregado
const S = proyectoBase(w);
S.tab = "cotizacion";
G("render")();
const btn = w.document.querySelector('[data-act="pdf-licitacion"]');
const antes = w.__capturas.length;
let pdf = "";
if (btn) {
  // jsdom no navega: el <a download> de deliverPdf se neutraliza; el Blob ya quedó capturado.
  w.HTMLAnchorElement.prototype.click = function () {};
  btn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  const blob = w.__capturas[antes];
  if (blob) pdf = Buffer.from(await blob.arrayBuffer()).toString("latin1");
}
// Texto de las celdas en orden de dibujo
const celdas = [...pdf.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1"));
const fila = (etq, n) => { const i = celdas.findIndex((c) => c.startsWith(etq)); return i < 0 ? null : celdas.slice(i, i + n); };
const filaInd = fila("Costo indirecto", 4);
const filaUti = fila("Cargo por utilidad", 4);
const iTot = celdas.findIndex((c) => c.startsWith("IMPORTE DE LA PROPUESTA"));
const filaTot = iTot < 0 ? null : [celdas[iTot], celdas.slice(iTot + 1).find((c) => /^[\d,.]+$/.test(c)) || null];
const iCd = celdas.findIndex((c) => c.startsWith("Costo directo del catalogo"));
const pdfCd = iCd < 0 ? null : celdas.slice(iCd + 1).find((c) => /^[\d,.]+$/.test(c)) || null;

// (c) Campos editables en la tarjeta de licitación
const html = w.document.body.innerHTML;
const campoInd = (html.match(/data-path="quote\.indirectPct"/g) || []).length;
const campoUti = (html.match(/data-path="quote\.profitPct"/g) || []).length;

imprime({
  caso: "1.1",
  valor: r2(E.pu),
  detalle: {
    entrada: "estructuraSobrecosto(1000000) con estado por omisión",
    i_pct: r2(E.i * 100), fin_pct: r2(E.fin * 100), u_pct: r2(E.u * 100), ca_pct: r2(E.ca * 100),
    ci: r2(E.ci), cf: r2(E.cf), cu: r2(E.cu), cca: r2(E.cca),
    quote_indirectPct: S.quote.indirectPct === undefined ? "undefined" : S.quote.indirectPct,
    quote_profitPct: S.quote.profitPct === undefined ? "undefined" : S.quote.profitPct,
    quote_indirect: S.quote.indirect, quote_utility: S.quote.utility,
    pdf_generado: pdf.length > 0,
    pdf_fila_indirecto: filaInd, pdf_fila_utilidad: filaUti, pdf_costo_directo: pdfCd, pdf_importe: filaTot,
    campos_tarjeta_licitacion: { indirectPct: campoInd, profitPct: campoUti },
    errores: w.__errs,
  },
});
process.exit(0);
