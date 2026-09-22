// Caso 1.2 · Licitación con dos precios para el mismo concepto.
// Uso: node casos/1.2.mjs <html>
//
// Proyecto: proyectoBase (2 zonas, todos los cruces autorizados), cotización
// por omisión (plaza Tijuana, factor 1.00, FASAR 1.45, financiamiento 1.5 %).
// Se genera el PDF de licitación que entregaría el botón "pdf-licitacion" y se
// lee su texto.
//
// Medida neutral (no presupone qué número debe mandar): con los precios que el
// MISMO documento imprime por concepto —el "PRECIO UNITARIO INTEGRADO" de cada
// tarjeta y, para los conceptos sin tarjeta, su P.U. de catálogo llevado por el
// mismo factor de sobrecosto que el resumen— se rearma el importe y se compara
// contra el "IMPORTE DE LA PROPUESTA" impreso. Si hay un solo número por
// concepto, la diferencia es cero (salvo redondeo a centavos del P.U.).
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
proyectoBase(w);

const bytes = G("buildLicitacionPdf")();
const s = Array.from(bytes).map((c) => String.fromCharCode(c)).join("");
const BS = String.fromCharCode(92);
const toks = [];
{
  const re = /\(((?:\\.|[^\\)])*)\) Tj/g;
  let m;
  while ((m = re.exec(s))) {
    let t = "", x = m[1];
    for (let i = 0; i < x.length; i++) { if (x[i] === BS && i + 1 < x.length) { t += x[i + 1]; i++; } else t += x[i]; }
    toks.push(t);
  }
}
const num = (t) => Number(String(t).replace(/,/g, ""));
const tras = (rotulo, desde = 0) => { const i = toks.indexOf(rotulo, desde); return i < 0 ? null : num(toks[i + 3]); };

const cdResumen = tras("Costo directo del catalogo");
const importeResumen = tras("IMPORTE DE LA PROPUESTA");
const factor = cdResumen > 0 ? importeResumen / cdResumen : NaN;

const cat = G("catalogoConceptos")();
const partidas = cat.secciones.flatMap((x) => x.partidas);
const detalle = [];
let rearmado = 0, conDos = 0, tolerancia = 0;
partidas.forEach((p) => {
  const iH = toks.findIndex((t) => t.startsWith(p.clave + " · "));
  let puTarjeta = null, cdTarjeta = null;
  if (iH >= 0) {
    const sig = toks.findIndex((t, k) => k > iH && /^[A-G]\d{3} · /.test(t));
    const fin = sig < 0 ? toks.length : sig;
    const iP = toks.indexOf("PRECIO UNITARIO INTEGRADO", iH);
    const iC = toks.indexOf("COSTO DIRECTO POR UNIDAD", iH);
    if (iP > 0 && iP < fin) puTarjeta = num(toks[iP + 3]);
    if (iC > 0 && iC < fin) cdTarjeta = num(toks[iC + 3]);
  }
  if (puTarjeta != null) {
    rearmado += p.qty * puTarjeta;
    tolerancia += p.qty * 0.005; // el P.U. impreso va redondeado a centavos
    const puResumen = p.unit * factor; // P.U. integrado que el resumen le da a ese concepto
    const dif = Math.abs(puResumen - puTarjeta) > 0.01;
    if (dif) conDos++;
    detalle.push({ clave: p.clave, un: p.un, qty: +p.qty.toFixed(3),
      puCatalogo: +p.unit.toFixed(2), importeCatalogo: +p.total.toFixed(2),
      puIntegradoPorResumen: +puResumen.toFixed(2),
      cdTarjeta, puIntegradoTarjeta: puTarjeta,
      importeConTarjeta: +(p.qty * puTarjeta).toFixed(2) });
  } else {
    rearmado += p.total * factor;
  }
});
const diferencia = +(importeResumen - rearmado).toFixed(2);
/* Guarda contra un falso "corregido": si la corrección renombra el rótulo de la
   tarjeta, el concepto dejaría de leerse como tarjeta y la diferencia saldría 0
   sin que haya un solo número. Se exige leer tantas tarjetas como recetas hay. */
const tarjetasEsperadas = partidas.filter((p) => G("analizarPU")(p)).length;

imprime({
  caso: "1.2",
  valor: diferencia,
  detalle: {
    queMide: "IMPORTE DE LA PROPUESTA impreso menos el importe rearmado con el P.U. que el mismo PDF imprime por concepto (0 = un solo numero)",
    toleranciaRedondeo: +tolerancia.toFixed(2),
    unSoloNumero: detalle.length === tarjetasEsperadas && Math.abs(diferencia) <= tolerancia + 0.01,
    tarjetasEsperadas,
    notaConDos: "conceptosConDosPrecios compara la tarjeta contra el P.U. de catalogo llevado por el factor; es informativo (sigue en 3 si la correccion hace mandar la tarjeta sin tocar el catalogo)",
    conceptosConTarjeta: detalle.length,
    conceptosConDosPrecios: conDos,
    cdResumen, importeResumen, factorSobrecosto: +factor.toFixed(6), importeRearmado: +rearmado.toFixed(2),
    tarjetas: detalle,
    errores: w.__errs,
  },
});
