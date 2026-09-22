// Caso 2.2 · Carga dinámica total hidráulica con la altura contada dos veces.
// Uso: node casos/2.2.mjs <archivo.html>
// Entradas explícitas = valores por omisión de defaultHidro():
//   presRed 25 m · alturaEdificio 6 m · presResidual 15 m · cobre · uso público
//   tramos AF-GENERAL (um 72, L 25 m, alt 3 m) y AF-RAMAL BAÑOS (um 20, L 18 m, alt 3 m)
//   muebles: 4 wc_flux, 2 ming_flux, 4 lavabo, 1 fregadero, 2 manguera · industria, 60 hab, 1 día
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);

S.hidro = {
  uso: "publico", material: "cobre",
  muebles: [
    { id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 },
    { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 },
  ],
  presRed: 25,
  tramos: [
    { id: "hA", tag: "AF-GENERAL", servicio: "fria", um: 72, L: 25, alt: 3, tipoUM: "auto" },
    { id: "hB", tag: "AF-RAMAL BAÑOS", servicio: "fria", um: 20, L: 18, alt: 3, tipoUM: "auto" },
  ],
  pendiente: 2, calentador: "paso", tempEntrada: 18, tempSalida: 45,
  dot: "industria", habitantes: 60, diasReserva: 1,
  alturaEdificio: 6, presResidual: 15,
};
G("recompute")();
const R = G("HIDRO");
const r = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

const friccion = R.tramos.reduce((a, t) => a + t.hf, 0);
const altTramos = R.tramos.reduce((a, t) => a + t.alt, 0);

/* Lo que la suite entrega: PDF de memoria hidrosanitaria (texto sin comprimir). */
const pdf = Buffer.from(G("buildHidroPdf")()).toString("latin1");
const pdfCdt = (pdf.match(/\(Carga dinamica total\) Tj ET\s*BT[^(]*\(([^)]*)\)/) || [])[1] || null;
const pdfBomba = (pdf.match(/\(([0-9.,]+ L\/s a [^)]*HP nominales)\)/) || [])[1] || null;

/* Preselección del hidroneumático y partida de cotización. */
const P = G("preseleccionHidroneumatico")(R.Qtotal, R.cdt, true);
const Q = G("QUOTE");
const partida = (Q.aux || []).find((a) => a.mot === "hidro" && /bombeo/.test(a.desc)) || null;

imprime({
  caso: "2.2",
  valor: r(R.cdt, 2),
  detalle: {
    Qtotal_Ls: r(R.Qtotal, 4),
    tramos: R.tramos.map((t) => ({ tag: t.tag, hf_friccion: r(t.hf, 4), alt: t.alt, perdida: r(t.perdida, 4) })),
    friccion_total_m: r(friccion, 4),
    altura_tramos_m: altTramos,
    hfTotal_m: r(R.hfTotal, 4),
    alturaEdificio_m: 6, presResidual_m: 15,
    cdt_m: r(R.cdt, 4),
    cdt_sin_doble_altura_m: r(6 + friccion + 15, 4),
    altura_contada_en_cdt_m: r(R.cdt - friccion - 15, 4),
    presDisp_m: r(R.presDisp, 4),
    kWbomba: r(R.kWbomba, 4), hpBomba: R.hpBomba,
    pdf_carga_dinamica: pdfCdt, pdf_bomba: pdfBomba,
    preseleccion_bar: r(P.barNec, 3), preseleccion_kWeje: r(P.kWeje, 3),
    cotizacion_partida: partida ? { desc: partida.desc, total: r(partida.total, 2) } : null,
    QUOTE_tot: Q ? r(Q.tot, 2) : null,
  },
});
