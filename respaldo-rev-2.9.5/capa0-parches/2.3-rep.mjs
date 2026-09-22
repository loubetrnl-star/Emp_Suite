// Caso 2.3-rep · El rótulo "cota superior" de la presión de ductos.
// Red C: la que arma la suite con chainToDuct (sin tramos de retorno).
// Red D: la misma red más un tramo de retorno capturado a mano.
// Imprime lo que dicen pantalla, memoria PDF, libro ES/EN, marca de selección y guía.
// Uso: node casos/2.3-rep.mjs <html>
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);
Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "caso 2.3-rep" }; });
const tjs = (buf) => {
  const txt = Buffer.from(buf).toString("latin1");
  return [...txt.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
};
const corta = (s, re, n = 260) => { const m = re.exec(s); return m ? s.slice(m.index, m.index + n) : null; };

function leer(nombre) {
  G("recompute")();
  const D = G("DUCT");
  S.tab = "ductos"; G("render")();
  const pant = w.document.body.textContent.replace(/\s+/g, " ");
  const pdf = tjs(G("buildMemoriaPdf")());
  const xes = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
  const xen = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).toString("utf8");
  const sel = G("selPorFamilia")("split_duct", { ...G("requisitoFam")("split_duct"), esp: 5 });
  const marca = sel.cands.flatMap((c) => c.marcas || []).find((x) => /in\.wg/.test(x)) || null;
  return {
    red: nombre,
    tramos: D.segs.map((s) => `${s.tag}/${s.service}`),
    DUCT_path_Pa: Math.round(D.path * 10) / 10,
    pantalla_nota: corta(pant, /La presión del ventilador que se muestra/, 330),
    pantalla_sub: corta(pant, /\+15 % de margen/, 110),
    memoria_pdf: corta(pdf, /con 15 % de margen \(/, 300),
    libro_es: corta(xes, /\(suministro \+ retorno\)/, 260),
    libro_en: corta(xen, /\(supply \+ return\)/, 240),
    marca_seleccion: marca,
  };
}

G("chainToDuct")(true);
const C = leer("C chainToDuct (sin retorno)");
const seg = G("defaultSegment");
S.duct.segments.push({ ...seg("RA-PRINCIPAL", 1770), id: "c23rra", service: "return", shape: "rect", method: "equal_friction",
  targetF: .8, length: 20, aspect: 2, fittings: [{ type: "elbow_90_rect", qty: 2, C: .28 }] });
const Dr = leer("D chainToDuct + RA-PRINCIPAL (con retorno)");
imprime({ caso: "2.3-rep", guia_ojo: G("GUIA").ductos.ojo, C, D: Dr });
