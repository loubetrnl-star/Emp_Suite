// Caso 1.3 · Excel de la propuesta sin financiamiento.
// Uso: node casos/1.3.mjs <html>
// Arma el proyecto base, fija los porcentajes de la cotización con financiamiento
// del 3 %, genera el libro ES/MXN tal como lo entregaría la suite, EVALÚA las
// fórmulas de la hoja RESUMEN_EJECUTIVO (subtotal, IVA, total) y las compara con
// QUOTE (lo que muestra la pantalla "Del costo al precio"). Revisa también el PDF
// de propuesta (ES y EN) buscando el renglón de financiamiento.
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);

/* Entradas explícitas de la cotización (fracciones del costo directo). */
Object.assign(S.quote, { currency: "MXN", indirect: 0.18, utility: 0.12, freight: 0.025, bond: 0.015, financing: 0.03, iva: 0.16 });
G("recompute")();
const Q = G("QUOTE");

/* ---------- lector del libro (ZIP en STORE, igual que leerXlsx de pruebas.mjs) ---------- */
function leerLibro(bytes) {
  const txt = Buffer.from(bytes).toString("utf8");
  const wb = txt.slice(txt.indexOf("<sheets>"), txt.indexOf("</sheets>") + 9);
  const nombres = [...wb.matchAll(/<sheet name="([^"]+)"/g)].map((m) => m[1]);
  const hojas = {};
  /* Cada hoja es un <worksheet>...</worksheet> en el orden de sheet1..sheetN. */
  const cuerpos = [...txt.matchAll(/<worksheet[\s\S]*?<\/worksheet>/g)].map((m) => m[0]);
  nombres.forEach((nom, i) => {
    const celdas = {};
    const x = cuerpos[i] || "";
    for (const m of x.matchAll(/<c r="([A-Z]+\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cont = m[2] || "";
      const f = cont.match(/<f>([\s\S]*?)<\/f>/), v = cont.match(/<v>([\s\S]*?)<\/v>/), s = cont.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      const des = (z) => z.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
      celdas[m[1]] = f ? { f: des(f[1]) } : v ? { v: +v[1] } : s ? { s: des(s[1]) } : {};
    }
    hojas[nom] = celdas;
  });
  return { nombres, hojas };
}

/* ---------- evaluador mínimo de fórmulas (+ - * / SUM IF =, refs y rangos entre hojas) ---------- */
function evaluador(libro) {
  const memo = {};
  const col = (c) => c.split("").reduce((a, ch) => a * 26 + ch.charCodeAt(0) - 64, 0);
  const letra = (n) => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
  function val(hoja, ref) {
    const k = hoja + "!" + ref;
    if (k in memo) return memo[k];
    const c = (libro.hojas[hoja] || {})[ref];
    let r = 0;
    if (c && "v" in c) r = c.v;
    else if (c && c.f) r = ev(hoja, c.f);
    return (memo[k] = r);
  }
  function ev(hoja, f) {
    /* Un solo paso sobre la fórmula original: rangos, referencias y el resto tal cual. */
    const tok = /SUM\(\s*(?:([A-Z_]+)!)?\$?([A-Z]{1,2})\$?(\d+):\$?([A-Z]{1,2})\$?(\d+)\s*\)|(?:([A-Z_]+)!)?\$?\b([A-Z]{1,2})\$?(\d+)\b|\bIF\(|(<>|<=|>=|=)/g;
    let js = f.replace(tok, (m, h, c1, r1, c2, r2, h2, c, r, op) => {
      if (c1) {
        const hh = h || hoja; const out = [];
        for (let cc = col(c1); cc <= col(c2); cc++) for (let rr = +r1; rr <= +r2; rr++) out.push(`__v(${JSON.stringify(hh)},"${letra(cc)}${rr}")`);
        return "(" + (out.join("+") || "0") + ")";
      }
      if (c) return `__v(${JSON.stringify(h2 || hoja)},"${c}${r}")`;
      if (op) return op === "=" ? "==" : op === "<>" ? "!=" : op;
      return "__if(";
    });
    // eslint-disable-next-line no-new-func
    return Function("__v", "__if", `return (${js});`)(val, (a, b, c) => (a ? b : c));
  }
  return val;
}

const libro = leerLibro(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" }));
const val = evaluador(libro);
const RES = libro.hojas.RESUMEN_EJECUTIVO;
const fila = (pref) => Object.entries(RES).find(([r, c]) => r[0] === "B" && c.s && c.s.startsWith(pref));
const monto = (pref) => { const f = fila(pref); return f ? val("RESUMEN_EJECUTIVO", "C" + f[0].slice(1)) : null; };
const fSub = fila("SUBTOTAL ANTES DE IMPUESTO");
const libroX = {
  directo: monto("COSTO DIRECTO"), indirectos: monto("Indirectos"), utilidad: monto("Utilidad"),
  flete: monto("Flete"), fianzas: monto("Fianzas"), financiamiento: monto("Financiamiento"),
  subtotal: monto("SUBTOTAL ANTES DE IMPUESTO"), iva: monto("IVA"), total: monto("TOTAL DE LA PROPUESTA"),
  formulaSubtotal: fSub ? RES["C" + fSub[0].slice(1)].f : null,
};
const r2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
Object.keys(libroX).forEach((k) => { if (typeof libroX[k] === "number") libroX[k] = r2(libroX[k]); });
const pantalla = { directo: r2(Q.direct), indirectos: r2(Q.ind), utilidad: r2(Q.uti), flete: r2(Q.flete), fianzas: r2(Q.fianza),
  financiamiento: r2(Q.finan), subtotal: r2(Q.sub), iva: r2(Q.iva), total: r2(Q.tot) };

/* Lo que el libro debería dar con SU PROPIO costo directo (el libro redondea P.U. a centavos). */
const d = libroX.directo, q = S.quote;
const subEsperadoLibro = d + d * q.indirect + (d + d * q.indirect) * q.utility + d * q.freight + d * q.bond + d * q.financing;

/* ---------- PDF de propuesta (texto crudo, como 15.1/15.2 de pruebas.mjs) ---------- */
const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
const pdfEs = dec(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
const pdfEn = dec(G("buildPropuestaPdf")({ lang: "en", mon: "USD" }));
const xlsxEn = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).toString("utf8");

imprime({
  caso: "1.3",
  valor: {
    renglonFinanciamientoEnLibro: libroX.financiamiento != null,
    /* Contra la cascada de computeQuote aplicada al directo del PROPIO libro:
       aísla el defecto del redondeo de P.U. a centavos que ya trae el catálogo. */
    subtotalLibroMenosCascada: r2(libroX.subtotal - subEsperadoLibro),
    totalLibroMenosCascada: r2(libroX.total - subEsperadoLibro * (1 + q.iva)),
    subtotalLibroMenosPantalla: r2(libroX.subtotal - pantalla.subtotal),
    totalLibroMenosPantalla: r2(libroX.total - pantalla.total),
  },
  detalle: {
    entradas: { indirect: 0.18, utility: 0.12, freight: 0.025, bond: 0.015, financing: 0.03, iva: 0.16, moneda: "MXN", proyecto: "proyectoBase" },
    libro: libroX, pantalla,
    subtotalEsperadoConDirectoDelLibro: r2(subEsperadoLibro),
    totalEsperadoConDirectoDelLibro: r2(subEsperadoLibro * (1 + q.iva)),
    faltanteSubtotal_directoLibroPorFinanciamiento: r2(d * q.financing),
    libroEN_tieneFinancing: /Financing/.test(xlsxEn),
    pdfPropuesta: {
      es_tieneCostoDirecto: pdfEs.includes("Costo directo"), es_tieneFianzas: pdfEs.includes("Fianzas"),
      es_tieneFinanciamiento: pdfEs.includes("Financiamiento"),
      en_tieneBonds: pdfEn.includes("Bonds"), en_tieneFinancing: pdfEn.includes("Financing"),
    },
    errores: w.__errs,
  },
});
process.exit(0);
