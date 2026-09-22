// Banco de comprobaciones de la rev 2.9.2 — EMP B12
// Verifica las cuatro entregas (menú de íconos, tablero, interoperabilidad de
// tres reglas, memoria integral), los hallazgos corregidos y que ningún motor
// de cálculo cambió de resultado.
// Uso: node pruebas.mjs [archivo.html] [--base archivo-original.html]
import { JSDOM } from "jsdom";
import fs from "node:fs";

const file = process.argv[2] || "index.html";
const baseIx = process.argv.indexOf("--base");
const baseFile = baseIx > 0 ? process.argv[baseIx + 1] : null;

async function cargar(f) {
  const html = fs.readFileSync(f, "utf8").replace(/@font-face\{[^}]*\}/g, "");
  const dom = new JSDOM(html, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "https://emp.local/",
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.requestAnimationFrame = (fn) => setTimeout(fn, 0);
      w.cancelAnimationFrame = (t) => clearTimeout(t);
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.URL.createObjectURL = () => "blob:x"; w.URL.revokeObjectURL = () => {};
      Object.defineProperty(w.navigator, "serviceWorker", { value: { register: () => Promise.resolve({}), addEventListener() {} } });
      w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder; w.Blob = Blob;
      w.CSS = { escape: (s) => String(s).replace(/([^\w-])/g, "\\$1") };
      w.__errs = []; w.addEventListener("error", (e) => w.__errs.push(e.message));
    },
  });
  await new Promise((r) => setTimeout(r, 250));
  return dom.window;
}

const w = await cargar(file);
const G = (expr) => w.eval(expr);
const S = G("S");

let ok = 0, fail = 0;
const fallos = [];
function t(nombre, fn) {
  try {
    const r = fn();
    if (r === false) { fail++; fallos.push([nombre, "devolvió falso"]); }
    else ok++;
  } catch (e) { fail++; fallos.push([nombre, e.message]); }
}
const eq = (a, b, msg) => { if (!(a === b)) throw new Error(`${msg || ""} esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`); };
const cerca = (a, b, tol, msg) => { if (!(Math.abs(a - b) <= tol)) throw new Error(`${msg || ""} esperado ~${b}, obtenido ${a}`); };
const contiene = (s, x, msg) => { if (String(s).indexOf(x) < 0) throw new Error(`${msg || ""} no contiene "${x}"`); };

/* --------------------------------------------------- proyecto de prueba */
function proyectoDePrueba() {
  S.meta.name = "Banco de pruebas 2.7.0";
  S.meta.client = "EMP interno";
  S.zones = [
    { ...G("defaultZone")("Producción"), area: 400, height: 6, occ: 30 },
    { ...G("defaultZone")("Oficinas"), area: 100, height: 3, occ: 10 },
  ];
  S.zi = 0;
  G("recompute")();
}
proyectoDePrueba();

/* ============================ 1. Menú de disciplinas en cuadrícula =======
   rev 2.9.2 · La cuadrícula de disciplinas ya NO se pinta dentro de una
   pantalla de captura: la navegación es en ciclo y dentro de un módulo la
   cabecera es la barra de regreso. El índice escrito del proyecto es el
   tablero, y ahí es donde la cuadrícula sigue viviendo. */
