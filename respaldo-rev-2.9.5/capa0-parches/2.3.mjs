// Caso 2.3 · Presión de ductos sumando ramales en paralelo.
// Red de suministro explícita: 1 troncal que alimenta 3 ramales iguales en
// paralelo (la topología la conocemos porque la armamos aquí; el estado de la
// suite NO la guarda). Recorrido crítico = troncal + el ramal de mayor caída.
// Uso: node casos/2.3.mjs <html>
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);
const seg = G("defaultSegment");
const r1 = (x) => Math.round(x * 10) / 10;
const r3 = (x) => Math.round(x * 1000) / 1000;
const INWG = 249.089;

/* Entradas explícitas. Ids fijos para que el caso sea reproducible.
   Mismos parámetros que chainToDuct usa para troncal y ramales. */
const ramal = (tag, id, flow) => ({
  ...seg(tag, flow), id, shape: "round", method: "velocity", targetV: 5, length: 10,
  fittings: [{ type: "tee_branch", qty: 1, C: .65 }, { type: "exit_diffuser", qty: 1, C: 1 }],
});
const troncal = (flow) => ({ ...seg("SA-PRINCIPAL", flow), id: "c23t", shape: "rect", method: "equal_friction",
  targetF: .8, length: 20, aspect: 3, fittings: [{ type: "elbow_90_rect", qty: 2, C: .28 }] });

function medir() {
  G("recompute")();
  const D = G("DUCT");
  const tr = D.segs.find((s) => /PRINCIPAL/.test(s.tag));
  const ram = D.segs.filter((s) => s !== tr);
  const critico = tr.total + Math.max(...ram.map((s) => s.total));
  return { D, tr, ram, critico };
}

/* ---- A · 1 troncal 1800 L/s + 3 ramales de 600 L/s ---- */
S.duct.segments = [troncal(1800), ramal("SA-RAMAL-A", "c23a", 600), ramal("SA-RAMAL-B", "c23b", 600), ramal("SA-RAMAL-C", "c23c", 600)];
const A = medir();
const reqA = G("requisitoFam")("rtu");

/* Lo que imprime la memoria de cálculo (PDF) con el caso A. */
let pdfLinea = null;
try {
  const txt = Buffer.from(G("buildMemoriaPdf")()).toString("latin1");
  const m = /Ca[^ ]*da de presi[^ ]*n ([^·]{0,40}?)([\d.,]+) Pa · presi[^ ]*n de ventilador sugerida ([\d.,]+) Pa/.exec(txt);
  pdfLinea = m ? `${m[1]}${m[2]} Pa · sugerida ${m[3]} Pa` : null;
} catch (e) { pdfLinea = "error: " + e.message; }
/* Lo que dice la pantalla de ductos (métricas del resumen hidráulico). */
S.tab = "ductos"; G("render")();
const pantalla = [...w.document.querySelectorAll(".metric")]
  .map((m) => m.textContent.replace(/\s+/g, " ").trim())
  .filter((t) => /Δp|ventilador/i.test(t));

/* ---- B · consecuencia en selección: 1 troncal 3200 L/s + 8 ramales de 400 L/s,
        evaporadora ducteada (split_duct entrega ~0.8 in.wg según CRITERIO_FAM) ---- */
S.duct.segments = [troncal(3200), ...Array.from({ length: 8 }, (_, i) => ramal(`SA-RAMAL-${i + 1}`, `c23b${i}`, 400))];
const B = medir();
const reqB = G("requisitoFam")("split_duct");
const selB = G("selPorFamilia")("split_duct", reqB);
const selBcrit = G("selPorFamilia")("split_duct", { ...reqB, esp: B.critico * 1.15 / INWG });
const porPresion = (sel) => sel.cands.filter((c) => (c.marcas || []).some((x) => /in\.wg/.test(x))).length;

/* ---- C · la red que genera la propia suite desde la carga (chainToDuct) ---- */
G("chainToDuct")(true); G("recompute")();
const D2 = G("DUCT");
const t2 = D2.segs.find((s) => /PRINCIPAL/.test(s.tag));
const r2 = D2.segs.filter((s) => s !== t2 && s.service === "supply" && !/OA-/.test(s.tag));
const oa2 = D2.segs.find((s) => /OA-/.test(s.tag));

imprime({
  caso: "2.3",
  valor: r1(A.D.path),
  detalle: {
    A_tramos: A.D.segs.map((s) => ({ tag: s.tag, flow: s.flow, total_Pa: r1(s.total) })),
    A_DUCT_path_Pa: r1(A.D.path),
    A_recorrido_critico_Pa: r1(A.critico),
    A_desviacion_Pa: r1(A.D.path - A.critico),
    A_desviacion_pct: r1((A.D.path / A.critico - 1) * 100),
    A_ventilador_hoy_Pa: r1(A.D.path * 1.15),
    A_ventilador_critico_Pa: r1(A.critico * 1.15),
    A_esp_requisitoFam_inwg: r3(reqA.esp),
    A_esp_critico_inwg: r3(A.critico * 1.15 / INWG),
    A_DUCT_critical_tag: A.D.critical ? A.D.critical.tag : null,
    A_memoria_pdf: pdfLinea,
    A_pantalla_ductos: pantalla,
    B_DUCT_path_Pa: r1(B.D.path),
    B_recorrido_critico_Pa: r1(B.critico),
    B_desviacion_pct: r1((B.D.path / B.critico - 1) * 100),
    B_esp_hoy_inwg: r3(reqB.esp),
    B_esp_critico_inwg: r3(B.critico * 1.15 / INWG),
    B_split_duct_candidatos: selB.cands.length,
    B_castigados_por_presion_hoy: porPresion(selB),
    B_castigados_por_presion_con_critico: porPresion(selBcrit),
    B_marca_ejemplo: (selB.cands.find((c) => (c.marcas || []).some((x) => /in\.wg/.test(x))) || { marcas: [] }).marcas.filter((x) => /in\.wg/.test(x))[0] || null,
    C_chainToDuct: {
      tramos: D2.segs.map((s) => ({ tag: s.tag, flow: s.flow, total_Pa: r1(s.total) })),
      DUCT_path_Pa: r1(D2.path),
      troncal_mas_ramal_mayor_Pa: r1(t2.total + Math.max(...r2.map((s) => s.total))),
      con_toma_OA_en_serie_Pa: r1(t2.total + Math.max(...r2.map((s) => s.total)) + (oa2 ? oa2.total : 0)),
    },
    campos_de_un_tramo: Object.keys(S.duct.segments[0]).sort().join(","),
  },
});
