// Caso 4.2 · Equipos leídos de archivos sin destino.
// Uso: node casos/4.2.mjs <archivo.html>
// Entradas explícitas:
//   proyectoBase (Producción 400 m² h 6 m 30 pers · Oficinas 100 m² h 3 m 10 pers, cruces autorizados)
//   archivo "cedula-equipos.txt" cargado en la disciplina «Selección de equipo" con dos renglones:
//     UMA-01 CARRIER 39L-80 32,000 CFM
//     CH-01 CARRIER 19XR-800 800 TR
//   (modelos reales del catálogo Carrier de la suite, muy lejos de lo que el
//    proyecto de 500 m² selecciona solo, para que su aparición no sea casual)
//   Se aplica con «Aplicar al proyecto abierto» (cxAplicar(lote, "abierto")) con
//   las casillas tal como la ventana las propone.
// valor = equipos que la suite da por aplicados (toast, «Origen de los datos» y
//         memoria integral) y que no llegan a ningún motor ni documento de
//         selección: ni a la cédula de equipos en PDF, ni a S.sel.modelos, ni a
//         S.quote.items, ni a SYS.
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);

/* Texto visible de un PDF de la suite (flujos sin comprimir, cadenas Tj). */
const textoPdf = (bytes) => {
  const raw = Buffer.from(bytes).toString("latin1");
  const out = [];
  const re = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  let m;
  while ((m = re.exec(raw))) out.push(m[1].replace(/\\([()\\])/g, "$1"));
  return out.join(" ");
};

const CEDULA = "UMA-01 CARRIER 39L-80 32,000 CFM\nCH-01 CARRIER 19XR-800 800 TR\n";
const MODELOS = ["39L-80", "19XR-800"];

G("recompute")();
const cedulaAntes = textoPdf(G("buildCedulaEquiposPdf")());
const selAntes = JSON.stringify(S.sel || {});
const quoteAntes = JSON.stringify(S.quote.items || []);
const sysAntes = JSON.stringify((G("SYS").chosen || {}).groups?.map((g) => g.model.model) || []);

const archivo = new w.File([CEDULA], "cedula-equipos.txt");
const lote = await G("cxProcesarArchivos")([archivo], "seleccion");
const props = lote.propuestas.map((p) => ({ etiqueta: p.etiqueta, valor: p.valor, grupo: p.grupo, destino: p.destino, marcado: p.marcado }));
const modalHtml = G("cxModalHtml")(lote);
const panelHtml = G("cxPanelCargaHtml")("seleccion");

const k = G("cxAplicar")(lote, "abierto");
G("recompute")(); G("render")();

const ult = S.cx.lotes[S.cx.lotes.length - 1];
const aplicadosEquipo = (ult.aplicados || []).filter((a) => /^Equipo · /.test(a.etiqueta));

const cedulaDespues = textoPdf(G("buildCedulaEquiposPdf")());
const selDespues = JSON.stringify(S.sel || {});
const quoteDespues = JSON.stringify(S.quote.items || []);
const sysDespues = JSON.stringify((G("SYS").chosen || {}).groups?.map((g) => g.model.model) || []);
const memoria = textoPdf(G("buildMemoriaIntegralPdf")());
const origenHtml = G("cxOrigenHtml")("seleccion");

/* Un equipo aplicado "llega" si su modelo aparece en la cédula entregada, en la
   selección registrada o en la cotización. */
const catalogo = G("CARRIER");
const idDe = (modelo) => (catalogo.find((c) => c.model === modelo) || {}).id || null;
const llega = (modelo) => {
  const id = idDe(modelo);
  return cedulaDespues.includes(modelo) || (id && (selDespues.includes(id) || quoteDespues.includes(id)));
};
const sinDestino = aplicadosEquipo.filter((a) => {
  const mod = MODELOS.find((m) => String(a.valor).includes(m));
  return !(mod && llega(mod));
});

imprime({
  caso: "4.2",
  valor: sinDestino.length,
  detalle: {
    propuestas_en_ventana: props,
    toast_datos_aplicados: k,
    aplicados_equipo: aplicadosEquipo.map((a) => `${a.etiqueta} -> ${a.destino} = ${a.valor}`),
    guardado_en_S_cx_lotes_equipos: ult.equipos,
    modelos_en_catalogo_carrier: MODELOS.map((m) => [m, idDe(m)]),
    cedula_pdf_identica_antes_y_despues: cedulaAntes === cedulaDespues,
    cedula_pdf_menciona_modelos: MODELOS.filter((m) => cedulaDespues.includes(m)),
    S_sel_sin_cambio: selAntes === selDespues,
    S_quote_items_sin_cambio: quoteAntes === quoteDespues,
    SYS_grupos_sin_cambio: sysAntes === sysDespues,
    memoria_integral_lista_equipos: ["UMA-01", "CH-01"].filter((t) => memoria.includes("Equipo · " + t) || memoria.includes("Equipo \xb7 " + t) || new RegExp("Equipo .{1,3}" + t).test(memoria)),
    memoria_dice_entrar_al_motor: /aceptado por el usuario antes de entrar al motor/.test(memoria),
    origen_de_los_datos_muestra_destino: (origenHtml.match(/cx\.equipos/g) || []).length,
    ventana_promete: /Nada entra a los motores sin tu marca/.test(modalHtml),
    panel_acepta: (panelHtml.match(/carga el proyecto ejecutivo de esta disciplina: ([^.]*)\./) || [])[1] || null,
    equipos_sin_destino: sinDestino.map((a) => a.etiqueta),
  },
});
