// Caso 2.4 · Bomba contra incendio con tope silencioso.
// Proyecto base de la auditoría + contra incendio con entradas explícitas
// (600 m², 6 m, K80, acero negro, área de diseño = mínima de la clase, ramal 30 m,
// montante 12 m, cisterna con bomba) cambiando solo la clase de riesgo.
// Mide: demanda qTotal, bomba nominal qBomba, si la bomba cubre la demanda, HP,
// cuántos avisos del motor hablan de la bomba, qué dice el PDF (fila y
// observaciones), la partida de cotización y el semáforo de la disciplina.
// Uso: node casos/2.4.mjs <html>
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);

const base = G("defaultFuego")();
const medir = (riesgo) => {
  S.fuego = { ...base, riesgo, area: 600, altura: 6, rociador: "k80", material: "acero_neg",
    areaDiseno: 0, Lramal: 30, Lmontante: 12, presFuente: 30, fuente: "cisterna", tomarArea: false };
  G("recompute")();
  const F = G("FUEGO");
  const pdf = Buffer.from(G("buildFuegoPdf")()).toString("latin1");
  const iObs = pdf.indexOf("7. Observaciones");
  const obs = iObs >= 0 ? pdf.slice(iObs, pdf.indexOf("8. Alcance de este calculo")) : "";
  const mf = pdf.match(/\(Bomba contra incendio\) Tj ET\s*BT [^\n]*? Tm \(((?:\\.|[^\\)])*)\) Tj/);
  const filaPdf = mf ? mf[1].replace(/\\(.)/g, "$1") : null;
  const partida = JSON.stringify(G("QUOTE")).match(/Bomba contra incendio [^"]*/);
  const avisosBomba = F.avisos.filter((a) => /bomba/i.test(a.msg));
  const sem = G("semaforoSuite")().find((x) => x.id === "fuego");
  /* HP que resultaría con la misma fórmula del motor (7873-7874) si la bomba
     tuviera al menos el caudal de demanda. */
  const kWdem = 9.81 * (F.qTotal / 60 / 1000) * F.presBomba / .65;
  return {
    riesgo,
    qTotal: +F.qTotal.toFixed(1),
    qTotal_gpm: +(F.qTotal / 3.785).toFixed(0),
    qBomba: F.qBomba,
    cubre: F.qBomba >= F.qTotal,
    faltanteLmin: +Math.max(0, F.qTotal - F.qBomba).toFixed(1),
    presBomba_m: +F.presBomba.toFixed(2),
    hpBomba: F.hpBomba,
    hp_con_caudal_de_demanda: Math.ceil(kWdem / .746 / 5) * 5,
    avisosBomba: avisosBomba.length,
    avisos: F.avisos.map((a) => `${a.lvl}: ${a.msg.slice(0, 90)}`),
    pdfFilaBomba: filaPdf,
    pdfObservacionesMencionanBomba: /bomba/i.test(obs),
    cotizacion: partida ? partida[0] : null,
    semaforo: sem ? sem.nivel : null,
  };
};

const filas = ["ord1", "ord2", "extra1", "extra2"].map(medir);
const e1 = filas.find((f) => f.riesgo === "extra1");
imprime({
  caso: "2.4",
  valor: {
    qTotal_extra1: e1.qTotal,
    qBomba_extra1: e1.qBomba,
    bomba_cubre_demanda: e1.cubre,
    avisos_sobre_bomba: e1.avisosBomba,
    pdf_observaciones_mencionan_bomba: e1.pdfObservacionesMencionanBomba,
    pdf_fila_bomba_extra1: e1.pdfFilaBomba,
  },
  detalle: filas,
  errores: w.__errs,
});
process.exit(0);
