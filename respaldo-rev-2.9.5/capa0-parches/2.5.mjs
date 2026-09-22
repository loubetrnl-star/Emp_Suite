// Caso 2.5 · Soportería de tubería hidráulica: ¿con qué familia de material se espacia?
// Uso: node casos/2.5.mjs <html>
// Entradas: proyecto base de la auditoría (proyectoBase: 2 zonas, todos los cruces
// autorizados) + hidrosanitario por omisión (defaultHidro: 2 tramos, AF-GENERAL
// 72 UM 25 m y AF-RAMAL BAÑOS 20 UM 18 m) + soportería por omisión. Se varía solo
// S.hidro.material en {cobre, cpvc, pead, acero}.
// Se mide como la app: (a) "gobernado" = se acepta la propuesta motores>soporte
// (instantánea) y se lee SOPORTE y la cédula PDF de soportería; (b) "vivo" = modo de
// revisiones anteriores (usarMotores sin instantánea), que pasa directo por computeSoporte.
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);
const num = (x) => Number(x) || 0;

/* Filas "Hidráulica y sanitario" de la tabla "Conteo por tramo" del PDF que se entrega. */
function filasPdf() {
  const txt = Buffer.from(G("buildSoportePdf")()).toString("latin1");
  const toks = [...txt.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((m) => m[1]);
  const filas = [];
  toks.forEach((t, i) => {
    if (t === "Hidráulica y sanitario") filas.push({ tramo: toks[i + 1], d_mm: toks[i + 2], espac_m: toks[i + 3], L_m: toks[i + 4], soportes: toks[i + 5] });
  });
  return filas;
}

function hidroDe(R) {
  const h = (R.porTuberia || []).find((x) => x.etiqueta === "Hidráulica y sanitario");
  return h ? { fam: h.fam, n: h.n, det: h.det.map((d) => ({ tag: d.tag, d_mm: d.d, L: d.L, esp_m: d.e, n: d.n, kg_m: +d.wl.toFixed(3), kg_soporte: +d.carga.toFixed(2), varilla: d.varilla })) } : null;
}

function medir(material) {
  S.hidro = G("defaultHidro")();
  S.hidro.material = material;
  S.soporte = G("defaultSoporte")();
  G("recompute")();

  /* (b) vivo: sin instantánea */
  const vivo = hidroDe(G("SOPORTE"));

  /* (a) gobernado: acepta/actualiza la instantánea, como el botón de la app */
  G("propAceptar")("motores>soporte");
  G("recompute")();
  const R = G("SOPORTE");
  const gob = hidroDe(R);
  const ref = gob ? gob.det.map((d) => ({ d_mm: d.d_mm,
    acero: G("espSoporte")(d.d_mm, "acero"), cobre: G("espSoporte")(d.d_mm, "cobre"), plastico: G("espSoporte")(d.d_mm, "plastico") })) : [];
  return {
    material, snapHidroMat: S.soporte.snap ? S.soporte.snap.hidroMat : null,
    gobernado: gob, vivo: vivo ? { fam: vivo.fam, n: vivo.n, esp_m: vivo.det.map((d) => d.esp_m) } : null,
    pdfConteo: filasPdf(), tablasDelCodigo: ref,
    nSoportes: R.nSoportes, nChica: R.nChica, nMedia: R.nMedia, nGrande: R.nGrande, totalSoporte: +num(R.total).toFixed(2),
    quoteTot: +num(G("QUOTE").tot).toFixed(2),
  };
}

const res = {};
["cobre", "cpvc", "pead", "acero"].forEach((m) => { res[m] = medir(m); });

const corto = (r) => ({
  familia: r.gobernado && r.gobernado.fam, snapHidroMat: r.snapHidroMat, familiaVivo: r.vivo && r.vivo.fam,
  esp_m: r.gobernado ? r.gobernado.det.map((d) => d.esp_m) : [], soportesHidro: r.gobernado ? r.gobernado.n : 0,
  pdfEspac: r.pdfConteo.map((f) => f.espac_m), pdfSoportes: r.pdfConteo.map((f) => f.soportes),
  totalSoporte: r.totalSoporte,
});

imprime({
  caso: "2.5",
  valor: { cobre: corto(res.cobre), cpvc: corto(res.cpvc), pead: corto(res.pead), acero: corto(res.acero) },
  detalle: { ...res, errores: w.__errs },
});
process.exit(0);