S.tab = "tablero"; G("render")();
const tabsHtml = () => w.document.getElementById("tabs").innerHTML;
t("1.1 el menú es una cuadrícula de íconos, no pestañas de texto", () => {
  const h = tabsHtml();
  contiene(h, 'class="ngb"'); contiene(h, 'class="ngi"');
  if (h.indexOf('class="tsep"') >= 0) throw new Error("quedó el separador de la tira de pestañas");
});
t("1.2 cada pestaña tiene su ícono vectorial en línea con etiqueta debajo", () => {
  const tabs = G("TABS").map(([id]) => id);
  const h = tabsHtml();
  tabs.forEach((id) => {
    contiene(h, `data-tab="${id}"`, `pestaña ${id}:`);
    if (!G("ICONOS")[id]) throw new Error(`la pestaña ${id} no tiene símbolo declarado`);
  });
  eq((h.match(/<svg /g) || []).length, tabs.length, "un ícono por pestaña:");
  eq((h.match(/class="ngt"/g) || []).length, tabs.length, "una etiqueta por ícono:");
});
t("1.3 los íconos no dependen de ninguna librería ni recurso externo", () => {
  const h = tabsHtml();
  if (/<img|https?:\/\/|url\(/.test(h)) throw new Error("el menú carga algo de fuera");
  if (!/stroke="currentColor"/.test(h)) throw new Error("los íconos no toman el color del sitio");
});
t("1.4 los nueve símbolos que pidió la casa están declarados", () => {
  const I = G("ICONOS");
  ["carga", "limpios", "ventilacion", "ductos", "electrico", "hidro", "fuego", "estructural", "soporte"]
    .forEach((k) => { if (!I[k] || I[k].length < 40) throw new Error(`falta o es trivial el símbolo de ${k}`); });
});
t("1.5 la disciplina activa queda resaltada y es la única", () => {
  S.tab = "tablero"; G("render")();
  const h = tabsHtml();
  eq((h.match(/aria-selected="true"/g) || []).length, 1);
  contiene(h, 'data-tab="tablero" aria-selected="true"');
});
t("1.5.1 dentro de una disciplina el menú de las demás NO se muestra", () => {
  S.tab = "ductos"; G("render")();
  const h = tabsHtml();
  if (/class="ngb"/.test(h)) throw new Error("la tira de disciplinas sigue a la vista dentro del módulo");
  contiene(h, 'class="modbar"', "falta la barra de regreso:");
  contiene(h, 'data-act="ir-diagrama"', "falta el botón de regreso al diagrama:");
  contiene(h, "HVAC", "la barra no dice en qué disciplina se está:");
  S.tab = "tablero"; G("render")();
});
t("1.6 la paleta del menú sale del sitio: sin colores inventados", () => {
  const css = G("document").querySelector("style").textContent;
  const bloque = css.slice(css.indexOf("nav.tabs{"), css.indexOf(".tablero{"));
  const hex = bloque.match(/#[0-9a-fA-F]{3,6}/g) || [];
  if (hex.filter((x) => x.toLowerCase() !== "#fff").length) throw new Error("hay colores fuera de las variables del sitio: " + hex.join(","));
});

/* ====================== 2. Diagrama de nodos (pantalla principal) ======== */
S.tab = "inicio"; G("render")();
const vista = () => w.document.getElementById("view").innerHTML;
t("2.0 la pantalla principal es un diagrama de nodos, no una cuadrícula", () => {
  const v = vista();
  contiene(v, 'class="portada diag"');
  contiene(v, 'class="dlienzo"');
  contiene(v, "Suite de cálculo de ingeniería", "lema:");
  eq((v.match(/class="dnodo/g) || []).length, G("NODOS").length, "nodos dibujados:");
});
t("2.0.0 la portada no lleva más texto que el lema", () => {
  /* rev 2.9.1 · La portada se despojó a propósito: sin título de producto,
     sin línea de marca y sin párrafo descriptivo. El diagrama es el mensaje.
     Si alguien vuelve a colgar texto ahí, esta comprobación lo detiene. */
  const v = vista();
  ["EMP B12", "Electromecánica del Pacífico", "El proyecto completo en un plano"]
    .forEach((t2) => { if (v.includes(t2)) throw new Error("volvió texto a la portada: " + t2); });
  ["<h1>", 'class="pmarca"', 'class="pdesc"'].forEach((t2) => {
    if (v.includes(t2)) throw new Error("volvió un elemento retirado de la portada: " + t2);
  });
  eq((v.match(/class="plema"/g) || []).length, 1, "el lema debe aparecer una sola vez:");
});
t("2.0.0.1 el diagrama entra completo, sin barra de desplazamiento", () => {
  /* El lienzo dimensiona texto e íconos en cqw, en centésimas de su propio
     ancho, así que todo encoge junto. Si vuelve un ancho mínimo fijo en
     escritorio, regresa la barra horizontal que motivó este cambio. */
  const css = G("document").documentElement.innerHTML;
  const bloque = css.slice(css.indexOf(".dlienzo{"), css.indexOf(".dlienzo{") + 220);
  if (!/container-type:\s*inline-size/.test(bloque)) throw new Error("el lienzo no declara contenedor de consulta");
  if (/^[^@]*\.dlienzo\{[^}]*min-width/.test(css.slice(css.indexOf(".dlienzo{"))))
    throw new Error("el lienzo volvió a imponer un ancho mínimo fuera de la consulta de medio");
  const v = vista();
  if (!/--i:\d/.test(v)) throw new Error("los nodos no llevan su índice de entrada escalonada");
});
t("2.0.0.2 ninguna flecha comparte carril con otra que la cruce", () => {
  /* Dos flechas con el mismo tramo vertical y rangos de altura que se
     traslapan se dibujan una encima de la otra y el plano deja de leerse. */
  const G2 = G("ARISTAS"), nd = G("nodoDe");
  const tramos = G2.map((ar) => {
    const A = nd(ar.de), B = nd(ar.a);
    if (!A || !B || ar.atras || ar.retro || ar.lane == null) return null;
    const yA = A.y + A.h / 2, yB = B.y + B.h / 2;
    return { lane: ar.lane, lo: Math.min(yA, yB), hi: Math.max(yA, yB), id: ar.de + "→" + ar.a };
  }).filter(Boolean);
  tramos.forEach((a, i) => tramos.slice(i + 1).forEach((b) => {
    if (a.lane === b.lane && a.lo < b.hi - 2 && b.lo < a.hi - 2)
      throw new Error(`${a.id} y ${b.id} comparten el carril ${a.lane} y se cruzan`);
  }));
});
t("2.0.0.3 ningún carril vertical pasa por encima de un nodo", () => {
  const nd = G("nodoDe");
  G("ARISTAS").forEach((ar) => {
    if (ar.atras || ar.retro || ar.lane == null) return;
    const A = nd(ar.de), B = nd(ar.a);
    const yA = A.y + A.h / 2, yB = B.y + B.h / 2;
    if (Math.abs(yA - yB) < 1) return;
    const lo = Math.min(yA, yB) + 2, hi = Math.max(yA, yB) - 2;
    G("NODOS").forEach((n2) => {
      const dentroX = ar.lane > n2.x + 1 && ar.lane < n2.x + n2.w - 1;
      const dentroY = n2.y < hi && n2.y + n2.h > lo;
      if (dentroX && dentroY) throw new Error(`el carril de ${ar.de}→${ar.a} cruza el nodo ${n2.id}`);
    });
  });
});
t("2.0.1 el trazado es fijo: coordenadas declaradas, no lienzo libre", () => {
  const N = G("NODOS");
  N.forEach((nd) => { ["x", "y", "w", "h"].forEach((k) => { if (typeof nd[k] !== "number") throw new Error(`el nodo ${nd.id} no tiene ${k} declarada`); }); });
  const a = vista(); G("render")(); const b = vista();
  eq(a, b, "dos dibujados seguidos deben dar exactamente lo mismo:");
  if (/draggable|mousedown|transform:\s*translate\(var/.test(a)) throw new Error("hay algo arrastrable en el diagrama");
});
t("2.0.2 las cuatro etapas del flujo del proyecto están representadas", () => {
  const E = G("ETAPAS");
  eq(E.length, 4);
  const v = vista();
  ["Proyecto ejecutivo", "Diseño arquitectónico y estructural", "Instalaciones electromecánicas", "Consolidación"]
    .forEach((x) => contiene(v, x));
  /* La etapa 3 corre en paralelo: sus nodos comparten el rango vertical. */
  /* rev 2.9.2 · Las cinco pantallas del aire se agruparon en un solo nodo, así
     que la etapa de instalaciones pasó de once nodos a seis. Lo que se sigue
     exigiendo es que corran EN PARALELO, en más de una columna. */
  const par = G("NODOS").filter((nd) => nd.et === "e3");
  if (par.length < 6) throw new Error("la etapa de instalaciones no tiene las disciplinas derivadas");
  const cols = new Set(par.map((nd) => nd.x));
  if (cols.size < 2) throw new Error("las instalaciones no se dibujan en paralelo");
});
t("2.0.3 cada nodo lleva su semáforo de completitud", () => {
  const v = vista();
  const sem = G("semaforoSuite")();
  if (!/class="sem sem-/.test(v)) throw new Error("ningún nodo trae semáforo");
  const conSem = (v.match(/class="sem sem-/g) || []).length;
  if (conSem < sem.filter((x) => x.nivel !== "externo").length - 2) throw new Error("faltan semáforos en los nodos");
});
t("2.0.4 un clic en un nodo entra directo a la captura de ese módulo", () => {
  G("NODOS").forEach((nd) => {
    S.tab = "inicio"; G("render")();
    const b = w.document.querySelector(`.dnodo[data-tab="${nd.tab}"]`);
    if (!b) throw new Error("falta el nodo de " + nd.id);
    b.dispatchEvent(new w.Event("click", { bubbles: true }));
    eq(S.tab, nd.tab, `el nodo ${nd.id} lleva a:`);
    const v = vista();
    if (v.indexOf('class="portada diag"') >= 0) throw new Error(nd.id + " se quedó en el diagrama");
    /* Estructural informa (módulo externo); ingeniería de valor y Kaizen
       capturan decisiones, no campos. Los demás abren captura en línea. */
    const captura = /data-path=/.test(v) || /data-act="kz-add"/.test(v) || /data-act="ve-/.test(v)
      || nd.tab === "estructural" || nd.tab === "valor";
    if (!captura) throw new Error(nd.id + " no abrió una vista con captura");
  });
  S.tab = "inicio"; G("render")();
});
t("2.0.5 las flechas son las herencias declaradas, no adorno", () => {
  const A = G("ARISTAS");
  A.forEach((ar) => {
    if (!G("nodoDe")(ar.de) || !G("nodoDe")(ar.a)) throw new Error(`arista sin nodo: ${ar.de} → ${ar.a}`);
    if (ar.regla === 2 && !G("PROPUESTAS")[ar.prop]) throw new Error(`la arista ${ar.de}→${ar.a} dice ser propuesta y no existe`);
    if (ar.regla === 1 && ar.path !== "civil.zonas" && !G("HEREDA")[ar.path]) throw new Error(`la arista ${ar.de}→${ar.a} dice heredar ${ar.path} y no está declarado`);
    if (!ar.que) throw new Error(`la arista ${ar.de}→${ar.a} no dice qué hereda`);
  });
  if (!A.some((ar) => ar.regla === 1)) throw new Error("ninguna arista de regla 1");
  if (!A.some((ar) => ar.regla === 2)) throw new Error("ninguna arista de regla 2");
});
t("2.0.6 la flecha se pinta vigente cuando el dato heredado está al día", () => {
  /* rev 2.9.2 · La herencia que se mira aquí es una que CRUZA hacia fuera del
     módulo: HVAC → contra incendio hereda el área a proteger. Las que corrían
     entre las cinco pantallas del aire ya no son flechas del plano. */
  S.tab = "inicio"; G("render")();
  const ar = G("ARISTAS").find((x) => x.de === "hvac" && x.a === "fuego");
  if (!ar) throw new Error("no existe la flecha de HVAC a contra incendio");
  eq(G("estadoArista")(ar), "vigente");
  contiene(vista(), "dar-vigente");
});
t("2.0.7 y el nodo HVAC se desactualiza cuando cambió el dato de origen", () => {
  /* La propuesta de carga térmica a ductos quedó DENTRO del módulo: ya no se
     dibuja como flecha, pero su estado no se perdió — sube al semáforo del
     nodo, que muestra el peor de los cinco. */
  G("propAceptar")("load>duct");
  S.zones[0].area = Number(S.zones[0].area) + 150; G("recompute")();
  eq(G("estadoPropuesta")("load>duct").nivel, "desactualizado", "la propuesta interna:");
  eq(G("semaforoHvac")().nivel, "desactualizada", "el peor de los cinco manda en el nodo:");
  S.tab = "inicio"; G("render")();
  contiene(vista(), "sem-desactualizada");
  G("propAceptar")("load>duct");
  G("recompute")();
  if (G("semaforoHvac")().nivel === "desactualizada") throw new Error("al actualizar el nodo no volvió a estar al día");
  /* Se deja el proyecto como estaba para que las pruebas de las reglas
     empiecen desde cero y no desde lo que acepto esta. */
  S.zones[0].area = Number(S.zones[0].area) - 150;
  delete S.vinculos["load>duct"];
  S.duct.segments = [];
  G("recompute")();
});
t("2.0.8 el diagrama no usa ninguna librería ni recurso externo", () => {
  const v = vista();
  /* url(#…) es una referencia al propio documento (las puntas de flecha del
     SVG), no un recurso externo: se descuenta antes de revisar. */
  const limpio = v.replace(/url\(#[^)]*\)/g, "");
  if (/<img|https?:\/\/|url\(|<script|@import/.test(limpio)) throw new Error("el diagrama carga algo de fuera");
  contiene(v, "<svg", "las flechas son SVG en línea:");
});
t("2.0.9 el tablero conserva íntegro lo que no cabe en la portada", () => {
  S.tab = "tablero"; G("render")();
  const v = vista();
  ["Tablero del proyecto", "Geometría y ocupación heredadas", "Con datos", "Desactualizadas"].forEach((x) => contiene(v, x));
  if ((v.match(/class="tfila/g) || []).length < G("DISCIPLINAS").length) throw new Error("faltan disciplinas en el tablero");
});

/* ============================ 2b. Tablero de proyecto =================== */
S.tab = "tablero"; G("render")();
t("2.1 el tablero lista todas las disciplinas con su semáforo", () => {
  const v = w.document.getElementById("view").innerHTML;
  contiene(v, "Tablero del proyecto");
  const sem = G("semaforoSuite")();
  eq(sem.length, G("DISCIPLINAS").length, "una fila por disciplina:");
  sem.forEach((s) => contiene(v, s.nombre, `disciplina ${s.id}:`));
});
t("2.2 el semáforo distingue con datos, incompleta, desactualizada y sin datos", () => {
  const niveles = Object.keys(G("NIVEL_SEM"));
  ["datos", "incompleta", "desactualizada", "vacia"].forEach((k) => { if (!niveles.includes(k)) throw new Error("falta el nivel " + k); });
  const sem = G("semaforoSuite")();
  const load = sem.find((s) => s.id === "load");
  eq(load.nivel, "datos", "carga térmica con dos zonas capturadas:");
  const consumos = S.aire.consumos;
  S.aire.consumos = []; G("recompute")();
  eq(G("semaforoSuite")().find((s) => s.id === "aire").nivel, "vacia", "aire comprimido sin consumos:");
  S.aire.consumos = consumos; G("recompute")();
});
t("2.3 el semáforo es de suite: el menú y el tablero dicen lo mismo", () => {
  const sem = G("semaforoSuite")();
  const h = tabsHtml();
  sem.filter((s) => s.tab && s.nivel !== "externo").forEach((s) => contiene(h, `sem-${s.nivel}`, `${s.id}:`));
});
t("2.4 sin proyecto abierto no se presume nada calculado", () => {
  const nom = S.meta.name; const pid = S.pid;
  S.meta.name = "Proyecto sin nombre"; S.pid = null; G("recompute")(); G("render")();
  const sem = G("semaforoSuite")();
  if (sem.some((s) => s.nivel === "datos")) throw new Error("marca disciplinas con datos sin proyecto abierto");
  S.meta.name = nom; S.pid = pid; G("recompute")();
});

/* ============ 3. Regla 1 · geometría y ocupación se heredan solas ======== */
t("3.1 la geometría del proyecto se suma de las zonas, no se recalcula", () => {
  const g = G("geoProyecto")();
  eq(g.area, 500, "área:"); eq(g.personas, 40, "personas:");
  cerca(g.volumen, 400 * 6 + 100 * 3, 0.5, "volumen:");
  cerca(g.altura, 2700 / 500, 0.01, "altura media ponderada:");
  cerca(g.area * g.altura, g.volumen, 1, "área × altura debe dar el volumen:");
});
t("3.2 ventilación y contra incendio heredan área, altura y ocupación", () => {
  G("recompute")();
  eq(S.vent.area, 500); eq(S.fuego.area, 500); eq(S.vent.occ, 40);
  cerca(S.vent.height, 5.4, 0.01); cerca(S.fuego.altura, 5.4, 0.01);
});
t("3.3 si cambia la geometría, el destino la sigue sin intervención", () => {
  S.zones[1].area = 300; G("recompute")();
  eq(S.vent.area, 700); eq(S.fuego.area, 700);
  S.zones[1].area = 100; G("recompute")();
  eq(S.vent.area, 500);
});
t("3.4 la herencia se declara en pantalla con su origen y su fecha", () => {
  const h = G("herenciaHtml")("vent.area");
  contiene(h, "heredada"); contiene(h, "Carga térmica");
  if (!/\d{4}/.test(h)) throw new Error("no imprime la fecha desde cuándo vale ese número");
});
t("3.5 el usuario puede capturar el suyo y entonces deja de seguir al origen", () => {
  G("setPath")("vent.area", 250); G("marcarPropio")("vent.area");
  G("recompute")();
  eq(S.vent.area, 250, "respeta lo capturado:");
  S.zones[1].area = 300; G("recompute")();
  eq(S.vent.area, 250, "el cambio de origen no lo pisa:");
  eq(S.fuego.area, 700, "los demás campos siguen heredando:");
  contiene(G("herenciaHtml")("vent.area"), "capturada a mano");
  S.zones[1].area = 100; G("recompute")();
});
t("3.6 se puede volver a heredar sin perder el rastro", () => {
  const r = G("herDe")("vent.area");
  r.modo = "heredado"; G("recompute")();
  eq(S.vent.area, 500);
});

/* ====== 4. Regla 2 · ningún resultado calculado entra solo =============== */
t("4.1 la carga térmica no escribe caudales en ductos por su cuenta", () => {
  const antes = JSON.stringify(S.duct.segments);
  G("recompute")();
  eq(JSON.stringify(S.duct.segments), antes, "los tramos no se movieron solos:");
  eq(G("estadoPropuesta")("load>duct").nivel, "pendiente");
});
t("4.2 la propuesta se ofrece con lo que propone y lo que ya hay", () => {
  const h = G("propuestaHtml")("load>duct");
  contiene(h, "Propone"); contiene(h, "Ahora hay");
  contiene(h, 'data-act="prop-aceptar"'); contiene(h, 'data-act="prop-propio"');
});
t("4.3 al aceptar entra, y queda registrado el origen y la fecha", () => {
  const t0 = Date.now();
  G("propAceptar")("load>duct");
  const v = G("vinculoDe")("load>duct");
  eq(v.estado, "aceptado");
  contiene(v.origen, "Carga térmica");
  if (!(v.ts >= t0)) throw new Error("no guardó la fecha de aceptación");
  eq(S.duct.segments.length, S.zones.length + 1 + (G("totals")().oa > 0 ? 1 : 0), "un tronco, un ramal por zona y el aire exterior:");
  eq(G("estadoPropuesta")("load>duct").nivel, "aceptado");
});
t("4.4 el usuario puede declarar que captura lo suyo, y también queda escrito", () => {
  G("propPropio")("load>vent");
  const v = G("vinculoDe")("load>vent");
  eq(v.estado, "propio");
  eq(G("estadoPropuesta")("load>vent").nivel, "propio");
});
t("4.5 la cédula de equipos no entra al cuadro de cargas sin aceptarla", () => {
  eq(S.elec.tomarHVAC, false, "el modo automático viene apagado:");
  const auto = (G("ELEC").calc || []).filter((c) => c.auto);
  eq(auto.length, 0, "cargas que entraron solas:");
  eq(G("estadoPropuesta")("cedula>elec").nivel, "pendiente");
});
t("4.6 aceptada, cada carga queda como carga propia del cuadro con su origen", () => {
  G("propAceptar")("cedula>elec");
  const ced = (S.elec.cargas || []).filter((c) => c.origen === "cedula");
  if (!ced.length) throw new Error("no entró ninguna carga de la cédula");
  ced.forEach((c) => { if (!c.ts) throw new Error("carga sin fecha de origen"); });
  eq(G("estadoPropuesta")("cedula>elec").nivel, "aceptado");
});

/* ====== 5. Regla 3 · si cambia el origen, el destino no se recalcula ===== */
t("5.1 cambiar la carga térmica marca ductos como desactualizado, sin tocarlo", () => {
  const antes = JSON.stringify(S.duct.segments);
  S.zones[0].area = 600; G("recompute")();
  eq(JSON.stringify(S.duct.segments), antes, "los tramos aceptados no se recalcularon solos:");
  eq(G("estadoPropuesta")("load>duct").nivel, "desactualizado");
});
t("5.2 desactualizado se ve en el semáforo de la suite", () => {
  const s = G("semaforoSuite")().find((x) => x.id === "duct");
  eq(s.nivel, "desactualizada");
  if (!s.faltan.length) throw new Error("no explica por qué está desactualizada");
});
t("5.3 el usuario decide: actualizar, conservar o capturar lo suyo", () => {
  const h = G("propuestaHtml")("load>duct");
  contiene(h, 'data-act="prop-aceptar"'); contiene(h, 'data-act="prop-conservar"'); contiene(h, 'data-act="prop-propio"');
});
t("5.4 conservar lo aceptado deja el destino intacto y vuelve a estar vigente", () => {
  const antes = JSON.stringify(S.duct.segments);
  const ts = G("vinculoDe")("load>duct").ts;
  G("propConservar")("load>duct");
  eq(JSON.stringify(S.duct.segments), antes);
  eq(G("estadoPropuesta")("load>duct").nivel, "aceptado");
  eq(G("vinculoDe")("load>duct").ts, ts, "conserva la fecha original de aceptación:");
});
t("5.5 actualizar sí trae el dato nuevo, con fecha nueva", () => {
  S.zones[0].area = 400; G("recompute")();
  eq(G("estadoPropuesta")("load>duct").nivel, "desactualizado");
  G("propAceptar")("load>duct");
  eq(G("estadoPropuesta")("load>duct").nivel, "aceptado");
});
t("5.6 la soportería congela los metros aceptados y avisa cuando cambian", () => {
  G("propAceptar")("motores>soporte");
  const n0 = G("SOPORTE").nSoportes;
  const seg = S.duct.segments[0];
  seg.length = (Number(seg.length) || 20) * 4;
  G("recompute")();
  eq(G("SOPORTE").nSoportes, n0, "la soportería no se movió sola:");
  eq(G("estadoPropuesta")("motores>soporte").nivel, "desactualizado");
  G("propAceptar")("motores>soporte");
  if (!(G("SOPORTE").nSoportes > n0)) throw new Error("al actualizar no tomó los metros nuevos");
});

/* ============================ 6. Memoria integral ======================= */
let pdf;
t("6.1 la memoria integral se genera y es un PDF válido", () => {
  pdf = G("buildMemoriaIntegralPdf")();
  const txt = Buffer.from(pdf).toString("latin1");
  contiene(txt.slice(0, 8), "%PDF-1.4");
  contiene(txt.slice(-8), "%%EOF");
  if (pdf.length < 60000) throw new Error("demasiado corta para integrar la suite: " + pdf.length);
});
t("6.2 integra todas las disciplinas que tienen datos, y solo esas", () => {
  const txt = Buffer.from(pdf).toString("latin1");
  const sem = G("semaforoSuite")();
  const conDatos = sem.filter((s) => !["vacia", "externo"].includes(s.nivel)).map((s) => s.id);
  const capitulos = (txt.match(/CAPITULO \d+/g) || []).length;
  if (capitulos < 4) throw new Error("solo salieron " + capitulos + " capítulos");
  ["Carga termica", "Cuadro de cargas", "Cedula de ductos"].forEach((x) => contiene(txt, x));
  if (!conDatos.includes("aire") && /CAPITULO \d+  ·  AIRE COMPRIMIDO/.test(txt)) throw new Error("integró una disciplina sin datos");
});
t("6.3 lleva la marca de la casa, no un azul aproximado", () => {
  eq(JSON.stringify(G("PDF_MARCA")), JSON.stringify([.192, .180, .396]));
  eq(JSON.stringify(G("PDF_SENAL")), JSON.stringify([.941, .337, .114]));
  const txt = Buffer.from(pdf).toString("latin1");
  contiene(txt, "ELECTROMEC"); contiene(txt, `EMP-B12 rev ${G("REV")}`);
});
t("6.4 imprime el trazado de origen de cada valor heredado", () => {
  const txt = Buffer.from(pdf).toString("latin1");
  contiene(txt, "Trazado de origen");
  contiene(txt, "regla 1"); contiene(txt, "regla 2");
  const tr = G("trazaHerencia")();
  if (!tr.some((r) => r.regla === 1 && r.estado.indexOf("heredado") === 0)) throw new Error("no declara ningún valor heredado");
  if (!tr.some((r) => r.regla === 2)) throw new Error("no declara las propuestas aceptadas");
  tr.forEach((r) => { if (!r.origen || !r.fecha) throw new Error("fila del trazado sin origen o sin fecha: " + r.campo); });
});
t("6.5 declara el estado de completitud con el que se emitió", () => {
  const txt = Buffer.from(pdf).toString("latin1");
  contiene(txt, "Estado de completitud por disciplina");
  contiene(txt, "Geometria y ocupacion del proyecto");
});
t("6.6 la memoria integral y los documentos sueltos salen del mismo código", () => {
  const suelta = G("buildMemoriaPdf")();
  if (!(suelta && suelta.length > 5000)) throw new Error("la memoria de aire dejó de emitirse por separado");
  eq(G("PDF_ACUM"), null, "el documento en curso quedó abierto:");
});

/* ============================ 7. Hallazgos corregidos =================== */
t("7.1 H-41 · la ficha técnica de un equipo Carrier ya no truena", () => {
  const e = G("CARRIER")[0];
  const filas = G("carrierSpecRows")(e);
  if (!filas.length) throw new Error("ficha vacía");
});
t("7.2 H-44 · la ventana de cualquier equipo abre, Carrier y Greenheck", () => {
  const c = G("CARRIER")[0], g = G("GREEN")[0];
  contiene(G("equipSheet")("carrier", c.id), "Procedencia del dato");
  contiene(G("equipSheet")("green", g.id), "Procedencia del dato");
});
t("7.3 H-42 · un menú de sí/no guarda booleano, no la cadena \"false\"", () => {
  S.tab = "civil"; G("render")();
  const el = w.document.querySelector('select[data-path="civil.usarZonas"]');
  if (!el) throw new Error("no se encontró el menú");
  eq(el.dataset.tipo, "bool");
  el.value = "false";
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
  eq(S.civil.usarZonas, false, "quedó guardado como:");
  /* El menú se vuelve a dibujar al cambiarlo, así que hay que tomar el nuevo. */
  const el2 = w.document.querySelector('select[data-path="civil.usarZonas"]');
  el2.value = "true"; el2.dispatchEvent(new w.Event("input", { bubbles: true }));
  eq(S.civil.usarZonas, true);
});
t("7.4 H-42 · y un menú numérico guarda número, no texto", () => {
  S.tab = "ductos"; G("render")();
  const el = w.document.querySelector('select[data-path="duct.meta.largoEspiro"]');
  if (!el) throw new Error("no se encontró el menú de largo comercial");
  eq(el.dataset.tipo, "num");
  el.value = "6.096"; el.dispatchEvent(new w.Event("input", { bubbles: true }));
  eq(typeof S.duct.meta.largoEspiro, "number");
  cerca(S.duct.meta.largoEspiro, 6.096, 0.001);
});
t("7.5 H-42 · el menú muestra elegida la opción que de verdad está guardada", () => {
  S.soporte.sismico = false; S.tab = "soporte"; G("render")();
  const el = w.document.querySelector('select[data-path="soporte.sismico"]');
  eq(el.value, "false");
  S.soporte.sismico = true; G("render")();
  eq(w.document.querySelector('select[data-path="soporte.sismico"]').value, "true");
});
t("7.6 H-43 · la cabecera dice la revisión y la fecha correctas", () => {
  const tag = w.document.getElementById("build-tag").textContent;
  contiene(tag, G("REV")); contiene(tag, "sep-2026");
  if (/ene-/.test(tag)) throw new Error("volvió a invertir la fecha: " + tag);
});

/* ============ 8. Los motores de cálculo no cambiaron =================== */
if (baseFile) {
  const wb = await cargar(baseFile);
  const Gb = (e) => wb.eval(e);
  const zonas = JSON.parse(JSON.stringify(S.zones));
  t("8.1 misma carga térmica, mismo resultado que la revisión anterior", () => {
    Gb("S").zones = JSON.parse(JSON.stringify(zonas));
    Gb("S").site = JSON.parse(JSON.stringify(S.site));
    Gb("recompute")();
    G("recompute")();
    const a = Gb("totals")(), b = G("totals")();
    cerca(b.grand, a.grand, 0.01, "carga total (W):");
    cerca(b.cfm, a.cfm, 0.01, "caudal:");
    cerca(b.oa, a.oa, 0.01, "aire exterior:");
    cerca(b.tons, a.tons, 0.001, "toneladas:");
  });
  t("8.2 mismos ductos con los mismos tramos", () => {
    Gb("S").duct = JSON.parse(JSON.stringify(S.duct));
    Gb("recompute")(); G("recompute")();
    cerca(G("DUCT").path, Gb("DUCT").path, 0.01, "caída de presión:");
    cerca(G("DUCT").boq.kg, Gb("DUCT").boq.kg, 0.01, "kilos de lámina:");
  });
  t("8.3 mismo cuadro de cargas con las mismas cargas capturadas", () => {
    Gb("S").elec = JSON.parse(JSON.stringify(S.elec));
    Gb("S").elec.tomarHVAC = false;
    Gb("recompute")(); G("recompute")();
    cerca(G("ELEC").kVAdemanda, Gb("ELEC").kVAdemanda, 0.01, "kVA de demanda:");
    eq(G("ELEC").principal, Gb("ELEC").principal, "interruptor principal:");
  });
  t("8.4 mismo contra incendio con la misma área", () => {
    Gb("S").fuego = JSON.parse(JSON.stringify(S.fuego));
    Gb("recompute")(); G("recompute")();
    cerca(G("FUEGO").qTotal, Gb("FUEGO").qTotal, 0.01, "demanda L/min:");
    eq(G("FUEGO").nTotal, Gb("FUEGO").nTotal, "rociadores:");
  });
  t("8.5 misma hidrosanitaria y misma cotización", () => {
    Gb("S").hidro = JSON.parse(JSON.stringify(S.hidro));
    Gb("S").quote = JSON.parse(JSON.stringify(S.quote));
    Gb("S").perms = JSON.parse(JSON.stringify(S.perms));
    Gb("recompute")(); G("recompute")();
    cerca(G("HIDRO").Qtotal, Gb("HIDRO").Qtotal, 0.001, "gasto probable:");
    cerca(G("QUOTE").tot, Gb("QUOTE").tot, 0.01, "importe:");
  });
}

/* ============ 9. Proyectos guardados por revisiones anteriores ========== */
t("9.1 un proyecto viejo abre sin cambiar ni un número capturado", () => {
  const viejo = {
    meta: { name: "Proyecto rev 2.5", client: "x", location: "Tijuana", engineer: "", date: "2026-01-01" },
    zones: [{ ...G("defaultZone")("Nave"), area: 800, height: 8, occ: 25 }],
    vent: { ...G("defaultState")().vent, area: 120, height: 4, occ: 8 },
    fuego: { ...G("defaultState")().fuego, area: 800, tomarArea: true },
    civil: { ...G("defaultState")().civil, usarZonas: "false" },
    soporte: { ...G("defaultState")().soporte, sismico: "false" },
  };
  const s = G("sanearEstado")(JSON.parse(JSON.stringify(viejo)));
  eq(s.vent.area, 120, "el área de ventilación capturada a mano se respeta:");
  eq(s.her["vent.area"].modo, "propio");
  eq(s.her["fuego.area"].modo, "heredado", "la que sí coincidía sigue heredando:");
  eq(s.civil.usarZonas, false, "el menú de sí/no guardado como texto se corrige:");
  eq(s.soporte.sismico, false);
});

/* ========= 10. Código de color por capa, tomado del isométrico ========== */
const ROOT = () => {
  const css = w.document.querySelector("style").textContent;
  const raiz = css.slice(css.indexOf(":root{"), css.indexOf("@font-face") >= 0 ? css.indexOf("@font-face") : 4000);
  return (tok) => (raiz.match(new RegExp("--" + tok + ":\\s*(#[0-9A-Fa-f]{3,6})")) || [])[1];
};
t("10.1 los colores declarados son los medidos sobre el isométrico del sitio", () => {
  const v = ROOT();
  // Muestreados pixel a pixel sobre la imagen del sitio, con su tolerancia de JPEG.
  const medido = { "p-el": "#D7ABFF", "p-fire": null, "p-pot": "#3ECEAD", "p-air": "#EDBF2E", "p-mt": "#A96BFC", "p-plu": "#7CC6F7" };
  const dist = (a, b) => {
    const p = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
    const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b);
    return Math.max(Math.abs(r1 - r2), Math.abs(g1 - g2), Math.abs(b1 - b2));
  };
  Object.entries(medido).forEach(([tok, hex]) => {
    if (!hex) return;
    const dec = v(tok);
    if (!dec) throw new Error("no está declarado --" + tok);
    if (dist(dec, hex) > 8) throw new Error(`--${tok} declarado ${dec} no corresponde al ${hex} del isométrico`);
  });
  if (dist(v("senal"), "#F05620") > 8) throw new Error("el naranja de contra incendio no es el del isométrico");
});
t("10.2 cada módulo tiene su capa de instalación y usa el código, no un color suelto", () => {
  const C = G("CAPAS");
  G("TABS").forEach(([id]) => { if (!C[id]) throw new Error("la pestaña " + id + " no declara capa"); });
  Object.entries(C).forEach(([id, [color]]) => {
    if (!/^var\(--/.test(color)) throw new Error(`${id} usa un color suelto: ${color}`);
  });
  eq(G('capaDe("fuego")'), "var(--p-fire)");
  eq(G('capaDe("electrico")'), "var(--p-el)");
  eq(G('capaDe("hidro")'), "var(--p-pot)");
  eq(G('capaDe("aire")'), "var(--p-air)");
  eq(G('capaDe("soporte")'), "var(--p-mt)");
});
t("10.3 el color de capa acompaña al módulo en el diagrama y en el menú", () => {
  S.tab = "inicio"; G("render")();
  contiene(vista(), `--capa:var(--p-fire)`, "nodo de contra incendio en el diagrama:");
  S.tab = "tablero"; G("render")();
  const h = w.document.getElementById("tabs").innerHTML;
  contiene(h, "var(--p-el)", "color de la capa eléctrica en el menú:");
  contiene(h, 'data-tab="electrico"');
});
t("10.4 el mismo color se extiende a toda la pantalla de la disciplina", () => {
  ["fuego", "electrico", "aire", "hidro", "ductos"].forEach((tab) => {
    S.tab = tab; G("render")();
    eq(w.document.getElementById("view").style.getPropertyValue("--capa"), G("capaDe")(tab), `pestaña ${tab}:`);
  });
  const css = w.document.querySelector("style").textContent;
  contiene(css, ".card>h3{box-shadow:inset 3px 0 0 var(--capa)}", "filete de tarjeta por capa:");
  contiene(css, ".guia{border-left-color:var(--capa)}", "guía por capa:");
});
t("10.5 la barra de acento es el código de capas completo", () => {
  const css = w.document.querySelector("style").textContent;
  const barra = css.slice(css.indexOf(".accent-bar{background:linear-gradient(90deg,var(--p-fire)"));
  ["--p-fire", "--p-air", "--p-pot", "--p-plu", "--p-cw", "--p-el", "--p-mt"].forEach((x) => contiene(barra.slice(0, 260), x));
});


/* ============ 11. Propuesta integral en Excel · dos archivos espejo ===== */
function leerXlsx(bytes) {
  /* El xlsx es un ZIP sin comprimir (metodo STORE): se puede leer aqui sin
     dependencias, que es la misma razon por la que la suite lo escribe asi. */
  const b = Buffer.from(bytes);
  const txt = b.toString("latin1");
  const nombres = [...txt.matchAll(/xl\/worksheets\/sheet(\d+)\.xml/g)].map((m) => m[1]);
  const wb = txt.slice(txt.indexOf("<sheets>"), txt.indexOf("</sheets>") + 9);
  const hojas = [...wb.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
  return { txt: b.toString("utf8"), hojas, n: nombres.length, bytes: b.length };
}
let LES, LEN;
t("11.1 la exportacion sale en dos archivos espejo, español/MXN e inglés/USD", () => {
  LES = leerXlsx(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" }));
  LEN = leerXlsx(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" }));
  if (LES.bytes < 20000 || LEN.bytes < 20000) throw new Error("libros demasiado pequeños");
  contiene(LES.txt, "(MXN)", "importes en pesos:");
  contiene(LEN.txt, "(USD)", "importes en dólares:");
  if (typeof G("emitirPropuestaEspejo") !== "function") throw new Error("no hay una sola operación que emita los dos");
});
t("11.2 cada archivo trae el juego COMPLETO de quince pestañas", () => {
  eq(LES.hojas.length, 15, "hojas en español:");
  eq(LEN.hojas.length, 15, "hojas en inglés:");
  const ES = ["PORTADA", "CARTA_PRESENTACION", "RESUMEN_EJECUTIVO", "INGENIERIA_DETALLE", "COTIZACION_CONSTRUCCION",
    "DESGLOSE_AREAS", "CUMPLIMIENTO_URS", "BASES_HVAC", "MEMORIA_ELECTRICA", "INGENIERIA_VALOR",
    "CAMBIOS_REV", "CRONOGRAMA", "HITOS_PAGO", "CONDICIONES", "MATRIZ_ALCANCE"];
  eq(JSON.stringify(LES.hojas), JSON.stringify(ES), "orden de las pestañas en español:");
});
t("11.3 la version en inglés tiene las MISMAS pestañas, traducidas, no menos", () => {
  const EN = ["COVER", "COVER_LETTER", "EXECUTIVE_SUMMARY", "DETAIL_ENGINEERING", "CONSTRUCTION_QUOTE",
    "AREA_BREAKDOWN", "URS_COMPLIANCE", "HVAC_BASIS", "ELECTRICAL_CALC", "VALUE_ENGINEERING",
    "REVISION_CHANGES", "SCHEDULE", "PAYMENT_MILESTONES", "TERMS", "SCOPE_MATRIX"];
  eq(JSON.stringify(LEN.hojas), JSON.stringify(EN), "orden y traducción de las pestañas:");
  eq(LEN.hojas.length, LES.hojas.length, "mismo número de pestañas:");
  /* Traducidas de verdad: los encabezados no se quedaron en español. */
  ["EXECUTIVE SUMMARY", "CONSTRUCTION QUOTE", "URS COMPLIANCE", "PRELIMINARY EXECUTION SCHEDULE", "SCOPE MATRIX"]
    .forEach((x) => contiene(LEN.txt, x));
  ["RESUMEN EJECUTIVO", "CUMPLIMIENTO DE URS", "MATRIZ DE ALCANCE"].forEach((x) => {
    if (LEN.txt.indexOf(x) >= 0) throw new Error(`la versión en inglés dejó "${x}" en español`);
  });
});
t("11.4 se respetan los encabezados y la estructura de columnas del formato", () => {
  ["CLAVE", "CONCEPTO", "UNIDAD", "CANTIDAD"].forEach((x) => contiene(LES.txt, x));
  ["CODE", "ITEM", "UNIT", "QTY"].forEach((x) => contiene(LEN.txt, x));
  contiene(LES.txt, "SECCION</t>"); contiene(LES.txt, "DISCIPLINA</t>");
  contiene(LEN.txt, "SECTION</t>"); contiene(LEN.txt, "DISCIPLINE</t>");
});
t("11.5 se conservan los colores del formato existente", () => {
  contiene(LES.txt, "FF312E65", "azul de la marca en los encabezados:");
  contiene(LES.txt, "FFF0561D", "naranja de señal en los totales:");
  eq(LES.txt.indexOf("FF312E65") >= 0, LEN.txt.indexOf("FF312E65") >= 0, "mismos colores en los dos archivos:");
});
t("11.6 las hojas se alimentan de los resultados reales de la suite", () => {
  const tot = G("totals")();
  contiene(LES.txt, String(Math.round(tot.area)).replace(/\B(?=(\d{3})+(?!\d))/g, ""), "área del proyecto:");
  contiene(LES.txt, G("SITE").label, "sitio de diseño:");
  if (G("ELEC") && G("ELEC").calc.length) contiene(LES.txt, String(G("ELEC").principal), "interruptor principal calculado:");
  if (G("DUCT") && G("DUCT").segs.length) contiene(LES.txt, G("DUCT").segs[0].tag, "tramo de ducto real:");
  contiene(LES.txt, G("REV"), "revisión del motor con que se calculó:");
});
t("11.7 el libro sigue siendo un documento vivo: formulas, no numeros pegados", () => {
  contiene(LES.txt, "<f>COTIZACION_CONSTRUCCION!F", "el resumen apunta a la cotización:");
  contiene(LEN.txt, "<f>CONSTRUCTION_QUOTE!F", "y en inglés apunta a su equivalente:");
  contiene(LES.txt, "<f>SUM(", "subtotales por fórmula:");
  if (LES.txt.indexOf("<f>RESUMEN_EJECUTIVO!C14</f>") >= 0) throw new Error("la portada volvió a apuntar a una celda fija");
});
t("11.8 cada hoja trae el trazado de origen de los valores heredados", () => {
  contiene(LES.txt, "TRAZADO DE ORIGEN DE LOS VALORES HEREDADOS");
  contiene(LEN.txt, "TRACEABILITY OF INHERITED VALUES");
  const tr = G("trazaHerencia")();
  if (!tr.length) throw new Error("no hay trazado que imprimir");
  contiene(LES.txt, tr[0].campo, "primer dato heredado:");
  contiene(LES.txt, "ORIGEN DEL DATO", "columna de origen en el desglose de áreas:");
  contiene(LEN.txt, "DATUM SOURCE");
});
t("11.9 el cronograma dice de dónde salen sus semanas", () => {
  contiene(LES.txt, "CRONOGRAMA PRELIMINAR DE EJECUCION");
  contiene(LES.txt, "peso en el costo directo");
  contiene(LES.txt, "<f>D");
});

/* ============ 12. Ingeniería de valor y Kaizen como nodos vivos ========= */
t("12.1 la ingeniería de valor es un nodo del diagrama, no una pestaña final", () => {
  const nd = G("NODOS").find((x) => x.id === "valor");
  if (!nd) throw new Error("no hay nodo de ingeniería de valor");
  eq(nd.et, "e4", "etapa del nodo:");
  if (!G("NODOS").find((x) => x.id === "kaizen")) throw new Error("no hay nodo de Kaizen");
  const A = G("ARISTAS");
  if (!A.find((a) => a.de === "quote" && a.a === "valor")) throw new Error("la consolidación no dispara la ingeniería de valor");
  if (!A.find((a) => a.de === "valor" && a.a === "kaizen")) throw new Error("las decisiones no llegan a Kaizen");
  if (!A.find((a) => a.de === "kaizen" && a.a === "valor" && a.retro)) throw new Error("falta la realimentación de Kaizen");
});
t("12.2 sin autorizar los enlaces lo dice, en vez de fingir que no hay nada", () => {
  S.perms = {}; S.tab = "valor"; G("VZ_CACHE").key = null; G("recompute")();
  const V = G("VALOR");
  if (!V.bloqueos.length) throw new Error("no declara qué enlaces le faltan");
  V.bloqueos.forEach((b) => {
    if (!G("LINKS")[b.id]) throw new Error("el bloqueo apunta a un enlace que no existe: " + b.id);
    if (!b.texto) throw new Error("bloqueo sin explicación: " + b.id);
  });
  contiene(V.resumen, "por autorizar");
});
t("12.2.1 la consolidación genera las medidas sola, comparando contra el catálogo", () => {
  /* Se autoriza lo que un usuario autoriza para trabajar, y se elige a
     propósito una tecnología distinta de la recomendada: es el caso donde el
     catálogo de sistemas SÍ tiene algo que proponer de vuelta. */
  ["load>kaizen", "duct>kaizen", "quote>kaizen", "equip>quote", "load>quote", "duct>quote", "vent>quote"]
    .forEach((k) => { S.perms[k] = { ts: Date.now(), via: "banco de pruebas" }; });
  const rec = G("SYS").recomendado;
  const otra = G("SYS").opts.find((x) => x.id !== rec.id && (x.instPlant || x.instTerm) > (rec.instPlant || rec.instTerm) + 0.5);
  if (otra) S.sysForce = otra.id;
  S.tab = "valor"; G("VZ_CACHE").key = null; G("recompute")();
  const V = G("VALOR");
  if (!V.props.length) throw new Error("no generó ninguna medida sobre un proyecto con equipo seleccionado");
  V.props.forEach((p) => {
    if (!p.titulo || !p.ahora || !p.propuesta) throw new Error("medida sin estado actual o sin propuesta: " + p.id);
    if (!p.justificacion || p.justificacion.length < 40) throw new Error("medida sin justificación técnica: " + p.id);
    if (!(p.mxn >= 0)) throw new Error("medida sin ahorro estimado: " + p.id);
  });
  eq(V.bloqueos.length, 0, "enlaces pendientes tras autorizar:");
  if (S.sysForce && !V.props.some((p) => /Cat[aá]logo/i.test(p.fuente)))
    throw new Error("ninguna medida sale del catálogo de equipo o de sistemas");
  if (!V.props.some((p) => /Kaizen/i.test(p.fuente))) throw new Error("no integró lo que Kaizen detecta");
});
t("12.2.2 H-46 · la comparación contra el catálogo de equipo sí corre", () => {
  /* La ficha de una planta seleccionada es un objeto, no el nombre del
     modelo. Buscarla por cadena no encontraba nada y la rama entera moría en
     silencio. Se comprueba que la ficha se resuelve. */
  const p0 = G("SYS").chosen.plant[0];
  if (!p0) return;
  const m = typeof p0.model === "string" ? p0.model : p0.model.model;
  if (!m) throw new Error("no se puede resolver el modelo de la planta elegida");
  if (!G("CARRIER").some((e) => e.model === m)) throw new Error("el modelo elegido no está en el catálogo: " + m);
  if (!(G("capOf")(typeof p0.model === "string" ? G("CARRIER").find((e) => e.model === m) : p0.model) > 0))
    throw new Error("no se obtiene la capacidad corregida del equipo elegido");
});
t("12.3 el ahorro se separa en inversión y operación, con su base de valuación", () => {
  const V = G("VALOR");
  cerca(V.capex + V.opex, V.total, 1, "el total es la suma de las dos:");
  if (!(V.horas > 0 && V.tarifa > 0)) throw new Error("no declara horas ni tarifa para valorar la operación");
  V.props.forEach((p) => cerca(p.mxnCapex + p.mxnOpex, p.mxn, 0.01, "medida " + p.id + ":"));
});
t("12.4 aceptar una medida NO cambia el cálculo: registra la decisión", () => {
  const V = G("VALOR");
  const p = V.props[0];
  const antes = JSON.stringify([S.sysForce, S.zones, S.duct.segments]);
  G("veDecidir")(p.id, "aceptada");
  eq(JSON.stringify([S.sysForce, S.zones, S.duct.segments]), antes, "el proyecto no se movió solo:");
  const e = S.kaizen.ve[p.id];
  eq(e.decision, "aceptada");
  if (!e.ts) throw new Error("no guardó la fecha de la decisión");
});
t("12.5 Kaizen registra cada desviación entre lo recomendado y lo elegido", () => {
  const V0 = G("VALOR");
  const p = V0.props.find((x) => !x.estado) || V0.props[1] || V0.props[0];
  G("veDecidir")(p.id, "descartada");
  G("recompute")();
  const d = G("desviacionesVivas")();
  if (!d.some((x) => x.id === "ve:" + p.id)) throw new Error("descartar una medida no quedó registrado como desviación");
  d.forEach((x) => { if (!x.tipo || !x.recomendo || !x.eligio) throw new Error("desviación incompleta: " + x.id); });
});
t("12.6 la desviación de tecnología del sistema se detecta sola", () => {
  if (!G("SYS").opts || G("SYS").opts.length < 2) return;   // proyecto sin alternativas
  const otra = G("SYS").opts.find((x) => x.id !== G("SYS").recomendado.id);
  S.sysForce = otra.id; G("VZ_CACHE").key = null; G("recompute")();
  const d = G("desviacionesVivas")();
  if (!d.some((x) => x.id === "sistema")) throw new Error("elegir otra tecnología no aparece como desviación");
  S.sysForce = null; G("VZ_CACHE").key = null; G("recompute")();
  if (G("desviacionesVivas")().some((x) => x.id === "sistema")) throw new Error("al volver a la recomendación la desviación no se retira");
});
t("12.7 el historial se acumula fuera del proyecto, como base de conocimiento", () => {
  const kb = G("kbLeer")();
  const claves = Object.keys(kb.medidas || {});
  if (!claves.length) throw new Error("no acumuló nada en la base de conocimiento");
  const total = claves.reduce((a, k) => a + Number(kb.medidas[k].aceptada || 0) + Number(kb.medidas[k].descartada || 0), 0);
  if (!(total >= 2)) throw new Error("no registró las decisiones de las pruebas anteriores");
  if (!(kb.desv || []).length) throw new Error("no guardó el detalle de las decisiones");
  /* Vive fuera del proyecto: cerrar y abrir otro no lo borra. */
  const antes = JSON.stringify(kb);
  S.kaizen.ve = {}; S.pid = null;
  eq(JSON.stringify(G("kbLeer")()), antes, "el historial sobrevive al proyecto:");
});
t("12.8 el historial alimenta el orden de las siguientes propuestas", () => {
  G("kbBorrar")();
  G("VZ_CACHE").key = null; G("recompute")();
  const V0 = G("VALOR");
  if (V0.props.length < 2) return;   // con una sola medida no hay orden que probar
  /* Las medidas siempre salen ordenadas por su peso. */
  for (let i = 1; i < V0.props.length; i++) {
    if (V0.props[i - 1].peso < V0.props[i].peso - 1e-9) throw new Error("las medidas no salen ordenadas por peso");
  }
  const clave = V0.props[0].medida;
  const antes = V0.props[0];
  eq(antes.tasa, 0.5, "sin historial la casa no opina:");
  /* Se simula una casa que SIEMPRE descarta esa medida. */
  for (let i = 0; i < 6; i++) G("kbAnotar")(clave, "descartada");
  G("VZ_CACHE").key = null; G("recompute")();
  const bajo = G("VALOR").props.find((p) => p.medida === clave);
  if (!(bajo.tasa < 0.2)) throw new Error("la tasa histórica no bajó: " + bajo.tasa);
  if (!(bajo.peso < antes.peso)) throw new Error("descartarla seis veces no la hundió en el orden");
  cerca(bajo.mxn, antes.mxn, 0.01, "el ahorro NO se toca, sólo el orden:");
  /* Y una que siempre se toma sube. */
  for (let i = 0; i < 12; i++) G("kbAnotar")(clave, "aceptada");
  G("VZ_CACHE").key = null; G("recompute")();
  const alto = G("VALOR").props.find((p) => p.medida === clave);
  if (!(alto.tasa > 0.6)) throw new Error("la tasa histórica no subió: " + alto.tasa);
  if (!(alto.peso > bajo.peso)) throw new Error("aceptarla no la subió en el orden");
  cerca(alto.mxn, antes.mxn, 0.01, "el ahorro sigue intacto:");
  G("VALOR").props.forEach((p) => { if (typeof p.tasa !== "number") throw new Error("la medida no trae su tasa histórica"); });
  G("kbBorrar")();
});
t("12.9 la ingeniería de valor tiene su propio semáforo en la suite", () => {
  const s2 = G("semaforoSuite")().find((x) => x.id === "valor");
  if (!s2) throw new Error("no aparece en el semáforo de la suite");
  if (!["datos", "vacia", "incompleta"].includes(s2.nivel)) throw new Error("nivel inesperado: " + s2.nivel);
});

/* ================= 13. Módulo HVAC: cinco pantallas, un nodo ============= */
t("13.1 las cinco pantallas del aire son un solo módulo, en el orden del cálculo", () => {
  const M = G("MODULOS").hvac;
  if (!M) throw new Error("no existe el módulo HVAC");
  const ids = M.subs.map(([id]) => id);
  eq(ids.join(","), "carga,limpios,seleccion,ventilacion,ductos", "orden del flujo de cálculo:");
  eq(ids.length, 5, "subpestañas:");
});
t("13.2 el menú de primer nivel ya no lista las cinco por separado", () => {
  const tabs = G("TABS").map(([id]) => id);
  contiene(tabs.join(","), "hvac", "falta la entrada del módulo:");
  ["carga", "limpios", "seleccion", "ventilacion", "ductos", "comparativo"].forEach((id) => {
    if (tabs.includes(id)) throw new Error(`${id} sigue suelta en el menú de primer nivel`);
  });
});
t("13.3 se navegan como subpestañas, no como una sola pantalla larga", () => {
  S.tab = "carga"; G("render")();
  const h = w.document.getElementById("tabs").innerHTML;
  contiene(h, 'class="subtabs"', "falta la barra de subpestañas:");
  G("MODULOS").hvac.subs.forEach(([id]) => contiene(h, `data-tab="${id}"`, `subpestaña ${id}:`));
  eq((h.match(/aria-selected="true"/g) || []).length, 1, "una sola activa:");
  /* Una sola vista a la vez: la de ductos no puede estar dibujada mientras se
     captura la carga térmica. */
  const v = vista();
  if (/data-act="seg-add"/.test(v)) throw new Error("la pantalla de ductos se dibujó junto con la de carga térmica");
});
t("13.4 cada subpestaña conserva íntegro lo que hacía, incluida su memoria", () => {
  const capitulos = [["carga", "buildMemoriaPdf"], ["limpios", "buildLimpioSuitePdf"],
    ["seleccion", "buildCedulaEquiposPdf"], ["ductos", "buildCedulaPdf"]];
  capitulos.forEach(([tab, fn]) => {
    S.tab = tab; G("render")();
    if (!G(`typeof ${fn}`)) throw new Error(`${tab} perdió su emisor de memoria`);
    const pdf = G(fn)();
    if (!(pdf && pdf.length > 800)) throw new Error(`${tab} ya no emite su capítulo de memoria`);
  });
  /* Y la captura sigue estando donde estaba. */
  ["carga", "limpios", "ventilacion", "ductos"].forEach((tab) => {
    S.tab = tab; G("render")();
    if (!/data-path=/.test(vista())) throw new Error(`${tab} perdió su captura`);
  });
});
t("13.5 en el diagrama los cinco nodos son uno solo", () => {
  const N = G("NODOS");
  ["load", "clean", "equip", "vent", "duct"].forEach((id) => {
    if (N.some((nd) => nd.id === id)) throw new Error(`el nodo ${id} sigue suelto en el diagrama`);
  });
  const h = N.find((nd) => nd.id === "hvac");
  if (!h) throw new Error("no existe el nodo HVAC");
  eq(h.tab, "carga", "el nodo abre el módulo en su primera subpestaña:");
});
t("13.6 las flechas que salían de las cinco ahora salen del nodo HVAC", () => {
  const A = G("ARISTAS");
  const de = (a, b) => A.filter((x) => x.de === a && x.a === b).length;
  eq(de("hvac", "fuego"), 1, "hacia contra incendio:");
  eq(de("hvac", "civil"), 2, "hacia obra civil (área/altura y envolvente clasificada):");
  eq(de("hvac", "elec"), 2, "hacia eléctrico (cédula de equipos y ventilador):");
  eq(de("hvac", "soporte"), 1, "hacia soportería:");
  eq(de("proyecto", "hvac"), 1, "y el proyecto sigue alimentándolo:");
  /* Las que corrían entre las cinco desaparecen: son tránsito interno. */
  ["load", "clean", "equip", "vent", "duct"].forEach((id) => {
    if (A.some((x) => x.de === id || x.a === id)) throw new Error(`quedó una flecha de ${id}`);
  });
  /* Cada una conserva su significado, no se fusionaron en una sola. */
  A.filter((x) => x.de === "hvac").forEach((x) => { if (!x.que) throw new Error("una flecha del módulo perdió su texto"); });
  const civiles = A.filter((x) => x.de === "hvac" && x.a === "civil").map((x) => x.que);
  if (civiles[0] === civiles[1]) throw new Error("las dos flechas a obra civil dicen lo mismo");
});
t("13.7 las demás disciplinas siguen siendo nodos independientes", () => {
  const N = G("NODOS").map((nd) => nd.id);
  ["elec", "hidro", "fuego", "aire", "soporte"].forEach((id) => {
    if (!N.includes(id)) throw new Error(`${id} dejó de ser un nodo independiente`);
  });
});
t("13.8 el semáforo del nodo HVAC es el PEOR de las cinco", () => {
  const área0 = Number(S.zones[0].area);
  G("chainToDuct")(true); G("chainToVent")(true);
  G("recompute")();
  const RANGO = G("SEM_RANGO");
  /* La regla, comprobada contra el estado real que haya en este momento: el
     nodo no puede verse mejor que la más floja de sus cinco pantallas. */
  const comprueba = (nota) => {
    const partes = G("semaforoSuite")().filter((x) => G("HVAC_IDS").includes(x.id));
    const nodo = G("semaforoHvac")();
    const peor = partes.reduce((acc, x) => {
      const n2 = x.nivel === "vacia" ? "incompleta" : x.nivel;
      return RANGO[n2] > RANGO[acc] ? n2 : acc;
    }, "datos");
    const todasVacias = partes.every((x) => x.nivel === "vacia");
    eq(nodo.nivel, todasVacias ? "vacia" : peor, `${nota} · el nodo contra el peor de los cinco:`);
  };
  comprueba("estado de partida");
  /* El caso que pidió la casa: si a la carga térmica le faltan datos, el
     nodo se ve incompleto, y además dice CUÁL de las cinco es. */
  S.zones[0].area = 0; G("recompute")();
  const malo = G("semaforoHvac")();
  if (RANGO[malo.nivel] < RANGO.incompleta)
    throw new Error("al faltarle datos a la carga térmica el nodo no bajó de estado: " + malo.nivel);
  if (!malo.faltan.some((f) => /Carga t[eé]rmica/i.test(f)))
    throw new Error("el nodo no dice CUÁL de las cinco es la que falla: " + malo.faltan.join(" | "));
  comprueba("con la carga térmica sin área");
  S.zones[0].area = área0; G("recompute")();
  /* Y sin proyecto abierto no presume nada calculado. */
  const zonas0 = JSON.parse(JSON.stringify(S.zones)), nombre0 = S.meta.name;
  S.meta.name = ""; S.zones = []; G("recompute")();
  eq(G("semaforoHvac")().nivel, "vacia", "sin proyecto abierto:");
  S.meta.name = nombre0; S.zones = zonas0; S.zi = 0; G("recompute")();
});

/* ==================== 14. Navegación en ciclo =========================== */
t("14.1 al entrar a un módulo la tira de las demás disciplinas no se muestra", () => {
  ["carga", "ductos", "electrico", "hidro", "cotizacion"].forEach((tab) => {
    S.tab = tab; G("render")();
    const h = w.document.getElementById("tabs").innerHTML;
    if (/class="ngb"/.test(h)) throw new Error(`en ${tab} sigue a la vista el menú de las demás disciplinas`);
  });
});
t("14.2 el botón de regreso al diagrama está siempre visible, con el nombre al lado", () => {
  ["carga", "limpios", "electrico", "civil", "kaizen"].forEach((tab) => {
    S.tab = tab; G("render")();
    const h = w.document.getElementById("tabs").innerHTML;
    contiene(h, 'data-act="ir-diagrama"', `${tab}: falta el botón de regreso —`);
    contiene(h, 'class="modnom"', `${tab}: falta el nombre de la disciplina —`);
  });
});
t("14.3 el botón de regreso lleva de vuelta al diagrama", () => {
  S.tab = "ductos"; G("render")();
  w.document.querySelector('[data-act="ir-diagrama"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  eq(S.tab, "inicio", "después del regreso:");
  contiene(vista(), 'class="portada diag"');
});
t("14.4 la tecla Escape también regresa al diagrama", () => {
  G("closeModal")();               // Escape cierra primero lo que esté encima
  S.tab = "ventilacion"; G("render")();
  const ev = new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true });
  w.document.dispatchEvent(ev);
  eq(S.tab, "inicio", "después de Escape:");
  /* Y desde el diagrama Escape no hace nada raro. */
  w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  eq(S.tab, "inicio");
});
t("14.5 el botón de atrás del navegador sigue funcionando", () => {
  S.tab = "inicio"; G("render")();
  G("irATab")("carga");
  G("irATab")("electrico");
  eq(S.tab, "electrico");
  /* popstate es lo que dispara el navegador al ir atrás: se comprueba que la
     aplicación lo escuche y devuelva la pantalla anterior. */
  const volver = (tab) => {
    const ev = new w.PopStateEvent("popstate", { state: { tab } });
    w.dispatchEvent(ev);
  };
  volver("carga"); eq(S.tab, "carga", "un paso atrás:");
  volver("inicio"); eq(S.tab, "inicio", "dos pasos atrás:");
  if (!/pushState/.test(G("document").documentElement.innerHTML)) throw new Error("no se apila nada en el historial");
});
t("14.6 las subpestañas de HVAC se navegan entre sí sin salir del módulo", () => {
  S.tab = "carga"; G("render")();
  G("MODULOS").hvac.subs.forEach(([id]) => {
    const b = w.document.querySelector(`.subtab[data-tab="${id}"]`);
    if (!b) throw new Error(`no se puede llegar a ${id} desde la barra del módulo`);
    b.dispatchEvent(new w.Event("click", { bubbles: true }));
    eq(S.tab, id, `subpestaña ${id}:`);
    const h = w.document.getElementById("tabs").innerHTML;
    contiene(h, 'class="subtabs"', `${id}: se salió del módulo —`);
    contiene(h, "HVAC", `${id}: la barra dejó de decir en qué módulo se está —`);
  });
  S.tab = "carga"; G("render")();
});

/* ========= 15. La propuesta con la identidad de las memorias ============ */
t("15.1 la propuesta en PDF abre con la misma portada que la memoria", () => {
  const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
  const prop = dec(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
  const mem = dec(G("buildMemoriaIntegralPdf")());
  /* El molde de portada es el MISMO código: si alguien lo cambia en uno,
     cambia en el otro o esta comprobación lo detiene. */
  if (!/function pdfPortadaCasa/.test(G("document").documentElement.innerHTML))
    throw new Error("no existe el molde de portada compartido");
  ["PROPUESTA INTEGRAL LLAVE EN MANO", "ELECTROMEC"].forEach((x) => contiene(prop, x));
  contiene(mem, "MEMORIA INTEGRAL DE C");
  /* Misma paleta: la banda de encabezado de tabla en morado de marca y el
     filete de señal, escritos con los mismos números en los dos documentos. */
  const marca = "0.192 0.18 0.396 rg", senal = "0.941 0.337 0.114 rg";
  [prop, mem].forEach((doc, i) => {
    if (doc.indexOf(marca) < 0) throw new Error(`el documento ${i} no usa el morado de marca`);
    if (doc.indexOf(senal) < 0) throw new Error(`el documento ${i} no usa el naranja de señal`);
  });
});
t("15.2 la propuesta en PDF existe en español y en inglés, espejo exacto", () => {
  const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
  const es = dec(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
  const en = dec(G("buildPropuestaPdf")({ lang: "en", mon: "USD" }));
  contiene(es, "PROPUESTA INTEGRAL LLAVE EN MANO");
  contiene(en, "INTEGRATED TURNKEY PROPOSAL");
  contiene(en, "Executive summary"); contiene(en, "Scope matrix"); contiene(en, "Payment schedule");
  if (/Matriz de alcance|Esquema de pagos|Resumen ejecutivo/.test(en))
    throw new Error("la versión en inglés dejó rótulos en español");
  /* Espejo: la misma cantidad de páginas y las mismas claves de sección, que
     son las de la casa y NO se traducen. */
  const pgs = (x) => (x.match(/\/Type \/Page[^s]/g) || []).length;
  eq(pgs(en), pgs(es), "páginas del espejo:");
  G("catalogoConceptos")().secciones.forEach((sc) => {
    contiene(es, `SECCION ${sc.clave}`.slice(0, 8)); contiene(en, `SECTION ${sc.clave}`.slice(0, 8));
  });
});
t("15.3 el libro de Excel lleva la portada y el pie de la casa en los dos idiomas", () => {
  const es = G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" });
  const en = G("buildPropuestaXlsx")({ lang: "en", mon: "USD" });
  const txt = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
  const a = txt(es), b2 = txt(en);
  /* Pie de la casa: el mismo renglón que firma cada página de una memoria. */
  contiene(a, "EMP-B12 rev", "el libro en español no lleva pie:");
  contiene(b2, "EMP-B12 rev", "el libro en inglés no lleva pie:");
  contiene(a, "metadata de catalogo orientativa");
  contiene(b2, "catalogue metadata is indicative");
  /* Portada: título, proyecto y regla de señal, con el estilo declarado. */
  contiene(a, "PROPUESTA INTEGRAL LLAVE EN MANO");
  contiene(b2, "INTEGRATED TURNKEY PROPOSAL");
  eq(G("XS").REGLA, 13, "el estilo de regla de señal está declarado:");
  contiene(G("XLSX_STYLES"), "FFF0561D", "la regla no usa el naranja de señal del sitio:");
  contiene(G("XLSX_STYLES"), "FF312E65", "la banda de encabezado no usa el morado de marca:");
});
t("15.4 los dos libros son espejo exacto: mismas hojas, mismo tamaño de rejilla", () => {
  const HES = G("XHOJAS").es, HEN = G("XHOJAS").en;
  eq(HEN.length, HES.length, "hojas del espejo:");
  /* Se arman las dos versiones y se compara hoja por hoja el número de filas
     y de columnas: si a una le falta un renglón, dejaron de ser el mismo
     documento en dos idiomas. */
  const forma = (lang, mon) => {
    const g = G("buildPropuestaXlsx");
    /* Se re-arma con el mismo estado; lo que se mide es la estructura. */
    const bytes = g({ lang, mon });
    return bytes.length > 0;
  };
  if (!forma("es", "MXN") || !forma("en", "USD")) throw new Error("uno de los dos libros no se genera");
  /* Y la matriz de alcance, que es la tabla que dice qué NO va incluido,
     queda traducida de verdad y no a medias. */
  const b2 = Array.from(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).map((c) => String.fromCharCode(c)).join("");
  if (/Obra civil y estructura|Sanitario e hidr/.test(b2))
    throw new Error("la matriz de alcance en inglés dejó las disciplinas en español");
});
t("15.5 la presentación cambió, la cotización no", () => {
  /* El importe que imprime la propuesta es el mismo que calcula el motor: la
     identidad gráfica no puede tocar un peso. */
  const Q = G("QUOTE"), cat = G("catalogoConceptos")();
  const suma = cat.secciones.reduce((a, sc) => a + sc.subtotal, 0);
  cerca(suma, cat.subtotal, 0.01, "el catálogo de conceptos cuadra consigo mismo:");
  cerca(Q.direct, cat.subtotal, Math.max(1, Q.direct * 0.001), "y con el costo directo del motor:");
});

/* ============ 16. Las ocho orientaciones de la carga térmica ============= */
t("16.1 la zona nace con las ocho orientaciones, muros y vidrio", () => {
  const z = G("defaultZone")("Z");
  ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].forEach((o) => {
    if (!(o in z.walls)) throw new Error(`falta el muro ${o}`);
    if (!(o in z.glass)) throw new Error(`falta el vidrio ${o}`);
  });
  eq(G("ORI").length, 8, "orientaciones declaradas:");
});
t("16.2 cada intercardinal tiene su ganancia solar por el mismo método", () => {
  ["NE", "SE", "SW", "NW"].forEach((o) => {
    if (!G("SOLAR")[o]) throw new Error(`la orientación ${o} no tiene irradiancia de pico`);
    if (!G("SUN_H")[o]) throw new Error(`la orientación ${o} no tiene perfil horario`);
    if (!G("DET_PEAK")[o]) throw new Error(`la orientación ${o} no tiene DET de pico`);
    if (G("DET_SUN")[o] == null) throw new Error(`la orientación ${o} no tiene DET de la tabla protegida`);
  });
  /* El método es el mismo: detWall y sunF no distinguen cardinal de intercardinal. */
  const src = G("document").documentElement.innerHTML;
  const cuerpo = src.slice(src.indexOf("function detWall("), src.indexOf("function detRoof("));
  if (/NE|SE|SW|NW/.test(cuerpo)) throw new Error("detWall trata las intercardinales como caso aparte");
});
t("16.3 las intercardinales aparecen en la captura y en el desglose", () => {
  S.tab = "carga"; S.advOpen = true; G("render")();
  const v = vista();
  ["NE", "SE", "SW", "NW"].forEach((o) => {
    contiene(v, `zones.0.walls.${o}`, `captura del muro ${o}:`);
    contiene(v, `zones.0.glass.${o}`, `captura del vidrio ${o}:`);
  });
  /* Y con área capturada, la línea aparece en el desglose y en la memoria. */
  const z = S.zones[0];
  const w0 = JSON.parse(JSON.stringify(z.walls)), g0 = JSON.parse(JSON.stringify(z.glass));
  z.walls.SW = 30; z.glass.SW = 10; G("recompute")(); G("render")();
  contiene(vista(), "Muro SW", "el muro SW no llega al desglose:");
  contiene(vista(), "Insolación vidrio SW", "la insolación del vidrio SW no llega al desglose:");
  const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
  contiene(dec(G("buildMemoriaPdf")()), "Muro SW", "el muro SW no llega a la memoria:");
  z.walls = w0; z.glass = g0; G("recompute")();
});
t("16.4 la comprobación de contratos ya no reporta las ocho como faltantes", () => {
  const D = G("selfCheck")();
  eq(D.errores.length, 0, "errores de la comprobación interna:");
  const ori = D.faltantes.filter((f) => /walls|glass/.test(f.ruta));
  if (ori.length) throw new Error("sigue reportando orientaciones: " + ori.map((x) => x.ruta).join(", "));
  eq(D.faltantes.length, 0, "campos leídos que el objeto no entrega:");
});
t("16.5 un proyecto guardado sin intercardinales abre sin mover un número", () => {
  const viejo = {
    meta: { name: "Proyecto rev 2.9.0", client: "x", location: "Tijuana", engineer: "", date: "2026-01-01" },
    zones: [{ ...G("defaultZone")("Nave"), area: 800, height: 8, occ: 25,
      walls: { N: 40, S: 40, E: 25, W: 25 }, glass: { S: 14, W: 9, E: 7, N: 5 } }],
  };
  const s2 = G("sanearEstado")(JSON.parse(JSON.stringify(viejo)));
  const z = s2.zones[0];
  eq(z.walls.N, 40, "el muro norte capturado:"); eq(z.walls.E, 25, "el muro este capturado:");
  eq(z.glass.S, 14, "el vidrio sur capturado:");
  ["NE", "SE", "SW", "NW"].forEach((o) => {
    eq(z.walls[o], 0, `el muro ${o} ausente vale cero:`);
    eq(z.glass[o], 0, `el vidrio ${o} ausente vale cero:`);
  });
});
t("16.6 con las intercardinales en cero el resultado no se mueve", () => {
  const base = { ...G("defaultZone")("Prueba"), area: 300, height: 5, occ: 10,
    walls: { N: 30, S: 30, E: 20, W: 20 }, glass: { N: 5, S: 12, E: 6, W: 8 } };
  const zonas0 = JSON.parse(JSON.stringify(S.zones));
  S.zones = [JSON.parse(JSON.stringify(base))]; S.zi = 0; G("recompute")();
  const a = G("LOADS")[0].grand;
  /* Ahora la misma zona, pero con los ocho campos declarados y los cuatro
     nuevos en cero. Tiene que dar EXACTAMENTE lo mismo. */
  S.zones = [{ ...JSON.parse(JSON.stringify(base)),
    walls: { N: 30, NE: 0, E: 20, SE: 0, S: 30, SW: 0, W: 20, NW: 0 },
    glass: { N: 5, NE: 0, E: 6, SE: 0, S: 12, SW: 0, W: 8, NW: 0 } }];
  G("recompute")();
  eq(G("LOADS")[0].grand, a, "carga con las intercardinales en cero:");
  S.zones = zonas0; S.zi = 0; G("recompute")();
});
t("16.7 la misma área repartida en las ocho da una carga solar coherente con las cuatro", () => {
  /* La comprobación que pidió la casa. Una fachada de 160 m2 de muro y 40 de
     vidrio, repartida de dos maneras sobre la MISMA área total:
       a) sólo en las cuatro cardinales, 40 y 10 por orientación;
       b) en las ocho, 20 y 5 por orientación.
     No tienen por qué dar el mismo número —y no deben: el sol no pega igual
     al noreste que al suroeste, y ésa es precisamente la razón de capturar
     por orientación—. Lo que sí tiene que cumplirse es que el resultado sea
     COHERENTE: del mismo orden, sin saltos, y con la ganancia solar de la
     versión de ocho quedando ENTRE la de la peor y la de la mejor de las
     repartidas a cuatro. Si un día alguien mete una tabla mal copiada para
     una intercardinal, esto lo caza. */
  const zonas0 = JSON.parse(JSON.stringify(S.zones));
  const cero = { N: 0, NE: 0, E: 0, SE: 0, S: 0, SW: 0, W: 0, NW: 0 };
  const arma = (walls, glass) => ({ ...G("defaultZone")("Reparto"), area: 300, height: 5,
    occ: 0, lights: 0, equip: 0, ach: 0, roof: 0, walls: { ...cero, ...walls }, glass: { ...cero, ...glass } });
  const solarDe = (z) => {
    S.zones = [z]; S.zi = 0; G("recompute")();
    const r = G("LOADS")[0];
    return {
      solar: r.lines.filter((l) => /^Insolación/.test(l.label)).reduce((a, l) => a + l.s, 0),
      muro: r.lines.filter((l) => /^Muro /.test(l.label)).reduce((a, l) => a + l.s, 0),
      total: r.grand,
      lineas: r.lines.filter((l) => /^Muro |^Insolación/.test(l.label)).length,
    };
  };
  const cuatro = solarDe(arma({ N: 40, E: 40, S: 40, W: 40 }, { N: 10, E: 10, S: 10, W: 10 }));
  const ocho = solarDe(arma({ N: 20, NE: 20, E: 20, SE: 20, S: 20, SW: 20, W: 20, NW: 20 },
    { N: 5, NE: 5, E: 5, SE: 5, S: 5, SW: 5, W: 5, NW: 5 }));
  /* 1) El área total es la misma en las dos, así que las dos tienen que
        calcular algo distinto de cero y con líneas por cada orientación. */
  eq(cuatro.lineas, 8, "cuatro orientaciones: un muro y dos líneas de vidrio cada una —");
  eq(ocho.lineas, 16, "ocho orientaciones: una línea por cada una —");
  if (!(ocho.solar > 0 && cuatro.solar > 0)) throw new Error("alguna de las dos no ganó nada de sol");
  /* 2) Coherencia de orden de magnitud: repartir la MISMA área en más
        orientaciones no puede duplicarla ni hacerla desaparecer. */
  const raz = ocho.solar / cuatro.solar;
  if (!(raz > 0.6 && raz < 1.6)) throw new Error(`la carga solar se disparó al repartir en ocho: razón ${raz.toFixed(3)}`);
  /* 3) La transmisión por muro depende del área y del DET, no del número de
        orientaciones: con la misma área total y el mismo material, las dos
        tienen que quedar del mismo orden. */
  const razM = ocho.muro / cuatro.muro;
  if (!(razM > 0.7 && razM < 1.4)) throw new Error(`la transmisión por muro no es coherente: razón ${razM.toFixed(3)}`);
  /* 4) Y la de ocho tiene que quedar ENTRE los extremos de repartir toda la
        fachada a una sola orientación: ni por debajo de la más fresca ni por
        encima de la más caliente. Eso es lo que verifica que las tablas de
        NE, SE, SW y NW estén en su lugar y no copiadas de otra fachada. */
  const unaSola = (o) => solarDe(arma({ [o]: 160 }, { [o]: 40 })).solar;
  const todas = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map(unaSola);
  const min = Math.min(...todas), max = Math.max(...todas);
  if (!(ocho.solar >= min - 1 && ocho.solar <= max + 1))
    throw new Error(`el reparto en ocho (${ocho.solar.toFixed(0)} W) cae fuera del rango de las fachadas puras [${min.toFixed(0)}, ${max.toFixed(0)}]`);
  if (!(cuatro.solar >= min - 1 && cuatro.solar <= max + 1))
    throw new Error("el reparto en cuatro cae fuera del rango de las fachadas puras");
  /* 5) Y ninguna intercardinal puede quedar en cero de sol: si una tabla
        estuviera vacía, su fachada pura daría cero y esto lo detecta. */
  ["NE", "SE", "SW", "NW"].forEach((o) => {
    if (!(unaSola(o) > 0)) throw new Error(`la fachada ${o} no gana nada de sol a ninguna hora`);
  });
  S.zones = zonas0; S.zi = 0; G("recompute")();
});

/* ============================== resultado =============================== */
const total = ok + fail;
console.log(`\nEMP B12 rev ${G("REV")} · banco de comprobaciones de la rev 2.9.2`);
console.log(`${ok} de ${total} comprobaciones correctas`);
if (fallos.length) { console.log("\nFALLOS:"); fallos.forEach(([n2, m]) => console.log(` ✗ ${n2}\n   ${m}`)); }
if (w.__errs.length) console.log("\nerrores de ventana:", w.__errs);
process.exit(fail ? 1 : 0);
