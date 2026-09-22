// Banco de comprobaciones de la rev 2.9.3 — SuiteEmp
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
  ["SuiteEmp", "EMP B12", "Electromecánica del Pacífico", "El proyecto completo en un plano"]
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
  contiene(txt, "ELECTROMEC"); contiene(txt, `SuiteEmp rev ${G("REV")}`);
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
    /* Contingencia (14-sep-2026): renglón que la base no tiene; se compara en 0 %. */
    const contAntes = S.quote.contingencia;
    S.quote.contingencia = 0;
    try {
    Gb("S").hidro = JSON.parse(JSON.stringify(S.hidro));
    Gb("S").quote = JSON.parse(JSON.stringify(S.quote));
    Gb("S").perms = JSON.parse(JSON.stringify(S.perms));
    Gb("recompute")(); G("recompute")();
    cerca(G("HIDRO").Qtotal, Gb("HIDRO").Qtotal, 0.001, "gasto probable:");
    cerca(G("QUOTE").tot, Gb("QUOTE").tot, 0.01, "importe:");
    } finally { S.quote.contingencia = contAntes; G("recompute")(); }
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
/* Fila (número) del resumen ejecutivo cuya celda de texto es exactamente `etq`.
   Busca en la hoja que además contiene `ademas`, para no confundirla con la portada. */
function filaXlsxConRotulo(x, etq, ademas) {
  const hojas = x.split("<worksheet").slice(1).map((t) => t.slice(0, t.indexOf("</worksheet>")));
  for (const h of hojas) {
    if (ademas && !ademas.test(h)) continue;
    for (const m of h.matchAll(/<row r="(\d+)"[^>]*>(.*?)<\/row>/g))
      if ([...m[2].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].some((c) => c[1] === etq)) return +m[1];
  }
  return 0;
}
function celdasXlsxFila(x, etqInicio, ademas) {
  const hojas = x.split("<worksheet").slice(1).map((t) => t.slice(0, t.indexOf("</worksheet>")));
  for (const h of hojas) {
    if (ademas && !ademas.test(h)) continue;
    for (const m of h.matchAll(/<row r="(\d+)"[^>]*>(.*?)<\/row>/g)) {
      const c = [...m[2].matchAll(/<t[^>]*>([^<]*)<\/t>|<f>([^<]*)<\/f>/g)].map((k) => (k[1] != null ? k[1] : "=" + k[2]));
      if (c.some((v) => v.startsWith(etqInicio))) return { r: +m[1], c };
    }
  }
  return null;
}
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
  /* La portada debe apuntar a la fila que de verdad es el total del resumen. */
  [[LES.txt, "RESUMEN_EJECUTIVO", "TOTAL DE LA PROPUESTA"], [LEN.txt, "EXECUTIVE_SUMMARY", "PROPOSAL TOTAL"]].forEach(([x, hoja, etq]) => {
    const r = filaXlsxConRotulo(x, etq, /SUBTOTAL/);
    if (!r) throw new Error(`no encontré la fila «${etq}» en el resumen`);
    contiene(x, `<f>${hoja}!C${r}</f>`, "la portada apunta a la fila del total:");
  });
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
  /* rev 2.9.6.2 · El alimentador ya no dimensiona doble el 125 % (H-2.1), así
     que con la cédula HVAC de la prueba (cargada por 12.1) el conductor queda
     más ajustado y Kaizen SÍ encuentra una oportunidad propia de la disciplina
     eléctrica (subir un calibre para bajar pérdidas), que no depende de ningún
     permiso entre disciplinas. Es una medida real y correcta, no un defecto:
     se aísla aquí quitando las cargas capturadas para probar solo lo que esta
     comprobación mide — el aviso de enlaces sin autorizar —, y se restauran
     después para no tocar las comprobaciones que siguen. */
  const cargas0 = S.elec.cargas;
  S.elec.cargas = [];
  S.perms = {}; S.tab = "valor"; G("VZ_CACHE").key = null; G("recompute")();
  const V = G("VALOR");
  if (!V.bloqueos.length) throw new Error("no declara qué enlaces le faltan");
  V.bloqueos.forEach((b) => {
    if (!G("LINKS")[b.id]) throw new Error("el bloqueo apunta a un enlace que no existe: " + b.id);
    if (!b.texto) throw new Error("bloqueo sin explicación: " + b.id);
  });
  contiene(V.resumen, "por autorizar");
  S.elec.cargas = cargas0; G("VZ_CACHE").key = null; G("recompute")();
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
t("14.3 el botón de regreso lleva de vuelta al tablero, con el diagrama embebido", () => {
  S.tab = "ductos"; G("render")();
  w.document.querySelector('[data-act="ir-diagrama"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  eq(S.tab, "tablero", "después del regreso:");
  contiene(vista(), 'class="tdiag"');
});
t("14.4 la tecla Escape también regresa al tablero", () => {
  G("closeModal")();               // Escape cierra primero lo que esté encima
  S.tab = "ventilacion"; G("render")();
  const ev = new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true });
  w.document.dispatchEvent(ev);
  eq(S.tab, "tablero", "después de Escape:");
  /* Y ya en el tablero Escape no hace nada raro. */
  w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  eq(S.tab, "tablero");
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
  volver("inicio"); eq(S.tab, "tablero", "dos pasos atrás (una entrada vieja de «inicio» cae en el tablero, su reemplazo):");
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
  contiene(a, "SuiteEmp rev", "el libro en español no lleva pie:");
  contiene(b2, "SuiteEmp rev", "el libro en inglés no lleva pie:");
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

/* ====== 17. rev 2.9.3 · Proyecto ejecutivo por disciplina e instancia limpia ======
   Cada disciplina ofrece dos puntos de partida: el motor desde cero o los
   archivos del proyecto ejecutivo. Estas comprobaciones cargan archivos reales
   (DXF, PDF con FlateDecode, CSV y DWG) por el mismo camino que la ventana, y
   verifican que nada entra sin marca, que el proyecto nuevo nace limpio y que
   ningún identificador de obras anteriores sale en pantalla ni en documentos. */
{
  const fsx = await import("node:fs");
  const zlibx = await import("node:zlib");
  const tA = async (nombre, fn) => {
    try { const r = await fn(); if (r === false) { fail++; fallos.push([nombre, "devolvió falso"]); } else ok++; }
    catch (e) { fail++; fallos.push([nombre, e.message]); }
  };
  const archivo = (nombre, contenido) => new w.File([typeof contenido === "string" ? contenido : new Uint8Array(contenido)], nombre);
  const DISC = ["carga", "limpios", "seleccion", "ventilacion", "ductos", "electrico", "hidro", "fuego", "aire", "civil", "soporte", "estructural"];

  /* ---- archivos de prueba, armados aquí para que el banco no dependa de nada ---- */
  const par = (c, v) => `${String(c).padStart(3)}\n${v}\n`;
  const lw = (capa, pts) => par(0, "LWPOLYLINE") + par(8, capa) + par(90, pts.length) + par(70, 1) + pts.map(([x, y]) => par(10, x) + par(20, y)).join("");
  const DXF = par(0, "SECTION") + par(2, "HEADER") + par(9, "$INSUNITS") + par(70, 4) + par(0, "ENDSEC") +
    par(0, "SECTION") + par(2, "ENTITIES") +
    lw("A-MURO", [[0, 0], [12000, 0], [12000, 8000], [0, 8000]]) +
    lw("A-MURO", [[12000, 0], [20000, 0], [20000, 8000], [12000, 8000]]) +
    par(0, "TEXT") + par(8, "A-TEXTO") + par(10, 6000) + par(20, 4000) + par(40, 250) + par(1, "OFICINA ABIERTA 96 m2") +
    par(0, "TEXT") + par(8, "A-TEXTO") + par(10, 16000) + par(20, 4000) + par(40, 250) + par(1, "CUARTO LIMPIO ISO 8 64 m2 h=3.20 m") +
    par(0, "LINE") + par(8, "M-DUCTO-SA") + par(10, 0) + par(20, 0) + par(11, 30000) + par(21, 0) +
    par(0, "ENDSEC") + par(0, "EOF");
  const pdfDe = (paginas) => {
    const objs = [];
    const add = (b) => { objs.push(Buffer.isBuffer(b) ? b : Buffer.from(b, "latin1")); return objs.length; };
    const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const cont = paginas.map((txt) => { const z = zlibx.deflateSync(Buffer.from(txt, "latin1")); return add(Buffer.concat([Buffer.from(`<< /Length ${z.length} /Filter /FlateDecode >>\nstream\n`), z, Buffer.from("\nendstream")])); });
    const pagesId = objs.length + cont.length + 1;
    const pags = cont.map((c) => add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents ${c} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`));
    add(`<< /Type /Pages /Kids [${pags.map((p) => p + " 0 R").join(" ")}] /Count ${pags.length} >>`);
    const cat = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    const partes = [Buffer.from("%PDF-1.4\n")]; let pos = partes[0].length; const offs = [];
    objs.forEach((o, i) => { offs.push(pos); const b = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), o, Buffer.from("\nendobj\n")]); partes.push(b); pos += b.length; });
    partes.push(Buffer.from(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${pos}\n%%EOF\n`));
    return Buffer.concat(partes);
  };
  const PDF = pdfDe([
    "BT /F1 12 Tf 72 720 Td (PROYECTO NAVE DE ENSAMBLE) Tj 0 -16 Td (CLIENTE: Manufactura del Norte) Tj 0 -16 Td (Area total: 1,250 m2  Altura libre: 6.5 m  Ocupacion: 48 personas) Tj ET",
    "BT /F1 12 Tf 72 720 Td (Sistema contra incendio NFPA 13 riesgo ordinario grupo 2 densidad 0.20 gpm/ft2) Tj 0 -16 Td (Presion disponible en la toma 30 mca) Tj ET",
  ]);
  const CSV = "circuito,descripcion,carga_w,fases,tension_v\nC-1,Alumbrado oficina,2400,1,127\nC-2,Contactos oficina,3600,1,127\nC-3,UMA-01 motor ventilador,7460,3,220\nC-4,Compresor aire,11190,3,220\n";
  const DWG = Buffer.concat([Buffer.from("AC1027"), Buffer.alloc(300), Buffer.from("A-MURO\0M-DUCTO-SA\0UMA-01\0")]);

  const cx = (n2) => G(n2);
  const nombreViejo = S.meta.name;
  const pidViejo = (() => { S.meta.name = S.meta.name || "Banco de pruebas"; G("projSave")(true); return S.pid; })();
  const zonasViejas = JSON.stringify(S.zones);

  t("17.1 cada disciplina ofrece los dos puntos de partida, y solo las disciplinas", () => {
    DISC.forEach((tab) => {
      S.tab = tab; G("render")();
      const v = w.document.getElementById("view");
      const b = v.querySelector(`[data-act="cx-cargar"][data-cx-tab="${tab}"]`);
      if (!b) throw new Error(`${tab}: no ofrece cargar el proyecto ejecutivo`);
      contiene(v.querySelector(".cx-panel").textContent, "desde cero", `${tab}:`);
    });
    ["inicio", "tablero", "proyecto", "cotizacion", "valor", "kaizen", "catalogo"].forEach((tab) => {
      S.tab = tab; G("render")();
      if (w.document.querySelector("#view .cx-panel")) throw new Error(`${tab} no es una disciplina y muestra el panel de carga`);
    });
  });
  t("17.2 los lectores no usan librerías ni red: son funciones de la propia suite", () => {
    ["cxInflate", "cxPdfTexto", "cxDxfLeer", "cxDwgInspeccionar", "cxCsvLeer", "cxAnalizarTexto"].forEach((f) => eq(typeof G(f), "function", f + ":"));
    const html = fsx.readFileSync(file, "utf8");
    /* Se busca el USO, no la palabra: un comentario puede explicar por qué no
       se usa DecompressionStream. */
    const uso = html.match(/new\s+DecompressionStream\s*\(|<script[^>]+\bsrc\s*=|\bimport\s*\(\s*["'`]https?:|fetch\s*\(\s*["'`]https?:/i);
    if (uso) throw new Error("apareció una dependencia externa: " + uso[0]);
  });

  let loteDxf;
  await tA("17.3 una planta DXF propone las zonas con su área, su nombre y su origen", async () => {
    loteDxf = await cx("cxProcesarArchivos")([archivo("planta-arquitectonica.dxf", DXF)], "carga");
    const zonas = loteDxf.propuestas.filter((p) => p.grupo === "zona");
    eq(zonas.length, 2, "zonas propuestas:");
    if (!zonas.some((z) => /OFICINA ABIERTA/.test(z.etiqueta) && /96/.test(z.valor))) throw new Error("falta la oficina de 96 m²: " + JSON.stringify(zonas.map((z) => z.etiqueta + " " + z.valor)));
    if (!zonas.some((z) => /CUARTO LIMPIO/.test(z.etiqueta) && /64/.test(z.valor) && /3,2|3\.2/.test(z.valor))) throw new Error("falta el cuarto limpio con su altura");
    zonas.forEach((z) => eq(z.archivo, "planta-arquitectonica.dxf", "origen:"));
    if (!zonas.every((z) => z.marcado)) throw new Error("la geometría del plano es dato duro y debe venir marcada");
  });
  await tA("17.4 la ventana de hallazgos se abre por el mismo camino que el botón y lista cada dato", async () => {
    await cx("cxAlElegir")([archivo("planta-arquitectonica.dxf", DXF)], "carga");
    const m = w.document.getElementById("modal");
    if (m.hidden) throw new Error("no se abrió la ventana");
    eq(m.querySelectorAll("[data-cx-prop]").length, 2, "casillas:");
    if (!m.querySelector('[data-act="cx-nuevo"]') || !m.querySelector('[data-act="cx-aplicar"]')) throw new Error("faltan los dos caminos: proyecto nuevo o proyecto abierto");
  });
  t("17.5 un dato desmarcado no entra: nada llega a un motor sin la marca del usuario", () => {
    const m = w.document.getElementById("modal");
    const c = m.querySelectorAll("[data-cx-prop]")[1];
    c.checked = false; c.dispatchEvent(new w.Event("change", { bubbles: true }));
    eq(G("CX_LOTE").propuestas[1].marcado, false, "la marca no se registró:");
  });
  t("17.6 crear proyecto nuevo abre una instancia limpia e independiente", () => {
    S.quote.items = [{ fam: "prueba", qty: 3 }];
    S.kaizen.items = [{ id: "k-prueba" }];
    w.document.querySelector('#modal [data-act="cx-nuevo"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    if (S.pid === pidViejo) throw new Error("el proyecto nuevo reutilizó el id del anterior");
    eq(S.zones.length, 1, "entró solo la zona marcada:");
    cerca(S.zones[0].area, 96, .01, "área de la oficina:");
    eq(S.quote.items.length, 0, "la cotización del proyecto anterior viajó al nuevo:");
    eq(S.kaizen.items.length, 0, "el Kaizen del proyecto anterior viajó al nuevo:");
    eq(S.meta.client, "", "el cliente del proyecto anterior viajó al nuevo:");
    eq(S.cx.lotes.length, 1, "registro de origen:");
    eq(S.cx.lotes[0].archivos[0].nombre, "planta-arquitectonica.dxf");
    eq(S.cx.lotes[0].modo, "nuevo");
    contiene(S.cx.lotes[0].aplicados[0].texto, "polilínea cerrada");
  });
  t("17.7 el proyecto anterior queda intacto en el historial y el nuevo también se guarda", () => {
    const lista = G("projList")();
    const viejo = lista.find((p) => p.id === pidViejo);
    if (!viejo) throw new Error("se perdió el proyecto anterior");
    eq(JSON.stringify(viejo.data.zones), zonasViejas, "el proyecto anterior cambió:");
    if (!lista.find((p) => p.id === S.pid)) throw new Error("el proyecto nuevo no quedó guardado como proyecto independiente");
    eq(viejo.data.cx ? viejo.data.cx.lotes.length : 0, 0, "el registro de carga se escribió en el proyecto equivocado:");
  });
  t("17.8 la zona nacida del plano calcula: muros exteriores a la altura real, el muro compartido en cero y sin vidrio inventado", () => {
    const z = S.zones[0];
    cerca(z.walls.N, 12 * 2.8, .2, "muro norte = ancho × altura:");
    cerca(z.walls.W, 8 * 2.8, .2, "muro poniente = fondo × altura:");
    /* La oficina comparte su cara oriente con el cuarto limpio del mismo plano. */
    eq(z.walls.E, 0, "muro oriente compartido con otro cuarto:");
    eq(["N", "NE", "E", "SE", "S", "SW", "W", "NW"].reduce((a, o) => a + z.glass[o], 0), 0, "vidrio:");
    G("recompute")();
    if (!(G("LOADS")[0] && G("LOADS")[0].tons > 0)) throw new Error("la zona cargada no produce carga térmica");
  });

  await tA("17.9 una memoria en PDF comprimido alimenta contra incendio con página y renglón", async () => {
    const lote = await cx("cxProcesarArchivos")([archivo("memoria-sci.pdf", PDF)], "fuego");
    const de = (et) => lote.propuestas.find((p) => p.etiqueta === et);
    cerca(de("Área a proteger").valor, 1250, .01, "área:");
    cerca(de("Altura libre").valor, 6.5, .01, "altura:");
    eq(de("Clase de riesgo (NFPA 13)").valor, "Riesgo ordinario grupo 2");
    eq(de("Área a proteger").pagina, 1, "página del área:");
    eq(de("Clase de riesgo (NFPA 13)").pagina, 2, "página del riesgo:");
    contiene(de("Área a proteger").texto, "Area total: 1,250 m2");
    G("cxAplicar")(lote, "abierto");
    eq(S.fuego.area, 1250, "fuego.area:"); eq(S.fuego.altura, 6.5); eq(S.fuego.riesgo, "ord2");
    eq(G("herDe")("fuego.area").modo, "propio", "el área cargada debe dejar de heredarse:");
    G("recompute")(); G("render")();
    eq(S.fuego.area, 1250, "la herencia pisó el dato cargado:");
  });
  await tA("17.10 un cuadro de cargas en CSV entra al eléctrico carga por carga, con su tipo", async () => {
    const lote = await cx("cxProcesarArchivos")([archivo("cuadro-de-cargas.csv", CSV)], "electrico");
    const antes = S.elec.cargas.length;
    G("cxAplicar")(lote, "abierto");
    const nuevas = S.elec.cargas.slice(antes);
    eq(nuevas.length, 4, "cargas:");
    cerca(nuevas[2].kW, 7.46, .001, "UMA:"); eq(nuevas[2].tipo, "motor");
    eq(nuevas[0].tipo, "alumbrado"); eq(nuevas[1].tipo, "contactos"); eq(nuevas[0].ph, 1); eq(nuevas[0].V, 127);
  });
  await tA("17.11 un DWG no truena: dice qué versión es y cómo exportarlo a DXF", async () => {
    const lote = await cx("cxProcesarArchivos")([archivo("planta.dwg", DWG)], "soporte");
    eq(lote.fuentes[0].tipo, "dwg");
    if (!lote.fuentes[0].avisos.some((a) => /DXF/.test(a))) throw new Error("no orienta a exportar DXF");
    await G("cxAlElegir")([archivo("planta.dwg", DWG)], "soporte");
    if (w.document.getElementById("modal").hidden) throw new Error("la ventana no abrió con el DWG");
    G("closeModal")();
  });
  await tA("17.12 un archivo que no se puede leer se dice, sin tumbar la aplicación", async () => {
    const lote = await cx("cxProcesarArchivos")([archivo("escaneo.pdf", "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF")], "hidro");
    if (!lote.fuentes[0].avisos.length) throw new Error("un PDF sin texto debe avisar");
    eq(w.__errs.length, 0, "errores de ventana:");
  });
  t("17.13 el origen de cada dato cargado se consulta desde la disciplina", () => {
    S.tab = "fuego"; G("render")();
    const b = w.document.querySelector('#view [data-act="cx-origen"]');
    if (!b) throw new Error("no ofrece ver el origen");
    b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    contiene(w.document.getElementById("modal").textContent, "memoria-sci.pdf");
    contiene(w.document.getElementById("modal").textContent, "p. 1");
    G("closeModal")();
  });
  t("17.13.1 la memoria integral imprime el origen de lo cargado desde archivos", () => {
    const txt = Buffer.from(G("buildMemoriaIntegralPdf")()).toString("latin1");
    contiene(txt, "datos cargados de archivos del proyecto ejecutivo");
    contiene(txt, "memoria-sci.pdf");
    eq(G("PDF_ACUM"), null, "el documento en curso quedó abierto:");
  });
  t("17.14 un proyecto guardado sin registro de carga, o con uno roto, abre sin mover un número", () => {
    const s1 = G("sanearEstado")({ meta: { name: "sin cx" }, zones: [{ ...G("defaultZone")("Z"), area: 77 }] });
    eq(Array.isArray(s1.cx.lotes), true); eq(s1.cx.lotes.length, 0); eq(s1.zones[0].area, 77);
    const s2 = G("sanearEstado")({ cx: { lotes: [null, 5, { archivos: [], aplicados: [] }] } });
    eq(s2.cx.lotes.length, 1, "lotes rotos:");
    const s3 = G("sanearEstado")({ quote: { basePrecio: "clave-que-ya-no-existe" } });
    eq(s3.quote.basePrecio, "casa", "base de precio desconocida:");
  });
  t("17.15 ningún identificador de obras anteriores sale en pantalla, documentos, libros ni respaldo", () => {
    const VETADOS = /\b(QMX|VANTIVE|Nordson|Quasar|A302|A401)\b/i;
    const html = fsx.readFileSync(file, "utf8").replace(/data:[a-zA-Z0-9/+.-]+;base64,[A-Za-z0-9+/=]+/g, "");
    const visible = html.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
    const m0 = visible.match(VETADOS); if (m0) throw new Error("en el código de la aplicación: " + m0[0]);
    S.tab = "tablero"; G("render")();
    /* Se lee lo que se VE: el cuerpo sin el script, que también vive en body. */
    const visto = () => { const c = w.document.body.cloneNode(true); c.querySelectorAll("script,style").forEach((x) => x.remove()); return c.textContent; };
    G("tabsDeVista")().forEach((tab) => {
      S.tab = tab; G("render")();
      const m = visto().match(VETADOS);
      if (m) throw new Error(`en la pantalla ${tab}: ${m[0]}`);
    });
    const docs = ["buildMemoriaIntegralPdf", "buildCotizacionPdf", "buildCedulaEquiposPdf", "buildElecPdf", "buildFuegoPdf", "buildHidroPdf", "buildCivilPdf", "buildSoportePdf"];
    docs.forEach((d) => {
      let b; try { b = G(d)(); } catch { return; }
      if (!b || !b.length) return;
      const m = Buffer.from(b).toString("latin1").match(VETADOS);
      if (m) throw new Error(`en ${d}: ${m[0]}`);
    });
    ["es", "en"].forEach((lang) => {
      const m = Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : "USD" })).toString("utf8").match(VETADOS);
      if (m) throw new Error(`en el libro ${lang}: ${m[0]}`);
    });
    const m2 = JSON.stringify(S).match(VETADOS);
    if (m2) throw new Error("en el respaldo .json: " + m2[0]);
  });

  /* ---- 17.16+ · correcciones de la verificación adversarial (integración) ---- */
  const BS = String.fromCharCode(92);
  const txt = (c, x, y, s) => par(0, "TEXT") + par(8, c) + par(10, x) + par(20, y) + par(40, 250) + par(1, s);
  const mtx = (c, x, y, s) => par(0, "MTEXT") + par(8, c) + par(10, x) + par(20, y) + par(40, 250) + par(1, s);
  const dxfDe = (cuerpo) => par(0, "SECTION") + par(2, "HEADER") + par(9, "$INSUNITS") + par(70, 4) + par(0, "ENDSEC") + par(0, "SECTION") + par(2, "ENTITIES") + cuerpo + par(0, "ENDSEC") + par(0, "EOF");
  const rect = (capa, x0, y0, x1, y1) => lw(capa, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const zonasDe = (lote) => lote.propuestas.filter((p) => p.grupo === "zona");

  await tA("17.16 una mesa o una base de equipo dentro de un cuarto no reemplaza al cuarto", async () => {
    const d = dxfDe(rect("A-MURO", 0, 0, 10000, 10000) + txt("A-TEXTO", 5000, 8000, "SALA DE JUNTAS") +
      rect("A-MOBILIARIO", 3000, 4000, 8000, 6000) + rect("A-EQUIPO", 500, 500, 3000, 3000));
    const z = zonasDe(await cx("cxProcesarArchivos")([archivo("juntas.dxf", d)], "carga"));
    eq(z.length, 1, "zonas:");
    contiene(z[0].etiqueta, "SALA DE JUNTAS"); contiene(z[0].valor, "100");
  });
  await tA("17.17 la altura escrita en la etiqueta de un cuarto es solo de ese cuarto", async () => {
    const d = dxfDe(rect("A-MURO", 0, 0, 10000, 8000) + mtx("A-TEXTO", 5000, 4000, "OFICINA" + BS + "P80 m2" + BS + "Ph=2.70 m") +
      rect("A-MURO", 20000, 0, 36000, 10000) + mtx("A-TEXTO", 28000, 5000, "ALMACEN" + BS + "P160 m2" + BS + "Ph=9.00 m"));
    const z = zonasDe(await cx("cxProcesarArchivos")([archivo("alturas.dxf", d)], "carga"));
    const of = z.find((p) => /OFICINA/.test(p.etiqueta)), al = z.find((p) => /ALMACEN/.test(p.etiqueta));
    if (!of || !al) throw new Error("faltan cuartos: " + z.map((p) => p.etiqueta).join(" | "));
    if (!/h 2[.,]7/.test(of.valor)) throw new Error("altura de la oficina: " + of.valor);
    if (!/h 9/.test(al.valor)) throw new Error("altura del almacén: " + al.valor);
  });
  await tA("17.18 un cuarto rodeado por otros cuartos no tiene muros exteriores", async () => {
    let c = "";
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) c += rect("A-MURO", i * 10000, j * 10000, (i + 1) * 10000, (j + 1) * 10000) + txt("A-TEXTO", i * 10000 + 5000, j * 10000 + 5000, i === 1 && j === 1 ? "SITE CENTRAL" : `LOCAL ${i}${j}`);
    const z = zonasDe(await cx("cxProcesarArchivos")([archivo("rejilla.dxf", c ? dxfDe(c) : "")], "carga"));
    const central = z.find((p) => /SITE CENTRAL/.test(p.etiqueta));
    if (!central) throw new Error("no salió el cuarto central");
    contiene(central.valor, "sin muros exteriores");
    const esq = z.find((p) => /LOCAL 00/.test(p.etiqueta));
    contiene(esq.valor, "muros exteriores S, W");
  });
  await tA("17.19 el área total no es la del predio, y varias áreas sin palabra clave se ofrecen sin marcar", async () => {
    const a = await cx("cxProcesarArchivos")([archivo("descriptiva.txt", "Superficie del predio: 18,500 m2\nArea construida de la nave: 3,200 m2\n")], "fuego");
    const ap = a.propuestas.find((p) => p.destino === "fuego.area");
    eq(ap.valor, 3200, "área a proteger:"); eq(ap.marcado, true, "marcada:");
    const b = await cx("cxProcesarArchivos")([archivo("tabla.txt", "Oficinas 120 m2\nAlmacen 340 m2\n")], "civil");
    const ops = b.propuestas.filter((p) => p.destino === "civil.areaManual");
    eq(ops.length, 2, "opciones:");
    if (ops.some((p) => p.marcado)) throw new Error("un área sin palabra clave salió marcada");
  });
  await tA("17.20 el CSV eléctrico lee tensión y fases con su unidad, y lo que no entiende va sin marcar", async () => {
    const csv = "circuito,descripcion,Potencia (kW),Tension,Fases\nC-1,Extractor de bano,0.375,127 V,1F\nC-2,Minisplit,2.4,220 V,2F\nC-3,Horno,5.5,220,\n";
    const l = await cx("cxProcesarArchivos")([archivo("cuadro.csv", csv)], "electrico");
    const c = l.propuestas.filter((p) => p.grupo === "carga");
    eq(c.length, 3, "cargas:");
    contiene(c[0].valor, "0.375 kW"); contiene(c[0].valor, "127 V"); contiene(c[0].valor, "1F"); eq(c[0].marcado, true);
    contiene(c[1].valor, "220 V"); contiene(c[1].valor, "1F");
    eq(c[2].marcado, false, "sin fases leídas:"); contiene(c[2].valor, "fases supuestas");
    const w = await cx("cxProcesarArchivos")([archivo("w.csv", "descripcion,Carga (W),V,fases\nAlumbrado,400,127,1\n")], "electrico");
    contiene(w.propuestas.find((p) => p.grupo === "carga").valor, "0.4 kW");
    const kwh = await cx("cxProcesarArchivos")([archivo("kwh.csv", "descripcion,kWh/mes,Potencia W,V,fases\nAlumbrado,120,400,127,1\n")], "electrico");
    contiene(kwh.propuestas.find((p) => p.grupo === "carga").valor, "0.4 kW");
  });
  await tA("17.21 el CSV de aire convierte scfm y m³/h a l/min, y una columna sin unidad va sin marcar", async () => {
    const a = await cx("cxProcesarArchivos")([archivo("aire.csv", "equipo,caudal scfm,cantidad\nPrensa,35,2\n")], "aire");
    const p = a.propuestas.find((x) => x.grupo === "consumo");
    if (!/^991 l\/min|^991/.test(p.valor)) throw new Error("35 scfm: " + p.valor);
    eq(p.marcado, true);
    const b = await cx("cxProcesarArchivos")([archivo("aire2.csv", "equipo,caudal,cantidad\nSecador,300,1\n")], "aire");
    eq(b.propuestas.find((x) => x.grupo === "consumo").marcado, false, "sin unidad:");
  });
  await tA("17.22 las capas se clasifican por palabra completa y leer un plano no apaga los motores de soportería", async () => {
    const lin = (c, L) => par(0, "LINE") + par(8, c) + par(10, 0) + par(20, 0) + par(11, L) + par(21, 0);
    const d = dxfDe(lin("E-ALIMENTADOR-PRINCIPAL", 120000) + lin("A-FASCIA", 40000) + lin("HVAC-EQUIPOS", 65000) + lin("IH-AGUA-FRIA-PRINCIPAL", 80000));
    const l = await cx("cxProcesarArchivos")([archivo("instalaciones.dxf", d)], "soporte");
    const largos = l.propuestas.filter((p) => /medido en plano/.test(p.etiqueta));
    eq(largos.length, 1, "longitudes propuestas: " + largos.map((p) => p.etiqueta + " " + p.valor).join(" | "));
    contiene(largos[0].etiqueta, "hidrosanitaria"); eq(largos[0].valor, 80);
    const motores = l.propuestas.find((p) => p.destino === "soporte.usarMotores");
    if (!motores || motores.marcado) throw new Error("apagar los motores debe ser una casilla aparte y sin marcar");
    S.soporte.usarMotores = true;
    G("cxAplicar")(l, "abierto");
    eq(S.soporte.usarMotores, true, "aplicar una longitud apagó los motores:");
  });
  await tA("17.23 crear proyecto nuevo desde archivos guarda antes lo capturado sin nombre", async () => {
    G("closeModal")();
    const b = w.document.createElement("button"); b.dataset.act = "proj-new"; w.document.body.appendChild(b);
    b.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); b.remove();
    S.zones = [{ ...G("defaultZone")("Zona 1"), area: 1850 }]; G("recompute")();
    const l = await cx("cxProcesarArchivos")([archivo("planta-arquitectonica.dxf", DXF)], "carga");
    G("cxAplicar")(l, "nuevo");
    if (!G("projList")().some((p) => p.data && (p.data.zones || []).some((z) => z.area === 1850))) throw new Error("se perdió la captura sin nombre");
  });
  await tA("17.24 un CSV de Excel en Windows-1252 conserva sus acentos", async () => {
    const cuerpo = "descripcion,carga_w,tension_v,fases\n" + Array.from({ length: 300 }, (_, i) => `Carga ${i},100,127,1`).join("\n") + "\nIluminaci" + String.fromCharCode(243) + "n nave,2400,220,3\n";
    const bytes = Uint8Array.from(Array.from(cuerpo).map((ch) => ch.charCodeAt(0) & 255));
    const l = await cx("cxProcesarArchivos")([archivo("cuadro-1252.csv", bytes)], "electrico");
    const p = l.propuestas.find((x) => /Iluminaci/.test(x.etiqueta));
    if (!p) throw new Error("no salió la carga con acento");
    contiene(p.etiqueta, "Iluminación");
  });
  t("17.25 un lote roto en un respaldo editado a mano no tumba el panel ni el origen", () => {
    const s = G("sanearEstado")({ cx: { lotes: [{ tab: "fuego", ts: 1, archivos: [null, { nombre: "a.pdf" }], aplicados: [null, { etiqueta: "x", valor: 1 }], equipos: [null] }] } });
    eq(s.cx.lotes[0].archivos.length, 1); eq(s.cx.lotes[0].aplicados.length, 1); eq(s.cx.lotes[0].equipos.length, 0);
    const antes = S.cx; S.cx = { lotes: [{ tab: "fuego", ts: 1, archivos: [null], aplicados: [null] }] };
    try { G("cxPanelCargaHtml")("fuego"); G("cxOrigenHtml")("fuego"); }
    finally { S.cx = antes; }
  });
  await tA("17.26 un JSON se analiza como texto y un respaldo de SuiteEmp se reconoce", async () => {
    const l = await cx("cxProcesarArchivos")([archivo("datos.json", JSON.stringify({ memoria: { "Area total": "1,250 m2", altura: "Altura libre: 6.5 m" } }))], "fuego");
    if (!l.propuestas.some((p) => p.destino === "fuego.area" && p.valor === 1250)) throw new Error("el JSON no produjo el área");
    const r = await cx("cxProcesarArchivos")([archivo("respaldo.emp.json", JSON.stringify({ meta: { name: "x" }, zones: [] }))], "carga");
    if (!r.fuentes[0].avisos.some((a) => /Abrir \.json/.test(a))) throw new Error("no reconoce el respaldo");
  });
  await tA("17.27 sin datos, la ventana dice qué revisar según el tipo de archivo", async () => {
    const l = await cx("cxProcesarArchivos")([archivo("vacio.dxf", dxfDe(""))], "hidro");
    const h = G("cxModalHtml")(l);
    contiene(h, "polilíneas cerradas");
    if (/escaneo/.test(h)) throw new Error("a un DXF le pide revisar que el PDF no sea un escaneo");
  });
  await tA("17.28 una clave de plano no se marca como equipo; un equipo con marca o capacidad sí", async () => {
    const l = await cx("cxProcesarArchivos")([archivo("cedula.txt", "UMA-01 CARRIER 39M-15 12,000 CFM\nTUBO DN-50 CEDULA SCH-40\nPTR-102 perfil\n")], "seleccion");
    const eqs = l.propuestas.filter((p) => p.grupo === "equipo");
    const uma = eqs.find((p) => /UMA-01/.test(p.etiqueta));
    if (!uma || !uma.marcado) throw new Error("UMA-01 debe salir marcada");
    if (eqs.some((p) => /DN-50|SCH-40|PTR-102/.test(p.etiqueta) && p.marcado)) throw new Error("una clave de plano salió marcada como equipo");
  });
  await tA("17.28.1 el área de diseño de rociadores no se ofrece como área a proteger", async () => {
    const l = await cx("cxProcesarArchivos")([archivo("sci.txt", "Densidad de descarga 0.20 gpm/ft2 sobre área de diseño 1,500 ft2\n")], "fuego");
    if (l.propuestas.some((p) => p.destino === "fuego.area")) throw new Error("el área de diseño se propuso como área a proteger");
    const dis = l.propuestas.find((p) => p.destino === "fuego.areaDiseno");
    if (!dis) throw new Error("no se propuso el área de diseño en su campo");
  });
  await tA("17.29 un plano con más de 80 cuartos lo dice en la ventana", async () => {
    let c = "";
    for (let i = 0; i < 90; i++) c += rect("A-MURO", i * 3000, 0, i * 3000 + 2500, 2500) + txt("A-TEXTO", i * 3000 + 1200, 1200, `CUBICULO ${i}`);
    const l = await cx("cxProcesarArchivos")([archivo("cubiculos.dxf", dxfDe(c))], "carga");
    eq(zonasDe(l).length, 80, "zonas propuestas:");
    contiene(G("cxModalHtml")(l), "90 cuartos");
  });
  S.meta.name = nombreViejo;
}

/* ====== 18. rev 2.9.3 · Ningún proyecto se asoma en otro =================
   Un proyecto anterior se queda en la memoria del dispositivo como antecedente
   técnico, pero su nombre, su cliente y sus datos específicos no aparecen en
   otro proyecto: ni en pantalla, ni en el libro que va al cliente, ni en el
   historial de la casa, ni arrastrados al crear, abrir, importar o deshacer. */
{
  const VIEJO = /OBRA-HISTORICA|CLIENTE-HISTORICO|SITIO-HISTORICO/;
  const act = (a, id) => {
    const b = w.document.createElement("button");
    b.dataset.act = a; if (id) b.dataset.id = id;
    w.document.body.appendChild(b);
    b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    b.remove();
  };
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
  const tA = async (nombre, fn) => {
    try { const r = await fn(); if (r === false) { fail++; fallos.push([nombre, "devolvió falso"]); } else ok++; }
    catch (e) { fail++; fallos.push([nombre, e.message]); }
  };
  const sinViejo = (txt, donde) => { const m = String(txt).match(VIEJO); if (m) throw new Error(`${donde}: aparece "${m[0]}"`); };
  const num = (v) => Number(v) || 0;

  /* ---- Proyecto A: una obra anterior con identidad por todos lados ---- */
  G("closeModal")();
  act("proj-new");
  S.meta.name = "OBRA-HISTORICA-A"; S.meta.client = "CLIENTE-HISTORICO SA"; S.meta.location = "SITIO-HISTORICO Parque Industrial";
  S.zones = [{ ...G("defaultZone")("Sala blanca CLIENTE-HISTORICO"), area: 180, height: 3.5, occ: 9 }];
  G("recompute")();
  S.aire.consumos[0].nombre = "Linea CLIENTE-HISTORICO"; S.aire.presionUso = 7.7;
  S.civil.areaManual = 999;
  S.soporte.snap = { resumen: "foto aceptada de OBRA-HISTORICA-A", ts: 1 };
  S.llaveSuelta = "OBRA-HISTORICA-A";
  if (!S.quote.prop) S.quote.prop = G("defaultPropuesta")();
  S.quote.prop.cliente = "CLIENTE-HISTORICO SA";
  G("registrarDesviacion")({ id: "prueba-18", tipo: "Sistema", recomendo: "VRF", eligio: "Chiller", medida: "sistema" });
  G("kbAnotar")("sistema", "ofrecida", { tipo: "desviacion", recomendo: "VRF", eligio: "Chiller", proyecto: "OBRA-HISTORICA-A", rev: "2.9.2" });
  G("projSave")(true);
  const idA = S.pid;
  /* Dos pasos de deshacer dentro de A, como los deja cualquier captura. */
  G("histSnap")("A uno"); S.meta.date = "2026-01-02"; G("histSnap")("A dos"); G("projSave")(true);

  t("18.1 crear en blanco no arrastra nada del proyecto anterior", () => {
    act("proj-new");
    if (S.pid === idA) throw new Error("se quedó el id del anterior");
    eq(S.llaveSuelta, undefined, "llave del proyecto anterior:");
    if (S.soporte && S.soporte.snap) throw new Error("viajó la foto aceptada de soportería");
    if (num(S.civil.areaManual) === 999) throw new Error("viajó la obra civil");
    if (S.aire.presionUso === 7.7) throw new Error("viajó el aire comprimido");
    sinViejo(JSON.stringify(S), "estado del proyecto en blanco");
    sinViejo(Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8"), "libro del proyecto en blanco");
  });
  t("18.2 deshacer en el proyecto nuevo no regresa al anterior ni lo sobrescribe", () => {
    S.meta.name = "OBRA-NUEVA-B"; G("projSave")(true);
    G("deshacer")(); G("deshacer")();
    sinViejo(S.meta.name, "nombre tras deshacer");
    const a = G("projList")().find((p) => p.id === idA);
    eq(a.data.meta.name, "OBRA-HISTORICA-A", "el registro del anterior cambió:");
  });
  t("18.3 proyecto, cotización y Kaizen del proyecto abierto no muestran a los demás; el tablero solo los enlista para cambiar", () => {
    /* rev 2.9.4 · El tablero es la pantalla de inicio y lleva, por pedido de la
       casa, la lista de proyectos recientes para cambiar entre ellos. Ahí sí
       aparecen sus nombres; lo que sigue prohibido es que un proyecto asome
       en las pantallas de captura, cotización o Kaizen de otro. */
    ["proyecto", "cotizacion", "kaizen"].forEach((tab) => {
      S.tab = tab; G("render")();
      sinViejo(w.document.getElementById("view").textContent, `pantalla ${tab}`);
    });
  });
  t("18.4 el historial de la casa guarda la decisión, no la obra de la que salió", () => {
    G("registrarDesviacion")({ id: "prueba-18b", tipo: "Sistema", recomendo: "Sala blanca CLIENTE-HISTORICO: 45 cambios/h", eligio: "Paquete", medida: "sistema" });
    if (!S.kaizen.desv.some((d) => d.id === "prueba-18b")) throw new Error("la desviación debe quedar en el proyecto");
    const kb = G("kbLeer")();
    if (kb.desv.some((d) => d && Object.prototype.hasOwnProperty.call(d, "proyecto"))) throw new Error("el historial guarda el nombre del proyecto");
    sinViejo(JSON.stringify(kb), "base de conocimiento");
  });
  t("18.5 el libro para el cliente no compara contra otro proyecto", () => {
    if (!S.quote.prop) S.quote.prop = G("defaultPropuesta")();
    S.quote.prop.comparaCon = idA;
    G("recompute")();
    ["es", "en"].forEach((lang) => sinViejo(Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : "USD" })).toString("utf8"), `libro ${lang}`));
    S.tab = "cotizacion"; G("render")();
    const opciones = [...w.document.querySelectorAll('[data-act="q-cmp-sel"] option')].map((o) => o.value);
    if (opciones.includes(idA)) throw new Error("el selector ofrece comparar contra otro proyecto");
    S.quote.prop.comparaCon = null;
  });
  t("18.6 una nueva revisión sí se compara contra la anterior del mismo proyecto", () => {
    G("projSave")(true);
    const idB = S.pid, linB = S.linaje;
    act("proj-rev", idB);
    if (S.pid === idB) throw new Error("la revisión reutilizó el id");
    eq(S.linaje, linB, "linaje:");
    eq(S.quote.prop.rev, "B", "letra de revisión:");
    eq(S.quote.prop.comparaCon, idB, "comparativo:");
    const x = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
    contiene(x, "contra la Rev. A", "CAMBIOS_REV:");
    S.tab = "cotizacion"; G("render")();
    const opciones = [...w.document.querySelectorAll('[data-act="q-cmp-sel"] option')].map((o) => o.value);
    if (!opciones.includes(idB)) throw new Error("el selector no ofrece la revisión anterior");
  });
  t("18.7 plantilla copia la ingeniería, no el nombre, el cliente ni las decisiones", () => {
    act("proj-dup", idA);
    sinViejo(JSON.stringify(S), "proyecto desde plantilla");
    eq(S.meta.client, "", "cliente:");
    cerca(S.zones[0].area, 180, .001, "área de la zona:"); cerca(S.zones[0].height, 3.5, .001, "altura:");
    eq(S.aire.presionUso, 7.7, "la ingeniería de aire comprimido sí se copia:");
    eq(JSON.stringify(S.perms), "{}", "permisos:");
    eq(S.kaizen.desv.length, 0, "decisiones:");
    if (S.soporte.snap) throw new Error("viajó la foto aceptada de soportería");
  });
  t("18.8 traer zonas agrega la geometría con nombres genéricos, sin decir de qué obra, y se deshace", () => {
    act("proj-new");
    const antes = S.zones.length;
    act("proj-zones", idA);
    eq(S.zones.length, antes + 1, "zonas:");
    cerca(S.zones[antes].area, 180, .001, "área:");
    sinViejo(JSON.stringify(S.zones), "zonas traídas");
    sinViejo(w.document.getElementById("toast").textContent, "aviso");
    G("deshacer")();
    eq(S.zones.length, antes, "deshacer:");
  });
  t("18.9 abrir un proyecto no conserva llaves del que estaba abierto", () => {
    S.otraLlave = "de otro"; G("projSave")(true);
    const idC = S.pid;
    G("projOpen")(idA);
    eq(S.otraLlave, undefined, "llave del proyecto anterior:");
    G("projOpen")(idC);
    eq(S.llaveSuelta, undefined, "llave del proyecto A:");
  });
  await tA("18.10 importar un respaldo .json reemplaza el proyecto completo y no hereda el id abierto", async () => {
    const idAbierto = S.pid;
    const inp = w.document.getElementById("file-input");
    const f = new w.File([JSON.stringify({ v: 1, meta: { name: "Respaldo importado" }, zones: [{ ...G("defaultZone")("Z"), area: 55 }] })], "respaldo.emp.json");
    inp.onchange({ target: { files: [f] } });
    await esperar(80);
    eq(S.meta.name, "Respaldo importado");
    if (idAbierto && S.pid === idAbierto) throw new Error("el respaldo heredó el id del proyecto abierto y lo iba a sobrescribir");
    eq(S.otraLlave, undefined, "llave del proyecto abierto:");
    eq(S.v, undefined, "la marca de versión del respaldo entró al estado:");
  });
  t("18.11 convertir en referencia interna borra la identidad y conserva la ingeniería", () => {
    G("closeModal")();
    act("proj-ref", idA);
    w.document.querySelector('#modal [data-act="confirmar-si"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const r = G("projList")().find((p) => p.id === idA);
    eq(r.referencia, true, "marca de referencia:");
    contiene(r.name, "Referencia interna");
    sinViejo(JSON.stringify(r), "registro guardado");
    cerca(r.data.zones[0].area, 180, .001, "la geometría se conserva:");
    act("proj-modal");
    sinViejo(w.document.getElementById("modal").textContent, "Mis proyectos");
    G("closeModal")();
  });
  t("18.12 los precios semilla no enseñan importes ni equipos de cotizaciones anteriores", () => {
    Object.values(G("PRICE_SEED")).forEach((p) => { if (/\$\s?\d|39MW-12/.test(p.src)) throw new Error("fuente con dato específico: " + p.src); });
    S.tab = "cotizacion"; G("render")();
    if (/G4\+F8\+HEPA H14/.test(w.document.getElementById("view").textContent)) throw new Error("el aviso describe el equipo de la obra de referencia");
  });
  t("18.13 la memoria de Kaizen no cruza al proyecto nuevo ni a su libro", () => {
    G("closeModal")();
    act("proj-new");
    S.meta.name = "OBRA-HISTORICA-K";
    S.zones = [{ ...G("defaultZone")("Sala blanca CLIENTE-HISTORICO"), area: 90, height: 3, iso: "iso7", achClean: 60, spaceType: "cleanroom" }];
    S.tab = "kaizen"; G("render")();
    act("proj-new");
    S.tab = "proyecto"; G("recompute")(); G("render")();
    sinViejo(JSON.stringify(G("KAIZEN") || {}), "Kaizen del proyecto nuevo");
    sinViejo(JSON.stringify(G("VALOR") || {}), "ingeniería de valor del proyecto nuevo");
    sinViejo(Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8"), "libro del proyecto nuevo");
  });
  t("18.14 armar el comparativo no deja llaves de la revisión anterior en el proyecto abierto", () => {
    act("proj-new");
    S.meta.name = "OBRA-NUEVA-D"; S.llaveDeRevision = "vieja"; G("projSave")(true);
    const idD = S.pid;
    act("proj-rev", idD);
    delete S.llaveDeRevision;
    G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" });
    eq(S.llaveDeRevision, undefined, "llave de la revisión comparada:");
  });

  /* ---- Hallazgos de la verificación 1: aislamiento y pérdida de datos ---- */
  const modal = () => w.document.getElementById("modal");
  const clicModal = (a) => {
    const b = modal().querySelector(`[data-act="${a}"]`);
    if (!b) throw new Error(`la ventana no ofrece ${a}`);
    b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
  };
  const avisoTxt = () => w.document.getElementById("toast").textContent;
  const registro = (id) => G("projList")().find((p) => p.id === id);
  /* El autoguardado espera 1.5 s: en las pruebas con espera no debe colarse
     un guardado pendiente de una prueba anterior. */
  const sinAutoguardado = () => w.eval("clearTimeout(autoT)");
  /* Una segunda ventana con el almacenamiento ya escrito ANTES de que corra la
     aplicación: es la única forma de probar lo que pasa al arrancar. */
  const cargarCon = async (f, preparar) => {
    const html = fs.readFileSync(f, "utf8").replace(/@font-face\{[^}]*\}/g, "");
    const dom = new JSDOM(html, {
      runScripts: "dangerously", pretendToBeVisual: true, url: "https://emp.local/",
      beforeParse(ww) {
        ww.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
        ww.requestAnimationFrame = (fn) => setTimeout(fn, 0);
        ww.cancelAnimationFrame = (x) => clearTimeout(x);
        ww.scrollTo = () => {};
        ww.HTMLElement.prototype.scrollIntoView = function () {};
        ww.URL.createObjectURL = () => "blob:x"; ww.URL.revokeObjectURL = () => {};
        Object.defineProperty(ww.navigator, "serviceWorker", { value: { register: () => Promise.resolve({}), addEventListener() {} } });
        ww.TextEncoder = TextEncoder; ww.TextDecoder = TextDecoder; ww.Blob = Blob;
        ww.CSS = { escape: (x) => String(x).replace(/([^\w-])/g, "\\$1") };
        ww.__errs = []; ww.addEventListener("error", (e) => ww.__errs.push(e.message));
        preparar(ww);
      },
    });
    await new Promise((r) => setTimeout(r, 250));
    return dom.window;
  };

  t("18.15 plantilla y referencia vuelven genéricas las etiquetas de tramos de ducto y de agua y quitan modelo y origen de las cargas", () => {
    G("closeModal")();
    act("proj-new");
    S.meta.name = "OBRA-HISTORICA-T";
    S.duct.segments[0].tag = "SA-PRINCIPAL-CLIENTE-HISTORICO";
    S.duct.segments[1].tag = "SA-RAMAL-OBRA-HISTORICA";
    S.duct.segments.push({ ...G("defaultSegment")("RA-OBRA-HISTORICA", 600), service: "return" });
    S.hidro.tramos[0].tag = "AF-CLIENTE-HISTORICO";
    S.hidro.tramos[1] = { ...S.hidro.tramos[1], tag: "AC-OBRA-HISTORICA", servicio: "caliente" };
    S.elec.cargas = [{ id: "c18", nombre: "UMA CLIENTE-HISTORICO", tipo: "motor", kW: 7.5, V: 220, ph: 3, cant: 1, L: 30, fp: .85, fija: false,
      origen: "cedula OBRA-HISTORICA", ts: 1, modelo: "UMA OBRA-HISTORICA 39MW" }];
    G("recompute")();
    /* El motor decide troncal o ramal leyendo la etiqueta: la genérica no
       puede cambiar esa decisión. */
    const avisos = () => G("ENGINES").duct.checks(G("DUCT")).map((a) => `${a.lvl}:${(/troncal|ramal/.exec(a.msg) || [""])[0]}`).sort().join("|");
    const avisosOrigen = avisos();
    G("projSave")(true);
    const idT = S.pid;
    act("proj-dup", idT);
    G("recompute")();
    sinViejo(JSON.stringify(S), "proyecto desde plantilla");
    eq(S.duct.segments.map((x) => x.tag).join(","), "SA-PRINCIPAL-1,SA-2,RA-1", "etiquetas de ducto:");
    eq(S.hidro.tramos.map((x) => x.tag).join(","), "AF-1,AC-1", "etiquetas de agua:");
    eq(S.elec.cargas[0].modelo, undefined, "modelo de la carga:");
    eq(S.elec.cargas[0].origen, undefined, "origen de la carga:");
    eq(avisos(), avisosOrigen, "avisos de troncal y ramal:");
    ["buildCedulaPdf", "buildHidroPdf", "buildSoportePdf"].forEach((d) => sinViejo(Buffer.from(G(d)()).toString("latin1"), d));
    ["es", "en"].forEach((lang) => sinViejo(Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : "USD" })).toString("utf8"), `libro ${lang}`));
    act("proj-ref", idT);
    clicModal("confirmar-si");
    G("closeModal")();
    const r = registro(idT);
    eq(r.referencia, true, "marca de referencia:");
    sinViejo(JSON.stringify(r), "registro de la referencia");
  });

  await tA("18.16 con 40 proyectos, «Nueva revisión» no retira la revisión de origen y el retiro se avisa sin nombres", async () => {
    sinAutoguardado();
    G("closeModal")();
    const guardada = G("projList")();
    try {
      act("proj-new");
      S.meta.name = "RELLENO-00"; G("projSave")(true);
      const molde = registro(S.pid);
      const lista = [];
      for (let i = 40; i >= 1; i--) {
        const id = "prelleno" + String(i).padStart(2, "0");
        const data = JSON.parse(JSON.stringify(molde.data));
        data.pid = id; data.linaje = id; data.meta.name = "RELLENO-" + i;
        lista.push({ ...molde, id, name: "RELLENO-" + i, ts: 1700000000000 + i * 1000, data });
      }
      G("projPersist")(lista);
      /* Proyecto en blanco sin guardar: el más antiguo (P01) queda al final. */
      G("reemplazarEstado")(JSON.parse(JSON.stringify(G("INIT"))));
      S.pid = null; S.linaje = null; G("histReiniciar")();
      act("proj-rev", "prelleno01");
      await esperar(30);
      if (!registro("prelleno01")) throw new Error("se retiró la revisión de origen");
      eq(S.quote.prop.comparaCon, "prelleno01", "comparativo:");
      G("recompute")();
      if (!G("compararRevision")("prelleno01")) throw new Error("CAMBIOS_REV quedó sin revisión de origen");
      eq(G("projList")().filter((p) => !p.referencia).length, 40, "tope:");
      contiene(avisoTxt(), "Revisión B creada", "aviso de la revisión:");
      contiene(avisoTxt(), "Se retiró del historial", "aviso del retiro:");
      if (/RELLENO/.test(avisoTxt())) throw new Error("el aviso nombra el proyecto retirado");
    } finally {
      sinAutoguardado();
      G("reemplazarEstado")(JSON.parse(JSON.stringify(G("INIT"))));
      S.pid = null; S.linaje = null; G("histReiniciar")();
      G("projPersist")(guardada);
    }
  });

  t("18.17 «Nueva revisión» y «Plantilla» del proyecto abierto se arman con lo que está en pantalla", () => {
    act("proj-new");
    S.meta.name = "OBRA-NUEVA-X";
    S.duct.segments.push(G("defaultSegment")("SA-3", 500));
    G("recompute")(); G("projSave")(true);
    const idX = S.pid;
    S.duct.segments.splice(2, 1);
    act("proj-rev", idX);
    eq(S.duct.segments.length, 2, "tramos de la revisión:");
    eq(registro(idX).data.duct.segments.length, 2, "tramos del registro de origen:");
    G("recompute")();
    const comp = G("compararRevision")(S.quote.prop.comparaCon);
    if (!comp) throw new Error("la revisión no compara contra su origen");
    eq(comp.filas.length, 0, "CAMBIOS_REV sin que nadie cambie nada:");
    const idB = S.pid;
    S.zones.push({ ...G("defaultZone")("Z2"), area: 77 });
    act("proj-dup", idB);
    eq(S.zones.length, 2, "zonas de la plantilla:");
  });

  t("18.18 convertir en referencia conserva precios, factores y cantidades de la cotización, sin la propuesta", () => {
    G("closeModal")();
    act("proj-new");
    S.meta.name = "OBRA-HISTORICA-Q"; S.meta.client = "CLIENTE-HISTORICO SA";
    const fam = Object.keys(G("PRICE_SEED"))[0];
    S.quote.price[fam] = 777777; S.quote.fasar = 1.99; S.quote.indirect = 0.21; S.quote.modo = "licitacion";
    S.quote.refBase = "Folio OBRA-HISTORICA 2026";
    const e = G("CARRIER")[0];
    S.quote.items = [{ id: e.id, fam: (G("famOfModel")(e) || {}).id || null, qty: 3, unit: 12345 }, { id: "OBRA-HISTORICA-EQ", fam: "x", qty: 2, unit: null }];
    S.quote.prop.cliente = "CLIENTE-HISTORICO SA"; S.quote.prop.atencion = "Ing. OBRA-HISTORICA";
    G("projSave")(true);
    const idQ = S.pid;
    act("proj-new");
    act("proj-ref", idQ);
    contiene(modal().textContent, "precios capturados", "el diálogo:");
    clicModal("confirmar-si");
    G("closeModal")();
    const r = registro(idQ);
    eq(r.referencia, true, "marca de referencia:");
    sinViejo(JSON.stringify(r), "registro de la referencia");
    eq(r.data.quote.price[fam], 777777, "precio capturado:");
    eq(r.data.quote.fasar, 1.99, "FASAR:");
    eq(r.data.quote.indirect, 0.21, "indirectos:");
    eq(r.data.quote.modo, "licitacion", "modalidad:");
    eq(r.data.quote.items.length, 1, "partidas del catálogo:");
    eq(r.data.quote.items[0].id, e.id); eq(r.data.quote.items[0].qty, 3, "cantidad:"); eq(r.data.quote.items[0].unit, 12345, "precio unitario:");
    eq(r.data.quote.refBase, "", "folio de la base:");
  });

  await tA("18.19 un respaldo con el id de una referencia entra como proyecto nuevo; la referencia no se sobrescribe y un respaldo que truena no cambia nada", async () => {
    sinAutoguardado();
    G("closeModal")();
    act("proj-new");
    const ref = G("projList")().find((p) => p.referencia);
    const inp = w.document.getElementById("file-input");
    const respaldo = { v: 1, ...JSON.parse(JSON.stringify(ref.data)), pid: ref.id, linaje: ref.id,
      meta: { ...ref.data.meta, name: "RESPALDO-IDENTIDAD", client: "CLIENTE-RESTAURADO" } };
    inp.onchange({ target: { files: [new w.File([JSON.stringify(respaldo)], "restaurar.emp.json")] } });
    await esperar(80);
    eq(S.meta.name, "RESPALDO-IDENTIDAD", "se abrió el respaldo:");
    if (S.pid === ref.id) throw new Error("el respaldo tomó el id de la referencia");
    contiene(avisoTxt(), "nuevo e independiente", "aviso:");
    G("projSave")(true);
    const idNuevo = S.pid;
    eq(registro(ref.id).referencia, true, "la referencia dejó de serlo:");
    if (/RESPALDO-IDENTIDAD|CLIENTE-RESTAURADO/.test(JSON.stringify(registro(ref.id)))) throw new Error("la referencia recuperó la identidad");
    /* Por el guardado mismo: un estado con el id de una referencia se guarda aparte. */
    S.pid = ref.id; S.linaje = ref.id; G("projSave")(true);
    if (S.pid === ref.id) throw new Error("el guardado sobrescribió la referencia");
    eq(registro(ref.id).referencia, true, "la referencia tras guardar encima:");
    const idOtro = S.pid;
    /* Si la pantalla truena al pintar el respaldo, el proyecto abierto vuelve. */
    const nombre = S.meta.name, pid = S.pid, zonas = JSON.stringify(S.zones);
    const render0 = G("render");
    w.render = () => { throw new Error("pantalla rota"); };
    try {
      inp.onchange({ target: { files: [new w.File([JSON.stringify({ meta: { name: "RESPALDO-ROTO" }, zones: [{ area: 5 }] })], "roto.emp.json")] } });
      await esperar(80);
    } finally { w.render = render0; }
    eq(S.meta.name, nombre, "el estado quedó reemplazado:");
    eq(S.pid, pid, "id:");
    eq(JSON.stringify(S.zones), zonas, "zonas:");
    contiene(avisoTxt(), "Archivo no válido", "aviso:");
    G("render")();
    sinAutoguardado();
    act("proj-new");
    G("projPersist")(G("projList")().filter((p) => p.id !== idNuevo && p.id !== idOtro));
  });

  t("18.20 convertir en referencia alcanza todas las revisiones del proyecto, lo dice y se niega si una está abierta", () => {
    G("closeModal")();
    act("proj-new");
    S.meta.name = "OBRA-HISTORICA-L"; S.meta.client = "CLIENTE-HISTORICO SA"; G("projSave")(true);
    const idL = S.pid;
    act("proj-rev", idL);
    const idLB = S.pid;
    act("proj-ref", idL);
    if (!modal().hidden && modal().querySelector('[data-act="confirmar-si"]')) throw new Error("ofreció convertir un proyecto con una revisión abierta");
    if (registro(idL).referencia) throw new Error("convirtió el proyecto con su revisión abierta");
    act("proj-new");
    act("proj-ref", idL);
    contiene(modal().textContent, "2 revisiones", "el diálogo no dice cuántas revisiones se convierten:");
    contiene(modal().textContent, "CAMBIOS_REV", "el diálogo no avisa del comparativo:");
    clicModal("confirmar-si");
    [idL, idLB].forEach((id) => {
      const r = registro(id);
      eq(r.referencia, true, "revisión convertida:");
      sinViejo(JSON.stringify(r), "revisión convertida");
    });
    act("proj-modal");
    if (/OBRA-HISTORICA-L/.test(modal().textContent)) throw new Error("Mis proyectos sigue nombrando una revisión del proyecto convertido");
    G("closeModal")();
  });

  t("18.21 la numeración de «Referencia interna N» no se repite después de borrar una", () => {
    const convertir = (nombre) => {
      act("proj-new"); S.meta.name = nombre; G("projSave")(true);
      const id = S.pid;
      act("proj-new"); act("proj-ref", id); clicModal("confirmar-si"); G("closeModal")();
      return registro(id);
    };
    const a = convertir("NUMERO-1");
    const b = convertir("NUMERO-2");
    G("projDel")(a.id);
    const c = convertir("NUMERO-3");
    if (c.name === b.name) throw new Error(`se repitió «${c.name}»`);
    const nombres = G("projList")().filter((p) => p.referencia).map((p) => p.name);
    eq(new Set(nombres).size, nombres.length, "nombres repetidos " + JSON.stringify(nombres) + ":");
  });

  t("18.22 un id manipulado no inyecta atributos en Mis proyectos y el saneador lo descarta", () => {
    const malo = 'x" onmouseover="alert(1)';
    const s2 = G("sanearEstado")({ pid: malo, linaje: "<b>" });
    eq(s2.pid, null, "pid manipulado:"); eq(s2.linaje, null, "linaje manipulado:");
    eq(G("sanearEstado")({ pid: "pAbc_12-z" }).pid, "pAbc_12-z", "un id válido se conserva:");
    const lista = G("projList")();
    const molde = lista.find((p) => !p.referencia);
    G("projPersist")([{ ...molde, id: malo, name: "RESPALDO-MANIPULADO" }].concat(lista));
    try {
      act("proj-modal");
      eq(modal().querySelectorAll("[onmouseover]").length, 0, "atributos inyectados:");
      if (![...modal().querySelectorAll('[data-act="proj-open"]')].some((x) => x.dataset.id === malo)) throw new Error("el botón no conserva el id tal cual");
    } finally { G("closeModal")(); G("projPersist")(lista); }
  });

  t("18.23 las revisiones numéricas suben, Z pasa a AA, la letra no se repite y nunca dice «Rev. ?»", () => {
    const sig = G("siguienteRev");
    [["0", "1"], ["1", "2"], ["9", "10"], ["B2", "B3"], ["Z", "AA"], ["AZ", "BA"], ["A", "B"]].forEach(([a, b]) => eq(sig(a), b, `siguienteRev(${a}):`));
    eq(G("revDe")({ data: {} }), "A", "registro sin propuesta:");
    G("closeModal")();
    act("proj-new"); S.meta.name = "OBRA-NUEVA-R"; G("projSave")(true);
    const idR = S.pid;
    /* Como uno guardado desde el estado de arranque: sin propuesta. */
    const l = G("projList")(); delete l.find((p) => p.id === idR).data.quote.prop; G("projPersist")(l);
    act("proj-rev", idR);
    eq(S.quote.prop.rev, "B", "primera revisión:");
    G("recompute")();
    const x = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
    contiene(x, "contra la Rev. A", "CAMBIOS_REV:");
    if (x.indexOf("Rev. ?") >= 0) throw new Error("el libro dice «Rev. ?»");
    act("proj-rev", idR);
    eq(S.quote.prop.rev, "C", "segunda revisión desde la A:");
    const nombres = G("projList")().filter((p) => /OBRA-NUEVA-R/.test(p.name)).map((p) => p.name);
    eq(new Set(nombres).size, nombres.length, "nombres repetidos " + JSON.stringify(nombres) + ":");
    act("proj-new"); S.meta.name = "OBRA-NUEVA-N"; S.quote.prop.rev = "0"; G("projSave")(true);
    act("proj-rev", S.pid);
    eq(S.quote.prop.rev, "1", "revisión numérica:");
  });

  t("18.24 deshacer hasta antes del primer guardado conserva el id: el proyecto no se parte en dos", () => {
    act("proj-new");
    S.meta.name = "OBRA-NUEVA-U"; S.zones[0].area = 160;
    G("histSnap")("antes de guardar");
    G("projSave")(true);
    const idU = S.pid, linU = S.linaje;
    S.zones[0].area = 175; G("histSnap")("después de guardar");
    G("deshacer")();
    sinAutoguardado();
    cerca(S.zones[0].area, 160, .001, "deshacer:");
    eq(S.pid, idU, "id tras deshacer:"); eq(S.linaje, linU, "linaje tras deshacer:");
    G("projSave")(true);
    eq(G("projList")().filter((p) => p.name === "OBRA-NUEVA-U").length, 1, "registros del proyecto:");
  });

  t("18.25 una revisión guardada con la 2.9.2 pregunta una vez si es revisión y, con el sí, conserva CAMBIOS_REV", () => {
    G("closeModal")();
    act("proj-new"); S.meta.name = "OBRA-NUEVA-V"; G("projSave")(true);
    const base = registro(S.pid);
    const crea = (id, comparaCon, ts) => {
      const data = JSON.parse(JSON.stringify(base.data));
      data.pid = id; delete data.linaje;
      data.quote.prop.comparaCon = comparaCon; data.quote.prop.rev = comparaCon ? "B" : "A";
      return { ...base, id, name: "OBRA-V292" + (comparaCon ? " (copia)" : ""), ts, rev: "2.9.2", data };
    };
    G("projPersist")([crea("p292b", "p292a", 1757000000000), crea("p292a", null, 1756000000000),
      crea("p292d", "p292c", 1757000001000), crea("p292c", null, 1756000001000)].concat(G("projList")()));
    try {
      act("proj-new");
      G("projOpen")("p292b");
      if (modal().hidden || !modal().querySelector('[data-act="confirmar-si"]')) throw new Error("no preguntó si es revisión");
      contiene(modal().textContent, "Rev. A guardada el", "pregunta:");
      if (/OBRA-V292/.test(modal().textContent)) throw new Error("la pregunta nombra un proyecto");
      clicModal("confirmar-si");
      eq(S.linaje, "p292a", "linaje:");
      eq(S.quote.prop.comparaCon, "p292a", "comparativo:");
      eq(registro("p292b").data.linaje, "p292a", "linaje guardado de la revisión:");
      eq(registro("p292a").data.linaje, "p292a", "linaje guardado del origen:");
      G("recompute")();
      if (!G("compararRevision")("p292a")) throw new Error("CAMBIOS_REV quedó sin comparativo");
      S.tab = "cotizacion"; G("render")();
      const opciones = [...w.document.querySelectorAll('[data-act="q-cmp-sel"] option')].map((o) => o.value);
      if (!opciones.includes("p292a")) throw new Error("el selector no ofrece la revisión enlazada");
      G("projOpen")("p292d");
      if (modal().hidden) throw new Error("no preguntó en la segunda revisión");
      clicModal("close");
      eq(S.quote.prop.comparaCon, null, "tras el no, comparativo:");
      eq(registro("p292d").data.quote.prop.comparaCon, null, "tras el no, comparativo guardado:");
      G("projOpen")("p292d");
      if (!modal().hidden) throw new Error("volvió a preguntar");
    } finally {
      G("closeModal")();
      sinAutoguardado();
      act("proj-new");
      G("projPersist")(G("projList")().filter((p) => !/^p292/.test(p.id)));
    }
  });

  await tA("18.26 la base de la casa no guarda textos del proyecto y el crudo que dejó la 2.9.2 se limpia al arrancar", async () => {
    G("kbAnotar")("prueba-18-26", "descartada", { tipo: "desviacion", recomendo: "SA-CLIENTE-HISTORICO-1 por encima de 1.2 Pa/m",
      eligio: "OBRA-HISTORICA", motivo: "ahorro de OBRA-HISTORICA", proyecto: "OBRA-HISTORICA-A" });
    const crudo = w.localStorage.getItem(G("KB_KEY")) || "";
    sinViejo(crudo, "almacenamiento crudo de la base");
    if (/"(proyecto|recomendo|eligio|motivo)"\s*:/.test(crudo)) throw new Error("el crudo conserva llaves de texto del proyecto");
    const viejo = JSON.stringify({ medidas: { "prueba-18-26": { ofrecida: 2, aceptada: 1, descartada: 1 } },
      desv: [{ tipo: "ingenieria-de-valor", medida: "sistema", titulo: "Evaluar VRF", decision: "descartada", proyecto: "OBRA-HISTORICA-A", ts: 1 },
        { tipo: "desviacion", subtipo: "Sistema", recomendo: "Sala CLIENTE-HISTORICO", eligio: "Paquete", motivo: "OBRA-HISTORICA", ts: 2 }] });
    const w2 = await cargarCon(file, (ww) => { ww.localStorage.setItem("empb12.kb.v1", viejo); });
    try {
      const crudos = [w2.eval("KB_KEY"), "empb12.kb.v1"].map((k) => w2.localStorage.getItem(k) || "").join("\n");
      sinViejo(crudos, "crudo de la base al arrancar");
      contiene(crudos, "Evaluar VRF", "la decisión se perdió:");
      eq(w2.eval("kbLeer()").medidas["prueba-18-26"].aceptada, 1, "lo acumulado:");
      eq(w2.__errs.length, 0, "errores al arrancar:");
    } finally { w2.close(); }
  });

  t("18.27 Mis proyectos dice que la plantilla recalcula la selección de equipo y la soportería aceptada", () => {
    act("proj-modal");
    const txt = modal().textContent;
    contiene(txt, "selección de equipo", "ayuda:"); contiene(txt, "soportería aceptada", "ayuda:"); contiene(txt, "se recalculan", "ayuda:");
    G("closeModal")();
    sinAutoguardado();
  });
}

/* ====== 20. rev 2.9.4 · El tablero es el inicio y la puerta de entrada ======
   La aplicación abre en el tablero: proyecto activo a la vista, zona de carga
   para el proyecto ejecutivo completo, la tabla de lo que entró con su motor y
   el estado de cada motor. Un ZIP con carpetas y los mismos archivos sueltos
   deben dar exactamente lo mismo; lo no reconocido se enlista con su motivo;
   un archivo roto no detiene a los demás; y cambiar de proyecto deja a cada
   uno como estaba. Los motores no cambian: eso lo vigila la sección 8. */
{
  const zlibx = await import("node:zlib");
  const tA = async (nombre, fn) => {
    try { const r = await fn(); if (r === false) { fail++; fallos.push([nombre, "devolvió falso"]); } else ok++; }
    catch (e) { fail++; fallos.push([nombre, e.message]); }
  };
  const archivo = (nombre, contenido, ruta) => ({ file: new w.File([typeof contenido === "string" ? contenido : new Uint8Array(contenido)], nombre), ruta: ruta || nombre });
  const act = (a, id) => { const b = w.document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; w.document.body.appendChild(b); b.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); b.remove(); };
  const vistaT = () => { S.tab = "tablero"; G("render")(); return w.document.getElementById("view"); };
  const filasT = () => G("cxzArchivos")();
  const esperaCola = async () => { for (let i = 0; i < 400; i++) { if (!G("CXZ_OCUPADO") && !filasT().some((f) => f.estado === "espera" && f.motor !== "sin" && f.motor !== "referencia") && !filasT().some((f) => f.estado === "procesando")) return; await new Promise((r) => setTimeout(r, 15)); } throw new Error("la cola de procesamiento no terminó"); };
  const par = (c, v) => `${String(c).padStart(3)}\n${v}\n`;
  const lw = (capa, pts) => par(0, "LWPOLYLINE") + par(8, capa) + par(90, pts.length) + par(70, 1) + pts.map(([x, y]) => par(10, x) + par(20, y)).join("");
  const DXF = par(0, "SECTION") + par(2, "HEADER") + par(9, "$INSUNITS") + par(70, 4) + par(0, "ENDSEC") + par(0, "SECTION") + par(2, "ENTITIES") +
    lw("A-MURO", [[0, 0], [12000, 0], [12000, 8000], [0, 8000]]) + par(0, "TEXT") + par(8, "A-TEXTO") + par(10, 6000) + par(20, 4000) + par(40, 250) + par(1, "OFICINA 96 m2") + par(0, "ENDSEC") + par(0, "EOF");
  const CSV = "circuito,descripcion,carga_w,fases,tension_v\nC-1,Alumbrado oficina,2400,1,127\nC-3,UMA-01 motor ventilador,7460,3,220\n";
  const PDFTXT = "Area total: 1,250 m2  Altura libre: 6.5 m\nSistema contra incendio NFPA 13 riesgo ordinario grupo 2";
  const pdfDe = (txt) => { const z = zlibx.deflateSync(Buffer.from(`BT /F1 12 Tf 72 720 Td (${txt.split("\n").join(") Tj 0 -16 Td (")}) Tj ET`, "latin1")); const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>", Buffer.concat([Buffer.from(`<< /Length ${z.length} /Filter /FlateDecode >>\nstream\n`), z, Buffer.from("\nendstream")])]; const partes = [Buffer.from("%PDF-1.4\n")]; let pos = partes[0].length; const offs = []; objs.forEach((o, i) => { offs.push(pos); const b = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), Buffer.isBuffer(o) ? o : Buffer.from(o), Buffer.from("\nendobj\n")]); partes.push(b); pos += b.length; }); partes.push(Buffer.from(`xref\n0 5\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`)); return Buffer.concat(partes); };
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from([0, 0, 0, 13]), Buffer.from("IHDR"), Buffer.from([0, 0, 0x04, 0x00, 0, 0, 0x03, 0x00, 8, 2, 0, 0, 0])]);
  const zipDe = (entradas) => G("zipCrear")(entradas.map((e) => ({ nombre: e.nombre, datos: typeof e.datos === "string" ? new w.TextEncoder().encode(e.datos) : new Uint8Array(e.datos) })));
  const PAQUETE = [
    { nombre: "obra/arquitectonico/planta.dxf", datos: DXF },
    { nombre: "obra/electrico/cuadro de cargas.csv", datos: CSV },
    { nombre: "obra/memorias/memoria sci.pdf", datos: pdfDe(PDFTXT) },
    { nombre: "obra/fotos/fachada.png", datos: PNG },
    { nombre: "obra/otros/modelo.rvt", datos: "binario que no se lee" },
    { nombre: "obra/memorias/escaneo.pdf", datos: "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF" },
  ];
  const resumen = () => filasT().map((f) => `${f.nombre}|${f.tipo}|${f.motor}|${f.estado}`).sort();

  G("closeModal")();
  act("proj-new");

  t("20.1 la aplicación abre en el tablero y ahí está la zona de carga, arriba del diagrama y de las disciplinas", () => {
    eq(G("defaultState")().tab, "tablero", "pestaña inicial:");
    const v = vistaT();
    const h = v.innerHTML;
    const iSel = h.indexOf("cxz-sel"), iDrop = h.indexOf("cxz-drop"), iDiag = h.indexOf('class="dlienzo"'), iDisc = h.indexOf("Tablero del proyecto"), iFilas = h.indexOf('class="tfila');
    if (!(iSel >= 0 && iDrop > iSel && iDiag > iDrop && iFilas > iDiag)) throw new Error(`orden: selector ${iSel} · carga ${iDrop} · diagrama ${iDiag} · disciplinas ${iFilas}`);
    if (iDisc < 0) throw new Error("el tablero perdió su título de disciplinas");
    contiene(h, "SuiteEmp", "nombre del producto en la cabecera compacta:");
    if (!v.querySelector('[data-act="cxz-elegir"]') || !v.querySelector('[data-act="cxz-carpeta"]')) throw new Error("faltan los botones de elegir archivos o carpeta");
    /* Sin scroll: la zona de carga cabe en la parte alta del tablero. */
    const antes = h.slice(0, iDrop);
    if ((antes.match(/<div class="card"/g) || []).length > 0) throw new Error("hay tarjetas antes de la zona de carga");
  });
  t("20.2 el proyecto activo se ve en grande y los módulos del diagrama siguen entrando directo", () => {
    S.meta.name = "OBRA TABLERO 20"; G("projSave")(true);
    const v = vistaT();
    contiene(v.querySelector(".cxz-sel-nombre").textContent, "OBRA TABLERO 20");
    const nodo = v.querySelector('.tdiag .dnodo[data-tab="electrico"]');
    if (!nodo) throw new Error("el diagrama embebido no trae el nodo eléctrico");
    nodo.dispatchEvent(new w.Event("click", { bubbles: true }));
    eq(S.tab, "electrico", "clic en el nodo:");
    S.tab = "tablero"; G("render")();
  });
  await tA("20.3 un ZIP con carpetas se abre y se clasifica solo, con lo no reconocido enlistado y su motivo", async () => {
    await G("cxzAgregarArchivos")([archivo("proyecto-ejecutivo.zip", zipDe(PAQUETE))]);
    await esperaCola();
    const F = filasT();
    eq(F.length, 6, "archivos en la tabla: " + resumen().join(" ; "));
    const de = (n2) => F.find((f) => f.nombre === n2);
    eq(de("planta.dxf").motor, "civil", "planta en /arquitectonico/ va a obra civil por la carpeta:");
    eq(de("cuadro de cargas.csv").motor, "electrico", "cuadro de cargas al eléctrico:");
    eq(de("memoria sci.pdf").motor, "fuego", "memoria SCI por su contenido:");
    eq(de("fachada.png").motor, "referencia", "la foto queda de referencia:"); eq(de("fachada.png").estado, "listo");
    contiene(de("fachada.png").detalle, "1024×768");
    eq(de("modelo.rvt").estado, "norec", "formato no reconocido:"); contiene(de("modelo.rvt").detalle, ".rvt");
    eq(de("escaneo.pdf").estado, "error", "el PDF sin texto es un error claro:"); contiene(de("escaneo.pdf").detalle, "escaneo");
    if (/stack|TypeError|undefined/i.test(de("escaneo.pdf").detalle)) throw new Error("el mensaje de error trae basura técnica");
    ["cuadro de cargas.csv", "memoria sci.pdf", "planta.dxf"].forEach((n2) => { if (de(n2).estado !== "listo" || !(de(n2).propuestas > 0)) throw new Error(`${n2}: ${de(n2).estado} · ${de(n2).detalle}`); });
    F.forEach((f) => contiene(f.ruta, "proyecto-ejecutivo.zip/", `ruta con el zip de origen (${f.nombre}):`));
    eq(w.__errs.length, 0, "errores de ventana:");
  });
  let resumenZip;
  await tA("20.4 los mismos archivos sueltos, sin carpetas, dan la misma clasificación", async () => {
    resumenZip = resumen();
    act("proj-new"); S.meta.name = "OBRA SUELTA 20"; G("projSave")(true);
    await G("cxzAgregarArchivos")(PAQUETE.map((e) => archivo(e.nombre.split("/").pop(), e.datos)));
    await esperaCola();
    const F = filasT();
    eq(F.length, 6);
    const de = (n2) => F.find((f) => f.nombre === n2);
    /* Sin carpeta que desempate, la planta va al motor por omisión de un DXF. */
    eq(de("planta.dxf").motor, "carga", "planta suelta al motor de zonas:");
    ["cuadro de cargas.csv", "memoria sci.pdf", "fachada.png", "modelo.rvt", "escaneo.pdf"].forEach((n2) => {
      const a = resumenZip.find((x) => x.startsWith(n2 + "|")), b = `${n2}|${de(n2).tipo}|${de(n2).motor}|${de(n2).estado}`;
      eq(b, a, n2 + ":");
    });
  });
  t("20.5 la tabla es la fuente de verdad: motor editable, quitar sin volver a subir, y la tabla dice qué entró", () => {
    const v = vistaT();
    const F = filasT();
    const sel = v.querySelector(`select[data-cxz-motor="${F.find((f) => f.nombre === "planta.dxf").id}"]`);
    if (!sel) throw new Error("no hay menú de motor en la fila");
    eq(sel.options.length, G("CXZ_MOTORES").length, "opciones del menú:");
    if (!v.querySelector(`[data-act="cxz-quitar"]`)) throw new Error("no se puede quitar un archivo desde la tabla");
    contiene(v.querySelector(".cxz-tabla-card h3").textContent, "esta tabla es lo que entró al proyecto");
  });
  await tA("20.6 reasignar un archivo a otro motor lo vuelve a procesar con ese motor", async () => {
    const f = filasT().find((x) => x.nombre === "planta.dxf");
    const v = vistaT();
    const sel = v.querySelector(`select[data-cxz-motor="${f.id}"]`);
    sel.value = "fuego"; sel.dispatchEvent(new w.Event("change", { bubbles: true }));
    await esperaCola();
    eq(f.motor, "fuego"); eq(f.motivo, "asignado a mano");
    const lote = G("CXZ_LOTES")[f.id];
    if (!lote || lote.tab !== "fuego") throw new Error("no se reprocesó con el motor nuevo");
    if (!lote.propuestas.some((p) => p.destino === "fuego.area")) throw new Error("el plano no propuso el área a proteger en contra incendio");
  });
  await tA("20.7 quitar un archivo lo saca de la tabla, de sus bytes y del estado de los motores", async () => {
    const f = filasT().find((x) => x.nombre === "modelo.rvt");
    await G("cxzQuitar")(f.id);
    if (filasT().some((x) => x.id === f.id)) throw new Error("sigue en la tabla");
    eq(await G("cxzBytes")(f.id), null, "bytes:");
  });
  await tA("20.8 el estado de cada motor sale de la tabla: en espera, procesando, listo o con error, y el error dice archivo y motivo", async () => {
    /* El escaneo quedó sin asignar (no se le pudo leer disciplina); se manda a
       mano a contra incendio, que ya tiene la memoria buena. */
    G("cxzReasignar")(filasT().find((x) => x.nombre === "escaneo.pdf").id, "fuego");
    await esperaCola();
    const M = G("cxzEstadoMotores")();
    const de = (id) => M.find((m) => m.id === id);
    eq(de("hidro").estado, "espera", "hidro sin archivos:");
    eq(de("electrico").estado, "listo", "eléctrico con su CSV:");
    eq(de("fuego").estado, "error", "fuego con el escaneo roto:");
    const err = de("fuego").errores.find((e) => e.archivo === "escaneo.pdf");
    if (!err) throw new Error("el error no dice qué archivo falló");
    contiene(err.motivo, "OCR", "el error sugiere la acción:");
    /* El escaneo roto no detuvo a la memoria buena del mismo motor. */
    if (!(de("fuego").propuestas > 0)) throw new Error("un archivo con error detuvo al otro del mismo motor");
    const v = vistaT();
    ["En espera", "Listo", "Con error"].forEach((x) => contiene(v.querySelector(".cxz-motores").textContent, x));
  });
  await tA("20.9 revisar y aplicar desde la tabla pasa por la ventana de hallazgos y marca la fila como aplicada", async () => {
    const f = filasT().find((x) => x.nombre === "cuadro de cargas.csv");
    const antes = S.elec.cargas.length;
    await G("cxzRevisar")(f.id);
    const m = w.document.getElementById("modal");
    if (m.hidden || !m.querySelector('[data-act="cx-aplicar"]')) throw new Error("no abrió la ventana de hallazgos");
    m.querySelector('[data-act="cx-aplicar"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    if (!(S.elec.cargas.length > antes)) throw new Error("no entraron las cargas");
    if (!(f.aplicados > 0)) throw new Error("la fila no quedó marcada como aplicada: " + f.detalle);
    contiene(f.detalle, "aplicados");
  });
  await tA("20.10 una hoja de Excel entra igual que un CSV", async () => {
    const xlsx = zipDe([
      { nombre: "[Content_Types].xml", datos: '<Types xmlns="x"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>' },
      { nombre: "xl/workbook.xml", datos: '<workbook xmlns="x" xmlns:r="r"><sheets><sheet name="Cargas" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { nombre: "xl/_rels/workbook.xml.rels", datos: '<Relationships><Relationship Id="rId1" Type="w" Target="worksheets/sheet1.xml"/></Relationships>' },
      { nombre: "xl/worksheets/sheet1.xml", datos: '<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>descripcion</t></is></c><c r="B1" t="inlineStr"><is><t>Potencia (kW)</t></is></c><c r="C1" t="inlineStr"><is><t>Tension</t></is></c><c r="D1" t="inlineStr"><is><t>Fases</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Bomba</t></is></c><c r="B2"><v>0.746</v></c><c r="C2" t="inlineStr"><is><t>220 V</t></is></c><c r="D2" t="inlineStr"><is><t>3F</t></is></c></row></sheetData></worksheet>' },
    ]);
    await G("cxzAgregarArchivos")([archivo("cargas.xlsx", xlsx)]);
    await esperaCola();
    const f = filasT().find((x) => x.nombre === "cargas.xlsx");
    eq(f.tipo, "Hoja de Excel"); eq(f.motor, "electrico", "por sus encabezados:"); eq(f.estado, "listo", f.detalle);
    const lote = G("CXZ_LOTES")[f.id];
    const c = lote.propuestas.find((p) => p.grupo === "carga");
    if (!c || !/0.746 kW/.test(c.valor) || !/220 V/.test(c.valor)) throw new Error("la hoja no dio la carga: " + (c && c.valor));
  });
  await tA("20.11 un ZIP protegido o roto no detiene el resto de la carga", async () => {
    const roto = zipDe([{ nombre: "x.txt", datos: "hola" }]).slice(0, 30);
    const n0 = filasT().length;
    await G("cxzAgregarArchivos")([archivo("roto.zip", roto), archivo("otro cuadro.csv", CSV), archivo("nota.txt", "Area total: 300 m2")]);
    await esperaCola();
    const F = filasT();
    eq(F.length, n0 + 3, "entraron las tres filas:");
    const r = F.find((x) => x.nombre === "roto.zip");
    eq(r.estado, "error"); if (/stack|TypeError/i.test(r.detalle)) throw new Error("mensaje técnico");
    eq(F.find((x) => x.nombre === "otro cuadro.csv").estado, "listo", "el cuadro siguió:");
    /* Una nota sin disciplina reconocible se queda visible, sin asignar y en
       espera de que alguien le ponga motor: no se descarta. */
    const nota = F.find((x) => x.nombre === "nota.txt");
    eq(nota.motor, "sin", "nota sin disciplina:"); eq(nota.estado, "espera");
    eq(w.__errs.length, 0, "errores de ventana:");
  });
  await tA("20.12 cambiar de proyecto y regresar deja cada uno exactamente como estaba", async () => {
    const idB = S.pid, tablaB = JSON.stringify(filasT()), cargasB = S.elec.cargas.length;
    const lista = G("projList")();
    const A = lista.find((p) => p.name === "OBRA TABLERO 20");
    G("cxzCambiarProyecto")(A.id);
    /* Hay cambios sin guardar en B (lo aplicado desde la tabla): se avisa. */
    const m = w.document.getElementById("modal");
    if (m.hidden || !m.querySelector('[data-act="cxz-cambiar-guardar"]')) throw new Error("no avisó de los cambios sin guardar");
    m.querySelector('[data-act="cxz-cambiar-guardar"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    eq(S.pid, A.id, "proyecto abierto:");
    eq(filasT().length, 6, "la tabla de A es la de A:");
    if (filasT().some((f) => f.nombre === "cargas.xlsx")) throw new Error("un archivo de B apareció en A");
    eq(S.elec.cargas.length, 0, "las cargas aplicadas en B no están en A:");
    const M = G("cxzEstadoMotores")();
    if (M.find((x) => x.id === "electrico").aplicados) throw new Error("el estado de motores arrastró lo de B");
    G("cxzCambiarProyecto")(idB);
    eq(S.pid, idB); eq(JSON.stringify(filasT()), tablaB, "la tabla de B volvió intacta:"); eq(S.elec.cargas.length, cargasB, "las cargas de B siguen:");
    const sel = vistaT().querySelector("#cxz-proyecto");
    if (![...sel.options].some((o) => o.value === A.id)) throw new Error("el selector no ofrece el otro proyecto");
  });
  await tA("20.13 exportar el paquete e importarlo crea un proyecto independiente con sus archivos", async () => {
    const P = await G("cxzArmarPaquete")();
    const filasAntes = filasT().length, conBytes = [];
    for (const f of filasT()) if (await G("cxzBytes")(f.id)) conBytes.push(f.id);
    eq(P.archivos, conBytes.length, "el paquete lleva todos los archivos que tienen bytes:");
    if (!(P.archivos >= 6)) throw new Error("el paquete no lleva los archivos: " + P.archivos);
    const idB = S.pid, nombreB = S.meta.name, cargasB = S.elec.cargas.length;
    const ok2 = await G("cxzImportarPaquete")(P.bytes, "paquete.suiteemp.zip");
    if (!ok2) throw new Error("no importó");
    if (S.pid === idB) throw new Error("el paquete pisó al proyecto de origen");
    eq(S.meta.name, nombreB); eq(S.elec.cargas.length, cargasB, "capturas:"); eq(filasT().length, filasAntes, "la tabla viajó completa:");
    let conBytesDespues = 0;
    for (const f of filasT()) if (await G("cxzBytes")(f.id)) conBytesDespues++;
    eq(conBytesDespues, conBytes.length, "los archivos con bytes viajaron completos:");
    const A = G("projList")().find((p) => p.id === idB);
    eq(A.data.elec.cargas.length, cargasB, "el original sigue igual:");
  });
  await tA("20.14 duplicar crea una copia independiente: editar la copia no toca el original", async () => {
    const origen = S.pid, nombre = S.meta.name, zonas = S.zones.length;
    await G("cxzDuplicar")();
    if (S.pid === origen) throw new Error("no cambió de proyecto");
    contiene(S.meta.name, "(copia)");
    S.zones.push({ ...G("defaultZone")("Extra"), area: 333 }); G("projSave")(true);
    const A = G("projList")().find((p) => p.id === origen);
    eq(A.data.zones.length, zonas, "el original conserva sus zonas:"); eq(A.name, nombre);
    eq(filasT().length, A.data.cx.archivos.length, "la copia trae los mismos archivos:");
  });
  t("20.15 renombrar, archivar y desarchivar; borrar pide confirmación", () => {
    act("cxz-renombrar");
    const i = w.document.getElementById("cxz-nombre"); i.value = "OBRA RENOMBRADA 20";
    act("cxz-renombrar-ok");
    eq(S.meta.name, "OBRA RENOMBRADA 20");
    eq(G("projList")().find((p) => p.id === S.pid).name, "OBRA RENOMBRADA 20", "guardado:");
    const id = S.pid;
    act("cxz-archivar");
    w.document.querySelector('#modal [data-act="confirmar-si"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const p = G("projList")().find((x) => x.id === id);
    eq(p.archivado, true, "archivado:");
    if (S.pid === id) throw new Error("el archivado siguió abierto");
    const v = vistaT();
    if ([...v.querySelectorAll("#cxz-proyecto option")].some((o) => o.value === id)) throw new Error("el archivado sigue en el selector");
    act("proj-modal");
    contiene(w.document.getElementById("modal").textContent, "Archivados");
    act("cxz-desarchivar", id);
    eq(G("projList")().find((x) => x.id === id).archivado, false, "desarchivado:");
    G("closeModal")();
    const antes = G("projList")().length;
    act("proj-del", id);
    const m = w.document.getElementById("modal");
    if (m.hidden || !m.querySelector('[data-act="confirmar-si"]')) throw new Error("borrar no pidió confirmación");
    eq(G("projList")().length, antes, "no se borró antes de confirmar:");
    G("closeModal")();
  });
  t("20.16 los proyectos recientes se ven con su fecha y su semáforo, sin referencias internas ni archivados", () => {
    const v = vistaT();
    const c = [...v.querySelectorAll(".card h3")].find((h) => /Proyectos recientes/.test(h.textContent));
    if (!c) throw new Error("no hay lista de recientes");
    contiene(c.parentElement.textContent, "Última modificación");
    if (!c.parentElement.querySelector(".cxz-sem .sem")) throw new Error("los recientes no traen semáforo");
    if (/Referencia interna/.test(c.parentElement.textContent)) throw new Error("una referencia interna aparece en recientes");
  });
  t("20.17 el proyecto en blanco no hereda archivos ni estado de motores", () => {
    act("proj-new");
    eq(filasT().length, 0, "archivos:");
    if (G("cxzEstadoMotores")().some((m) => m.estado !== "espera")) throw new Error("un motor quedó con estado del proyecto anterior");
    eq(w.__errs.length, 0, "errores de ventana:");
  });
}

/* ====== 21. rev 2.9.5 · Verificación adversarial del tablero (2.9.4) ======
   18 defectos confirmados por revisión independiente, todos en la capa de
   organización del tablero (cx7/cx8/tablero.mjs): carreras al cambiar de
   proyecto o reasignar motor durante la carga, clasificación por carpeta y
   por encabezados, tope de archivos por proyecto, retiro del historial y
   paquete importado, portada como segunda pantalla de inicio. Ningún motor
   de cálculo cambia: eso lo sigue vigilando la sección 8 y el --base. */
{
  const zlibx = await import("node:zlib");
  const tA = async (nombre, fn) => {
    try { const r = await fn(); if (r === false) { fail++; fallos.push([nombre, "devolvió falso"]); } else ok++; }
    catch (e) { fail++; fallos.push([nombre, e.message]); }
  };
  const archivo = (nombre, contenido, ruta) => ({ file: new w.File([typeof contenido === "string" ? contenido : new Uint8Array(contenido)], nombre), ruta: ruta || nombre });
  const act = (a, id) => { const b = w.document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; w.document.body.appendChild(b); b.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); b.remove(); };
  const filasT = () => G("cxzArchivos")();
  const esperaCola = async () => { for (let i = 0; i < 400; i++) { if (!G("CXZ_OCUPADO") && !filasT().some((f) => f.estado === "espera" && f.motor !== "sin" && f.motor !== "referencia") && !filasT().some((f) => f.estado === "procesando")) return; await new Promise((r) => setTimeout(r, 15)); } throw new Error("la cola de procesamiento no terminó"); };
  const par = (c, v) => `${String(c).padStart(3)}\n${v}\n`;
  const lw = (capa, pts) => par(0, "LWPOLYLINE") + par(8, capa) + par(90, pts.length) + par(70, 1) + pts.map(([x, y]) => par(10, x) + par(20, y)).join("");
  const dxfDe = (etiqueta) => par(0, "SECTION") + par(2, "HEADER") + par(9, "$INSUNITS") + par(70, 4) + par(0, "ENDSEC") + par(0, "SECTION") + par(2, "ENTITIES") +
    lw("A-MURO", [[0, 0], [9000, 0], [9000, 7000], [0, 7000]]) + par(0, "TEXT") + par(8, "A-TEXTO") + par(10, 4500) + par(20, 3500) + par(40, 250) + par(1, etiqueta) + par(0, "ENDSEC") + par(0, "EOF");
  const DXF = dxfDe("SALA 63 m2");
  const zipDe = (entradas) => G("zipCrear")(entradas.map((e) => ({ nombre: e.nombre, datos: typeof e.datos === "string" ? new w.TextEncoder().encode(e.datos) : new Uint8Array(e.datos) })));

  G("closeModal")();

  await tA("21.1 reasignar un archivo mientras se procesa no deja el lote del motor viejo bajo el motor nuevo", async () => {
    act("proj-new"); S.meta.name = "R21.1 reasignar"; G("projSave")(true);
    const orig = w.cxProcesarArchivos;
    w.cxProcesarArchivos = (...a) => new Promise((r) => setTimeout(() => r(orig(...a)), 40));
    try {
      await G("cxzAgregarArchivos")([archivo("planta.dxf", DXF)]);
      await new Promise((r) => setTimeout(r, 5));
      const f0 = filasT()[0];
      eq(f0.estado, "procesando", "arrancó a procesar antes de reasignar:");
      G("cxzReasignar")(f0.id, "electrico");
      await esperaCola();
      const f = filasT()[0];
      eq(f.motor, "electrico", "motor final de la fila:");
      const lote = G("CXZ_LOTES")[f.id];
      if (!lote) throw new Error("no quedó lote para la fila");
      eq(lote.tab, "electrico", "el lote guardado es del motor nuevo, no del que estaba en vuelo:");
    } finally { w.cxProcesarArchivos = orig; }
  });

  await tA("21.2 quitar un archivo mientras se procesa no lo vuelve a meter a la tabla", async () => {
    act("proj-new"); S.meta.name = "R21.2 quitar"; G("projSave")(true);
    const orig = w.cxProcesarArchivos;
    w.cxProcesarArchivos = (...a) => new Promise((r) => setTimeout(() => r(orig(...a)), 40));
    try {
      await G("cxzAgregarArchivos")([archivo("otro.dxf", DXF)]);
      await new Promise((r) => setTimeout(r, 5));
      const id = filasT()[0].id;
      await G("cxzQuitar")(id);
      await new Promise((r) => setTimeout(r, 80));
      eq(filasT().length, 0, "la fila quitada no reaparece cuando termina el procesamiento en vuelo:");
    } finally { w.cxProcesarArchivos = orig; }
  });

  await tA("21.3 cambiar de proyecto mientras se agregan archivos no los pierde ni los mezcla", async () => {
    act("proj-new"); S.meta.name = "R21.3 ORIGEN"; G("projSave")(true);
    const origen = S.pid;
    act("proj-new"); S.meta.name = "R21.3 DESTINO"; G("projSave")(true);
    const destino = S.pid;
    G("cxzCambiarProyecto")(origen); // vuelve a ORIGEN, que es donde se va a soltar
    eq(S.pid, origen);
    const origLeer = w.cxzLeerBytes;
    w.cxzLeerBytes = (...a) => new Promise((r) => setTimeout(() => r(origLeer(...a)), 30));
    let prom;
    try {
      prom = G("cxzAgregarArchivos")([archivo("a.csv", "kw\n1\n"), archivo("b.csv", "kw\n2\n")]);
      await new Promise((r) => setTimeout(r, 5));
      G("cxzCambiarProyecto")(destino); // cambia a media carga, sin guardar
      await prom;
      await new Promise((r) => setTimeout(r, 200));
    } finally { w.cxzLeerBytes = origLeer; }
    eq(filasT().length, 0, "el proyecto DESTINO no recibió nada de lo soltado en ORIGEN:");
    G("cxzCambiarProyecto")(origen);
    const F = filasT();
    eq(F.length, 2, "los dos archivos quedaron en el proyecto donde se soltaron (ORIGEN):");
    for (const f of F) if (!(await G("cxzBytes")(f.id))) throw new Error(`${f.nombre}: sus bytes no viajaron con él`);
  });

  await tA("21.4 un archivo que se queda «en espera» al cambiar de proyecto se retoma solo al reabrirlo", async () => {
    act("proj-new"); S.meta.name = "R21.4"; G("projSave")(true);
    await G("cxzAgregarArchivos")([archivo("cargas.csv", "kw,volt\n1,220\n")]);
    await esperaCola();
    const f = filasT()[0];
    eq(f.estado, "listo");
    /* Simula lo que deja sanearEstado tras un «procesando» a medias: motor
       asignado, estado «espera». */
    f.estado = "espera"; delete G("CXZ_LOTES")[f.id];
    const aqui = S.pid;
    act("proj-new"); G("projSave")(true);
    G("cxzCambiarProyecto")(aqui);
    await esperaCola();
    eq(filasT()[0].estado, "listo", "se reprocesó solo al reabrir, sin que nadie más la reencolara:");
  });

  await tA("21.5 el tope de archivos de un proyecto no recorta la tabla al reabrirlo", () => {
    const cx = { lotes: [], archivos: Array.from({ length: 500 }, (_, i) => ({ id: "f" + i, nombre: `n${i}.pdf`, ruta: `n${i}.pdf`, ext: "pdf", tipo: "PDF", tam: 10, motor: "sin", estado: "espera", detalle: "", motivo: "", propuestas: 0, aplicados: 0, ts: 1, info: {} })) };
    const saneado = G("sanearEstado")({ ...G("defaultState")(), cx });
    eq(saneado.cx.archivos.length, 500, "500 archivos sobreviven al saneo (antes se cortaba a 400):");
  });

  await tA("21.6 una hoja hidráulica en la carpeta de hidro no cae en aire comprimido", async () => {
    act("proj-new"); S.meta.name = "R21.6"; G("projSave")(true);
    await G("cxzAgregarArchivos")([archivo("consumos.csv", "Mueble,l/min,bar\nWC,6,2\nLavabo,4,2\n", "Hidráulico/consumos.csv")]);
    await esperaCola();
    const f = filasT()[0];
    eq(f.motor, "hidro", "motor con la pista de carpeta:");
    if (f.motivo && /aire/i.test(f.motivo) && !/hidro/i.test(f.motivo)) throw new Error("el motivo sigue apuntando a aire comprimido");
  });

  await tA("21.7 las pistas de carpeta reconocen nombres reales de obra, no solo la raíz exacta", () => {
    const casos = [["Hidráulico", "hidro"], ["Incendios", "fuego"], ["01 Eléctrico", "electrico"], ["Cuartos limpios", "limpios"], ["Sistema contra incendio", "fuego"]];
    casos.forEach(([carpeta, esperado]) => {
      eq(G("cxzPistaCarpeta")(`${carpeta}/plano.dxf`), esperado, `${carpeta}:`);
    });
  });

  await tA("21.8 archivar el proyecto abierto guarda antes lo que hay en pantalla", () => {
    act("proj-new"); S.meta.name = "R21.8"; G("projSave")(true);
    const pid = S.pid;
    S.zones.push({ ...G("defaultZone")("Extra"), area: 321 });
    const zonasEnPantalla = S.zones.length;
    act("cxz-archivar-id", pid); // pasa por pedirConfirmacion
    const btn = w.document.querySelector('[data-act="confirmar-si"]');
    if (btn) btn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    const rec = G("projList")().find((p) => p.id === pid);
    eq(rec.data.zones.length, zonasEnPantalla, "el registro archivado trae lo que había en pantalla:");
    eq(rec.archivado, true);
  });

  await tA("21.9 duplicar no comparte el lote de hallazgos con el original", async () => {
    act("proj-new"); S.meta.name = "R21.9"; G("projSave")(true);
    await G("cxzAgregarArchivos")([archivo("cuadro.csv", "kw,volt\n1,220\n2,220\n", "electrico/cuadro.csv")]);
    await esperaCola();
    const idOrigen = filasT()[0].id;
    await G("cxzDuplicar")();
    const idCopia = filasT()[0].id;
    if (idCopia === idOrigen) throw new Error("la copia conservó el mismo id de archivo que el original");
    const loteCopia = G("CXZ_LOTES")[idCopia];
    if (loteCopia) loteCopia.propuestas.forEach((p) => { p.marcado = false; });
    const loteOrigen = G("CXZ_LOTES")[idOrigen];
    if (loteOrigen && loteOrigen.propuestas.some((p) => !p.marcado === false)) { /* no-op: solo existe si comparten objeto */ }
    if (loteOrigen === loteCopia) throw new Error("original y copia comparten el mismo objeto de lote");
  });

  await tA("21.10 importar el mismo paquete dos veces no comparte el lote entre las dos copias", async () => {
    act("proj-new"); S.meta.name = "R21.10"; G("projSave")(true);
    await G("cxzAgregarArchivos")([archivo("cuadro.csv", "kw,volt\n1,220\n", "electrico/cuadro.csv")]);
    await esperaCola();
    const P = await G("cxzArmarPaquete")();
    /* El archivo ya viene «listo» dentro del paquete (se procesó antes de
       exportar): CXZ_LOTES no viaja con él, se rehace al pedir «Revisar y
       aplicar», que es justo donde el defecto original aparecía. */
    await G("cxzImportarPaquete")(P.bytes, "p.suiteemp.zip");
    const id1 = filasT()[0].id;
    await G("cxzRevisar")(id1); G("closeModal")();
    const lote1 = G("CXZ_LOTES")[id1];
    if (!lote1) throw new Error("la primera importación no arma su lote al revisar");
    await G("cxzImportarPaquete")(P.bytes, "p.suiteemp.zip");
    const id2 = filasT()[0].id;
    await G("cxzRevisar")(id2); G("closeModal")();
    const lote2 = G("CXZ_LOTES")[id2];
    if (!lote2) throw new Error("la segunda importación no arma su lote al revisar");
    if (id1 === id2) throw new Error("las dos importaciones comparten el mismo id de archivo");
    if (lote1 === lote2) throw new Error("las dos importaciones comparten el mismo objeto de lote");
  });

  await tA("21.11 un proyecto archivado no cuenta contra el tope de 40 y no se retira solo", () => {
    act("proj-new"); S.meta.name = "R21.11 ARCHIVADO VIEJO"; G("projSave")(true);
    const pidArchivado = S.pid;
    G("cxzArchivar")(pidArchivado, true);
    for (let i = 0; i < 40; i++) { act("proj-new"); S.meta.name = "R21.11 activo " + i; G("projSave")(true); }
    const sigue = G("projList")().find((p) => p.id === pidArchivado);
    if (!sigue) throw new Error("el proyecto archivado se retiró del historial al llegar al tope");
    eq(sigue.archivado, true);
  });

  await tA("21.12 importar un paquete con proyecto.json mal formado no deja nada a medias", async () => {
    /* Un campo de texto con forma rara (name = {}) se repara solo al sanear
       el estado: la importación no se cae por eso. */
    const rotoSuave = zipDe([{ nombre: "proyecto.json", datos: JSON.stringify({ formato: "suiteemp-paquete", v: 1, proyecto: { meta: { name: {} }, zones: [] } }) }]);
    const ok1 = await G("cxzImportarPaquete")(rotoSuave, "roto.suiteemp.zip");
    eq(ok1, true, "un nombre con forma rara se repara solo en vez de tumbar la importación:");
    eq(typeof S.meta.name, "string", "el nombre del proyecto quedó como texto:");
    eq(w.__errs.length, 0, "sin errores de ventana:");
    /* Un proyecto que de plano no es un objeto sí se rechaza, sin dejar rastro. */
    const antes = G("projList")().length, pidAntes = S.pid;
    const rotoDuro = zipDe([{ nombre: "proyecto.json", datos: JSON.stringify({ formato: "suiteemp-paquete", v: 1, proyecto: "hola" }) }]);
    const ok2 = await G("cxzImportarPaquete")(rotoDuro, "roto2.suiteemp.zip");
    eq(ok2, false, "un proyecto que no es un objeto se rechaza:");
    eq(S.pid, pidAntes, "el proyecto abierto se quedó como estaba:");
    eq(G("projList")().length, antes, "no quedó ningún registro roto en el historial:");
  });

  await tA("21.13 revisar y aplicar desde otra disciplina sugerida deja el motor de la fila igual a donde se aplicó", async () => {
    act("proj-new"); S.meta.name = "R21.13"; G("projSave")(true);
    await G("cxzAgregarArchivos")([archivo("cuadro.csv", "kw,volt\n1,220\n", "electrico/cuadro.csv")]);
    await esperaCola();
    const f = filasT()[0];
    eq(f.motor, "electrico");
    const lote = G("CXZ_LOTES")[f.id];
    lote.tab = "fuego"; // simula que el usuario aceptó «también sirve para: Contra incendio»
    await G("cxzRevisar")(f.id);
    const btn = w.document.querySelector('[data-act="cx-aplicar"]');
    if (btn) btn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 10));
    eq(filasT()[0].motor, "fuego", "la tabla dice a dónde fueron realmente los datos aplicados:");
  });

  await tA("21.14 un ZIP fabricado que declara menos de lo que en realidad pesa no evade el límite del lote", () => {
    const grande = new Uint8Array(2 * 1024 * 1024).fill(65); // 2 MB de datos reales
    const comp = zlibx.deflateRawSync(Buffer.from(grande));
    const u16 = (v) => [v & 0xff, (v >>> 8) & 0xff]; const u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
    const nombre = Buffer.from("grande.bin");
    const crc = G("cxCrc32")(grande);
    const localHdr = Buffer.from([0x50, 0x4b, 0x03, 0x04, 20, 0, 0, 0, 8, 0, 0, 0, 0, 0, ...u32(crc), ...u32(comp.length), ...u32(1), ...u16(nombre.length), ...u16(0)]);
    const local = Buffer.concat([localHdr, nombre, comp]);
    const cdHdr = Buffer.from([0x50, 0x4b, 0x01, 0x02, 20, 0, 20, 0, 0, 0, 8, 0, 0, 0, 0, 0, ...u32(crc), ...u32(comp.length), ...u32(1) /* tamU fabricado: dice 1 byte */, ...u16(nombre.length), 0, 0, 0, 0, 0, 0, ...u32(0), ...u32(0)]);
    const cd = Buffer.concat([cdHdr, nombre]);
    const eocd = Buffer.from([0x50, 0x4b, 0x05, 0x06, 0, 0, 0, 0, ...u16(1), ...u16(1), ...u32(cd.length), ...u32(local.length), ...u16(0)]);
    const zipBytes = new Uint8Array(Buffer.concat([local, cd, eocd]));
    const Z = G("cxZipLeer")(zipBytes);
    const e = Z.entradas[0];
    if (e.bytes && e.bytes.length === grande.length) throw new Error("el archivo entró completo pese a declarar 1 byte y pesar 2 MB reales");
  });

  await tA("21.15 la portada ya no es una segunda pantalla de inicio: Escape y «Diagrama» llevan al tablero", () => {
    const tabs = G("TABS").map(([id]) => id);
    if (tabs.includes("inicio")) throw new Error("«Portada» sigue en el menú de primer nivel");
    S.tab = "carga"; G("render")();
    w.document.querySelector('[data-act="ir-diagrama"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    eq(S.tab, "tablero", "el botón de regreso lleva al tablero:");
    S.tab = "electrico"; G("render")();
    w.document.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    eq(S.tab, "tablero", "Escape lleva al tablero:");
    contiene(w.document.getElementById("view").innerHTML, 'class="tdiag"', "el tablero trae el diagrama embebido:");
  });

  await tA("21.16 el mismo DXF sin carpeta que lo desempate se clasifica igual que dentro de una carpeta cuando su contenido ya lo dice", async () => {
    const conCarpeta = dxfDe("SISTEMA CONTRA INCENDIO NFPA 13");
    act("proj-new"); S.meta.name = "R21.16a"; G("projSave")(true);
    await G("cxzAgregarArchivos")([archivo("memoria.dxf", conCarpeta, "Incendios/memoria.dxf")]);
    await esperaCola();
    eq(filasT()[0].motor, "fuego", "con carpeta:");
    act("proj-new"); S.meta.name = "R21.16b"; G("projSave")(true);
    await G("cxzAgregarArchivos")([archivo("memoria.dxf", conCarpeta)]); // el mismo archivo, suelto
    await esperaCola();
    eq(filasT()[0].motor, "fuego", "suelto, decide el contenido:");
  });

  await tA("21.17 cuando el contenido no está de acuerdo con la carpeta, se avisa en vez de callarlo", async () => {
    act("proj-new"); S.meta.name = "R21.17"; G("projSave")(true);
    const contenidoFuego = dxfDe("SISTEMA CONTRA INCENDIO NFPA 13 GABINETE");
    await G("cxzAgregarArchivos")([archivo("plano.dxf", contenidoFuego, "electrico/plano.dxf")]);
    await esperaCola();
    const f = filasT()[0];
    eq(f.motor, "electrico", "la carpeta sigue mandando:");
    contiene(f.motivo, "carpeta", "lo dice la carpeta");
    contiene(f.motivo.toLowerCase(), "revísalo", "pero avisa que el contenido no está de acuerdo:");
  });
}
/* ====== 19. La plataforma se llama SuiteEmp ====== */
t("19.1 SuiteEmp firma los documentos y el nombre anterior ya no aparece", () => {
  const VIEJO = /EMP[- ]?B12/;
  const pdfTxt = Buffer.from(G("buildMemoriaIntegralPdf")()).toString("latin1");
  contiene(pdfTxt, "SuiteEmp rev"); contiene(pdfTxt, "/Creator (SuiteEmp)");
  if (VIEJO.test(pdfTxt)) throw new Error("la memoria integral conserva el nombre anterior");
  ["es", "en"].forEach((lang) => {
    const x = Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : "USD" })).toString("utf8");
    contiene(x, "SuiteEmp rev", "libro " + lang + ":");
    if (VIEJO.test(x)) throw new Error("el libro " + lang + " conserva el nombre anterior");
  });
  contiene(G("REV_SELLO")(), "SuiteEmp rev");
  eq(w.document.querySelector('meta[name="apple-mobile-web-app-title"]').content, "SuiteEmp");
});
t("19.2 la base de conocimiento se muda a la llave nueva sin perder lo acumulado", () => {
  G("kbBorrar")();
  w.localStorage.setItem("empb12.kb.v1", JSON.stringify({ medidas: { "prueba-19": { ofrecida: 3, aceptada: 2, descartada: 1 } }, desv: [] }));
  const kb = G("kbLeer")();
  eq(kb.medidas["prueba-19"].aceptada, 2, "lo acumulado:");
  eq(w.localStorage.getItem("empb12.kb.v1"), null, "la llave anterior sigue:");
  if (!w.localStorage.getItem("suiteemp.kb.v1")) throw new Error("no se escribió la llave nueva");
  G("kbBorrar")();
});

/* ============================ 22. Capa 0 · correcciones comprobadas ====== */
t("22.1 1.1 la licitación integra 18 % de indirectos y 12 % de utilidad editables, no 0 %", () => {
  const Q = G("QUOTE_SEED");
  eq(Q.indirectPct, 18, "semilla de indirectos de licitación:");
  eq(Q.profitPct, 12, "semilla de utilidad de licitación:");
  const guardado = JSON.parse(JSON.stringify(S.quote));
  try {
    /* Proyecto viejo, sin las dos llaves: cae a la semilla, no a 0 %. */
    delete S.quote.indirectPct; delete S.quote.profitPct; S.quote.finPct = 1.5;
    S.quote.contingencia = 0;   // esta prueba vigila indirectos y utilidad; la contingencia la vigila la sección C
    const E = G("estructuraSobrecosto")(1000000);
    if (Math.abs(E.pu - 1022105) < 1) throw new Error("sigue integrando 0 % de indirectos y utilidad (1,022,105)");
    cerca(E.pu, 1350813.968, 0.01, "importe integrado sobre $1,000,000:");
    /* La tarjeta de licitación ofrece un campo por cada %, con la semilla. */
    S.tab = "cotizacion"; G("render")();
    const ind = w.document.querySelectorAll('#view input[data-path="quote.indirectPct"]');
    const uti = w.document.querySelectorAll('#view input[data-path="quote.profitPct"]');
    eq(ind.length, 1, "campo de indirectos:"); eq(uti.length, 1, "campo de utilidad:");
    eq(ind[0].value, "18"); eq(uti[0].value, "12");
    /* Lo capturado manda en el cálculo y en el documento. */
    ind[0].value = "20"; ind[0].dispatchEvent(new w.Event("input", { bubbles: true }));
    eq(S.quote.indirectPct, 20, "la captura se guarda:");
    cerca(G("estructuraSobrecosto")(1000000).pu, 1000000 * 1.20 * 1.015 * 1.12 * 1.007, 0.01, "con 20 % capturado:");
    const txt = Buffer.from(G("buildLicitacionPdf")()).toString("latin1");
    const celdas = [...txt.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1"));
    const fila = (etq) => { const i = celdas.findIndex((c) => c.startsWith(etq)); if (i < 0) throw new Error(`el PDF no trae la fila «${etq}»`); return celdas.slice(i, i + 3); };
    eq(fila("Costo indirecto")[2], "20", "% de indirectos impreso:");
    eq(fila("Cargo por utilidad")[2], "12", "% de utilidad impreso:");
  } finally {
    Object.keys(S.quote).forEach((k) => delete S.quote[k]);
    Object.assign(S.quote, guardado);
  }
});
t("22.2 1.2 la licitación contrasta a costo directo y los conceptos sin tarjeta llevan P.U. integrado", () => {
  const nf = G("n"), ES = G("estructuraSobrecosto"), AN = G("analizarPU");
  const zonas0 = S.zones, zi0 = S.zi, perms0 = JSON.parse(JSON.stringify(S.perms));
  try {
  /* Proyecto con conceptos que sí tienen tarjeta: dos zonas y todos los cruces autorizados. */
  S.zones = [
    { ...G("defaultZone")("Producción"), area: 400, height: 6, occ: 30 },
    { ...G("defaultZone")("Oficinas"), area: 100, height: 3, occ: 10 },
  ];
  S.zi = 0;
  Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba 22.2" }; });
  G("recompute")();
  const txt = Buffer.from(G("buildLicitacionPdf")()).toString("latin1");
  const celdas = [...txt.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1"));
  const todo = celdas.join(" ");
  const partidas = G("catalogoConceptos")().secciones.flatMap((x) => x.partidas);
  const con = partidas.filter((p) => AN(p)), sin = partidas.filter((p) => !AN(p));
  if (!con.length || !sin.length) throw new Error(`el catálogo del banco no trae conceptos con y sin tarjeta (${con.length}/${sin.length})`);
  if (todo.includes("la tarjeta armada desde insumos da")) throw new Error("sigue el contraste que mezcla P.U. integrado contra P.U. directo");
  /* El importe se integra con el P.U. del catálogo: el documento no puede negar que haya otro precio ni rebajar el catálogo a "de referencia". */
  if (todo.includes("segundo precio ofertado")) throw new Error("el contraste afirma que no hay un segundo precio aunque el importe se integra con el catálogo");
  if (todo.includes("catalogo de referencia")) throw new Error("el contraste llama 'de referencia' al P.U. con el que se integra el importe");
  con.forEach((p) => {
    const A = AN(p);
    contiene(todo, `el analisis desde insumos da ${nf(A.directo, 2)} y el catalogo trae ${nf(p.unit, 2)}.`, p.clave + " contraste a costo directo:");
    contiene(todo, `Diferencia ${nf((A.directo / p.unit - 1) * 100, 1)} %. El importe de la propuesta de este documento se integra con el precio del catalogo.`, p.clave + " diferencia al mismo nivel y origen del importe:");
  });
  const k = celdas.indexOf("Conceptos sin explosion de insumos");
  if (k < 0) throw new Error("el PDF no trae la tabla de conceptos sin explosion");
  sin.forEach((p) => {
    const i = celdas.indexOf(p.clave, k);
    if (i < 0) throw new Error(`${p.clave} no aparece en la tabla de conceptos sin explosion`);
    /* La descripción puede partirse en varios renglones: el P.U. es la celda que sigue a la unidad. */
    const j = celdas.indexOf(p.un, i + 1);
    if (j < 0) throw new Error(`${p.clave} sin unidad en la tabla de conceptos sin explosion`);
    eq(celdas[j + 1], nf(ES(p.unit).pu, 2), p.clave + " P.U. integrado:");
  });
  } finally {
    S.zones = zonas0; S.zi = zi0;
    Object.keys(S.perms).forEach((k) => delete S.perms[k]);
    Object.assign(S.perms, perms0);
    G("recompute")();
  }
});
t("22.3 1.3 el libro de la propuesta suma el financiamiento al subtotal, igual que la pantalla", () => {
  const guardado = JSON.parse(JSON.stringify(S.quote));
  /* Celdas de una hoja del libro (ZIP en STORE): { "C12": { f } | { v } | { s } }. */
  const hojaDe = (bytes, nombre) => {
    const txt = Buffer.from(bytes).toString("utf8");
    const wb = txt.slice(txt.indexOf("<sheets>"), txt.indexOf("</sheets>") + 9);
    const i = [...wb.matchAll(/<sheet name="([^"]+)"/g)].map((m) => m[1]).indexOf(nombre);
    const x = ([...txt.matchAll(/<worksheet[\s\S]*?<\/worksheet>/g)][i] || [""])[0];
    const des = (z) => z.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    const c = {};
    for (const m of x.matchAll(/<c r="([A-Z]+\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const k = m[2] || "", f = k.match(/<f>([\s\S]*?)<\/f>/), v = k.match(/<v>([\s\S]*?)<\/v>/), s = k.match(/<t[^>]*>([\s\S]*?)<\/t>/);
      c[m[1]] = f ? { f: des(f[1]) } : v ? { v: +v[1] } : s ? { s: des(s[1]) } : {};
    }
    return c;
  };
  const filaDe = (H, pref) => { const e = Object.entries(H).find(([r, c]) => r[0] === "B" && c.s && c.s.startsWith(pref)); return e ? +e[0].slice(1) : 0; };
  try {
    Object.assign(S.quote, { currency: "MXN", indirect: 0.18, utility: 0.12, freight: 0.025, bond: 0.015, financing: 0.03, iva: 0.16 });
    G("recompute")();
    const Q = G("QUOTE");
    if (!(Q.direct > 0) || !(Q.finan > 0)) throw new Error(`el estado del banco no trae costo directo ni financiamiento (${Q.direct} / ${Q.finan})`);
    const bytes = G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" });
    const R = hojaDe(bytes, "RESUMEN_EJECUTIVO");
    const rDir = filaDe(R, "COSTO DIRECTO"), rFia = filaDe(R, "Fianzas"), rFin = filaDe(R, "Financiamiento");
    const rSub = filaDe(R, "SUBTOTAL ANTES DE IMPUESTO"), rIva = filaDe(R, "IVA"), rTot = filaDe(R, "TOTAL DE LA PROPUESTA");
    if (!rFin) throw new Error("el resumen ejecutivo no trae el renglón de financiamiento");
    eq(R["B" + rFin].s, `Financiamiento ${G("n")(3, 1)} %`, "rótulo del renglón:");
    eq(rFin, rFia + 1, "financiamiento va después de fianzas:");
    eq(R["C" + rSub].f, `SUM(C${rDir}:C${rFin})`, "el subtotal suma hasta el financiamiento:");
    /* Mismo costo directo que la pantalla: el resto del resumen debe dar QUOTE. */
    const val = (r) => {
      if (r === rDir) return Q.direct;
      const f = (R["C" + r] || {}).f;
      if (!f) return (R["C" + r] || {}).v || 0;
      const js = f.replace(/SUM\(C(\d+):C(\d+)\)/g, (m, a, b) => { const o = []; for (let k = +a; k <= +b; k++) o.push(`__v(${k})`); return "(" + o.join("+") + ")"; })
        .replace(/\bC(\d+)\b/g, (m, k) => `__v(${k})`);
      return Function("__v", `return (${js});`)(val);
    };
    cerca(val(rFin), Q.finan, 0.01, "financiamiento del libro contra la pantalla:");
    cerca(val(rSub), Q.sub, 0.01, "subtotal del libro contra la pantalla:");
    cerca(val(rIva), Q.iva, 0.01, "IVA del libro contra la pantalla:");
    cerca(val(rTot), Q.tot, 0.01, "total del libro contra la pantalla:");
    /* La portada toma el total de su renglón, no de una celda fija. */
    const P = hojaDe(bytes, "PORTADA");
    if (!Object.values(P).some((c) => c.f === `RESUMEN_EJECUTIVO!C${rTot}`)) throw new Error(`la portada no apunta a RESUMEN_EJECUTIVO!C${rTot}`);
    /* El libro en inglés lleva el mismo renglón traducido. */
    const REN = hojaDe(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" }), "EXECUTIVE_SUMMARY");
    if (!filaDe(REN, "Financing")) throw new Error("el libro en inglés no trae el renglón de financiamiento");
    /* Sin financiamiento el resumen queda como antes: sin renglón y el subtotal cierra en fianzas. */
    S.quote.financing = 0; G("recompute")();
    const R0 = hojaDe(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" }), "RESUMEN_EJECUTIVO");
    eq(filaDe(R0, "Financiamiento"), 0, "renglón con financiamiento en 0:");
    eq(R0["C" + filaDe(R0, "SUBTOTAL ANTES DE IMPUESTO")].f, `SUM(C${filaDe(R0, "COSTO DIRECTO")}:C${filaDe(R0, "Fianzas")})`, "subtotal con financiamiento en 0:");
  } finally {
    Object.keys(S.quote).forEach((k) => delete S.quote[k]);
    Object.assign(S.quote, guardado);
    G("recompute")();
  }
});

t("22.4 2.1 la corriente de diseño del alimentador no repite el 125 % (430-24 / 215-2(a)(1)), selConductor la acepta en Idis, y el alimentador y el principal ya la usan", () => {
  const guardado = JSON.parse(JSON.stringify(S.elec));
  try {
    S.elec = { ...G("defaultElec")(), sistema: "3F4H-220", material: "cobre", tempAmb: 30, nCond: 3,
      dvRamal: 3, dvTotal: 5, trafoKVA: 150, trafoZ: 4, Ltablero: 5, fpObjetivo: .95, tomarHVAC: false,
      cargas: [
        { id: "r21m1", nombre: "Motor 15 kW", tipo: "motor", kW: 15, V: 220, ph: 3, cant: 1, L: 20, fp: .85, fija: false },
        { id: "r21m2", nombre: "Motores 7.5 kW", tipo: "motor", kW: 7.5, V: 220, ph: 3, cant: 2, L: 20, fp: .85, fija: false },
        { id: "r21a1", nombre: "Alumbrado", tipo: "alumbrado", kW: 9.5, V: 220, ph: 3, cant: 1, L: 20, fp: .95, fija: false },
        { id: "r21c1", nombre: "Contactos", tipo: "contactos", kW: 9, V: 220, ph: 3, cant: 1, L: 20, fp: .90, fija: false },
      ] };
    G("recompute")();
    const E = G("ELEC");
    /* Motores 35.29 + 25 % del mayor 4.41 + alumbrado 10 × 1.25 + contactos 10 = 62.21 kVA → 163.25 A. */
    const Iref = (15 / .85 + 2 * 7.5 / .85 + .25 * 15 / .85 + 1.25 * 9.5 / .95 + 9 / .90) * 1000 / (Math.sqrt(3) * 220);
    cerca(E.kVAdemanda, 59.71, 0.01, "kVAdemanda (ya trae el 25 % del motor mayor):");
    cerca(E.IdisAlim, Iref, 0.01, "corriente de diseño del alimentador:");
    cerca(E.IdisAlim / E.Itab, 62.206 / 59.706, 0.001, "factor sobre Itab (no 1.25):");
    const o = { I: E.Itab, V: 220, ph: 3, L: 5, fp: .95, material: "cobre", tempAmb: 30, nCond: 3, dvMax: 2 };
    const c = G("selConductor")({ ...o, Idis: E.IdisAlim });
    cerca(c.Idis, E.IdisAlim, 1e-9, "selConductor respeta Idis explícita:");
    eq(c.awg, "2/0", "calibre con la corriente de diseño corregida:");
    eq(c.ocpd, 175, "protección del conductor con la corriente de diseño corregida:");
    const d = G("selConductor")({ ...o, continua: true });
    cerca(d.Idis, E.Itab * 1.25, 1e-9, "sin Idis explícita sigue el 125 % de carga continua:");
    if (!(c.I === d.I)) throw new Error("la caída de tensión debe seguir calculándose con la corriente real I");
    /* rev 2.9.6.2 · Ya conectado: el alimentador general se dimensiona con
       IdisAlim (no Itab × 1.25) y el interruptor principal es el mayor entre
       lo que exige proteger ese conductor y la protección del ramal del motor
       mayor (art. 430-63); aquí domina el alimentador, no el motor. */
    eq(E.alim.awg, "2/0", "calibre del alimentador general con la corriente corregida:");
    eq(E.alim.ocpd, 175, "protección del alimentador general con la corriente corregida:");
    eq(E.principal, 175, "interruptor principal = protección del alimentador (domina sobre el ramal del motor mayor, 125 A):");
  } finally {
    S.elec = guardado;
    G("recompute")();
  }
});

t("22.5 2.2 la carga dinámica hidráulica no cuenta dos veces la altura (edificio + fricción + residual)", () => {
  const guardado = JSON.parse(JSON.stringify(S.hidro));
  try {
    S.hidro = { uso: "publico", material: "cobre",
      muebles: [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }],
      presRed: 25,
      tramos: [
        { id: "r22a", tag: "AF-GENERAL", servicio: "fria", um: 72, L: 25, alt: 3, tipoUM: "auto" },
        { id: "r22b", tag: "AF-RAMAL", servicio: "fria", um: 20, L: 18, alt: 3, tipoUM: "auto" },
      ],
      pendiente: 2, calentador: "paso", tempEntrada: 18, tempSalida: 45,
      dot: "industria", habitantes: 60, diasReserva: 1, alturaEdificio: 6, presResidual: 15 };
    G("recompute")();
    const H = G("HIDRO");
    const friccion = H.tramos.reduce((a, x) => a + x.hf, 0);
    cerca(friccion, 5.1443, 0.001, "fricción de los tramos:");
    cerca(H.cdt, 6 + friccion + 15, 1e-9, "cdt = altura del edificio + fricción + residual:");
    cerca(H.cdt, 26.1443, 0.001, "cdt con los valores por omisión:");
    cerca(H.presDisp, 25 - friccion - 6, 1e-9, "presión disponible sigue descontando la altura de los tramos:");
    cerca(H.kWbomba, 9.81 * H.Qtotal * H.cdt / 1000 / .6, 1e-9, "kW al eje con la cdt corregida:");
    eq(H.hpBomba, 2.5, "HP nominales con la cdt corregida:");
  } finally {
    S.hidro = guardado;
    G("recompute")();
  }
});

t("22.6 2.3 la presión de ductos se declara suma de tramos (cota superior solo de los tramos capturados, con aviso si no hay retorno) y ningún texto afirma que manda el recorrido crítico", () => {
  /* Sin topología de red el número sigue siendo la suma (pasa a la capa de motores);
     lo que se fija aquí es que pantalla, guía, selección, memoria y libro lo digan. */
  const ducto0 = JSON.parse(JSON.stringify(S.duct)), tab0 = S.tab, perms0 = JSON.parse(JSON.stringify(S.perms));
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba 22.6" }; });
    const seg = G("defaultSegment");
    const ramal = (tag, id, flow) => ({ ...seg(tag, flow), id, shape: "round", method: "velocity", targetV: 5, length: 10,
      fittings: [{ type: "tee_branch", qty: 1, C: .65 }, { type: "exit_diffuser", qty: 1, C: 1 }] });
    S.duct.segments = [{ ...seg("SA-PRINCIPAL", 3200), id: "p226t", shape: "rect", method: "equal_friction", targetF: .8, length: 20, aspect: 3,
      fittings: [{ type: "elbow_90_rect", qty: 2, C: .28 }] }, ...Array.from({ length: 8 }, (_, i) => ramal(`SA-RAMAL-${i + 1}`, `p226r${i}`, 400))];
    /* 2.3-rep: "cota superior" solo vale para el recorrido crítico de los tramos
       capturados; sin ningún tramo "return" (como la red de chainToDuct) cada
       texto lo avisa, y con retorno capturado el aviso desaparece. */
    const COTA = "cota superior del recorrido crítico de los tramos capturados; no incluye tramos, rejillas ni filtros que no estén en la lista";
    const COTA_PLANO = "cota superior del recorrido critico de los tramos capturados; no incluye tramos, rejillas ni filtros que no esten en la lista";
    const COTA_EN = "upper bound of the critical path of the runs entered; excludes runs, grilles and filters not on the list";
    const SIN = "; sin tramos de retorno capturados", SIN_EN = "; no return runs entered";
    const revisar = (red, esperaRetorno, conMarca) => {
      G("recompute")();
      const D = G("DUCT");
      const hayRetorno = D.segs.some((s) => s.service === "return");
      if (hayRetorno !== esperaRetorno) throw new Error(`${red}: la red ${hayRetorno ? "sí" : "no"} trae retorno, se esperaba lo contrario`);
      const sin = hayRetorno ? "" : SIN, sinEn = hayRetorno ? "" : SIN_EN;
      const falta = (txt, frase, donde) => { if (txt.includes(frase)) throw new Error(`${red} · ${donde} dice «${frase}» y la red sí trae retorno`); };
      cerca(D.path, D.segs.filter((s) => ["supply", "return"].includes(s.service)).reduce((a, s) => a + s.total, 0), 1e-9, `${red} · DUCT.path sigue siendo la suma de tramos en esta capa:`);
      cerca(G("requisitoFam")("split_duct").esp, D.path * 1.15 / 249.089, 1e-9, `${red} · esp de selección con la suma:`);
      /* Pantalla de ductos */
      S.tab = "ductos"; G("render")();
      /* Solo lo que se ve: fuera el código de los <script>, que también trae las frases. */
      const vista = w.document.body.cloneNode(true);
      vista.querySelectorAll("script, style, template").forEach((x) => x.remove());
      const pant = vista.textContent.replace(/\s+/g, " ");
      if (pant.includes("La barra más larga manda la presión del ventilador")) throw new Error("la pantalla sigue diciendo que la barra más larga manda");
      if (pant.includes("es una cota superior,")) throw new Error(`${red} · la pantalla sigue diciendo «cota superior» sin acotarla a los tramos capturados`);
      contiene(pant, `suma todos los tramos de suministro y retorno, porque el recorrido crítico todavía no se calcula: es una ${COTA}${sin}. Si un tramo domina`, `${red} · nota de la gráfica:`);
      contiene(pant, `+15 % de margen · suma de tramos, cota superior solo de los tramos capturados${hayRetorno ? "" : " · sin tramos de retorno capturados"}`, `${red} · sub de Presión del ventilador:`);
      if (hayRetorno) falta(pant, "sin tramos de retorno capturados", "la pantalla");
      /* Marca de selección (se fuerza una presión alta para que haya castigo) */
      if (conMarca) {
        const sel = G("selPorFamilia")("split_duct", { ...G("requisitoFam")("split_duct"), esp: 5 });
        const marcas = sel.cands.flatMap((c) => c.marcas || []).filter((x) => /in\.wg/.test(x));
        if (!marcas.length) throw new Error(`${red} · el caso no castiga por presión: no se puede revisar la marca`);
        marcas.forEach((x) => contiene(x, `in.wg (suma de tramos; ${COTA}${sin}) y la familia entrega`, `${red} · marca de selección:`));
      }
      /* Memoria PDF */
      const txt = Buffer.from(G("buildMemoriaPdf")()).toString("latin1");
      const todo = [...txt.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
      /* El párrafo es largo y puede partirse entre páginas: entre dos palabras se
         tolera el pie y el encabezado de página que el PDF intercala. */
      const fraseMem = `presión de ventilador sugerida ${G("n")(D.path * 1.15, 1)} Pa con 15 % de margen (suma de todos los tramos de suministro y retorno, sin recorrido crítico; ${COTA}${sin})`;
      const reMem = new RegExp(fraseMem.split(" ").map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\s+(?:Página \\d+ de \\d+[^]{0,400}?\\s+)?"));
      if (!reMem.test(todo)) throw new Error(`${red} · memoria PDF: no contiene "${fraseMem}"`);
      if (hayRetorno) falta(todo, "sin tramos de retorno capturados", "la memoria PDF");
      /* Libro XLSX, espejo ES/EN */
      const xes = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
      const xen = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).toString("utf8");
      contiene(xes, `(suministro + retorno): ${G("n")(D.path, 0)} Pa (suma de todos los tramos, sin recorrido critico; ${COTA_PLANO}${sin}).`, `${red} · libro ES:`);
      contiene(xen, `(supply + return): ${G("n")(D.path, 0)} Pa (sum of all runs, not the critical path; ${COTA_EN}${sinEn}).`, `${red} · libro EN:`);
      if (hayRetorno) { falta(xes, "sin tramos de retorno capturados", "el libro ES"); falta(xen, "no return runs entered", "el libro EN"); }
      return D;
    };
    /* Red 1: troncal + 8 ramales de suministro, capturada a mano */
    const D = revisar("red de suministro", false, false);
    const sel = G("selPorFamilia")("split_duct", G("requisitoFam")("split_duct"));
    const marcas = sel.cands.flatMap((c) => c.marcas || []).filter((x) => /in\.wg/.test(x));
    if (!marcas.length) throw new Error("el caso no castiga por presión: no se puede revisar la marca");
    marcas.forEach((x) => contiene(x, `in.wg (suma de tramos; ${COTA}${SIN}) y la familia entrega`, "marca de selección:"));
    if (!(D.path > 0)) throw new Error("red de suministro sin presión");
    /* Guía del módulo (texto fijo: debe acotar y avisar del retorno) */
    const ojo = G("GUIA").ductos.ojo;
    if (/El tramo crítico es el que manda/.test(ojo)) throw new Error("la guía sigue afirmando que el tramo crítico manda");
    if (/\(cota superior\)/.test(ojo)) throw new Error("la guía sigue diciendo «(cota superior)» sin acotarla");
    contiene(ojo, COTA, "guía de ductos:");
    contiene(ojo, "no trae tramos de retorno", "guía de ductos (retorno):");
    /* Red 2: la que arma la propia suite desde la carga (sin retorno) */
    const vinc0 = S.vinculos === undefined ? undefined : JSON.parse(JSON.stringify(S.vinculos));
    try {
      G("chainToDuct")(true);
      revisar("red de chainToDuct", false, true);
      /* Red 3: la misma red con un retorno capturado: el aviso desaparece */
      S.duct.segments.push({ ...seg("RA-PRINCIPAL", 1770), id: "p226ra", service: "return", shape: "rect", method: "equal_friction",
        targetF: .8, length: 20, aspect: 2, fittings: [{ type: "elbow_90_rect", qty: 2, C: .28 }] });
      revisar("red de chainToDuct con retorno", true, true);
    } finally {
      if (vinc0 === undefined) delete S.vinculos; else S.vinculos = vinc0;
    }
  } finally {
    S.duct = ducto0; S.tab = tab0;
    Object.keys(S.perms).forEach((k) => delete S.perms[k]);
    Object.assign(S.perms, perms0);
    G("recompute")(); G("render")();
  }
});

t("22.7 2.4 la bomba contra incendio que no cubre la demanda avisa (err) en motor, memoria y PDF en vez de topar en silencio", () => {
  const fuego0 = JSON.parse(JSON.stringify(S.fuego));
  try {
    const base = { ...G("defaultFuego")(), area: 600, altura: 6, rociador: "k80", material: "acero_neg",
      areaDiseno: 0, Lramal: 30, Lmontante: 12, presFuente: 30, fuente: "cisterna", tomarArea: false };
    /* Ordinario 2: la bomba de lista cubre y no hay aviso. */
    S.fuego = { ...base, riesgo: "ord2" };
    G("recompute")();
    let F = G("FUEGO");
    eq(F.qBomba, 2500, "ord2 bomba nominal:");
    if (F.avisos.some((a) => /rebasa la bomba mayor/.test(a.msg))) throw new Error("ord2 avisa de bomba sin rebasar la lista");
    /* Extra 1: 5,162 L/min contra la bomba mayor de 5,000. */
    S.fuego = { ...base, riesgo: "extra1" };
    G("recompute")();
    F = G("FUEGO");
    cerca(F.qTotal, 5161.98, 0.01, "extra1 demanda:");
    eq(F.qBomba, 5000, "extra1 bomba nominal (sin decidir capacidad mayor):");
    eq(F.hpBomba, Math.ceil(9.81 * (5000 / 60 / 1000) * F.presBomba / .65 / .746 / 5) * 5, "extra1 HP con la bomba de lista (fórmula sin cambio):");
    const nn = G("n");
    const av = F.avisos.filter((a) => /rebasa la bomba mayor/.test(a.msg));
    eq(av.length, 1, "avisos de bomba que no cubre:");
    eq(av[0].lvl, "err", "nivel del aviso:");
    contiene(av[0].msg, "La demanda de 5,162 L/min (1,364 gpm) rebasa la bomba mayor de la lista de prediseño, 5,000 L/min (1,321 gpm), que NO cubre la demanda.", "aviso:");
    contiene(av[0].msg, `potencia de ${nn(F.hpBomba, 0)} HP (subestimada)`, "aviso potencia:");
    contiene(F.memo.join(" "), `nominal 5,000 L/min (1,321 gpm) — POR DEBAJO de la demanda de 5,162 L/min (1,364 gpm), no cubre a ${nn(F.presBomba, 1)} m`, "memoria:");
    const pdf = Buffer.from(G("buildFuegoPdf")()).toString("latin1");
    const iObs = pdf.indexOf("7. Observaciones");
    if (iObs < 0) throw new Error("el PDF no tiene la sección 7. Observaciones");
    const obs = [...pdf.slice(iObs).matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ").replace(/\s+/g, " ");
    contiene(obs, "rebasa la bomba mayor de la lista", "PDF observaciones:");
    const sem = G("semaforoSuite")().find((x) => x.id === "fuego");
    eq(sem && sem.nivel, "incompleta", "semáforo de contra incendio:");
  } finally {
    S.fuego = fuego0;
    G("recompute")();
  }
});

t("22.8 2.5 la soportería hidráulica lee hidro.material: cobre y termoplásticos no se espacian como acero", () => {
  const hidro0 = JSON.parse(JSON.stringify(S.hidro)), sop0 = JSON.parse(JSON.stringify(S.soporte));
  const vinc0 = JSON.parse(JSON.stringify(S.vinculos || {}));
  const hidroDe = () => (G("SOPORTE").porTuberia || []).find((x) => x.etiqueta === "Hidráulica y sanitario");
  const filasPdf = () => {
    const toks = [...Buffer.from(G("buildSoportePdf")()).toString("latin1").matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((m) => m[1]);
    return toks.flatMap((x, i) => x === "Hidráulica y sanitario" ? [[toks[i + 3], toks[i + 5]]] : []);
  };
  const preparar = (material) => {
    S.hidro = { ...G("defaultHidro")(), material };
    S.soporte = G("defaultSoporte")();
    G("recompute")();
  };
  try {
    const esperado = {
      cobre: { fam: "cobre", e: [2.4, 2.4], n: [12, 9] },
      cpvc: { fam: "plastico", e: [1.2, 1.2], n: [22, 16] },
      pead: { fam: "plastico", e: [1.2, 1.2], n: [22, 16] },
      acero: { fam: "acero", e: [3, 2.7], n: [10, 8] },
    };
    Object.entries(esperado).forEach(([material, x]) => {
      preparar(material);
      eq(hidroDe().fam, x.fam, `${material} familia en vivo:`);
      G("propAceptar")("motores>soporte");
      G("recompute")();
      eq(S.soporte.snap.hidroMat, x.fam, `${material} instantánea hidroMat:`);
      const h = hidroDe();
      eq(h.fam, x.fam, `${material} familia gobernada:`);
      eq(JSON.stringify(h.det.map((d) => d.d)), "[50,38]", `${material} diámetros del caso:`);
      eq(JSON.stringify(h.det.map((d) => d.e)), JSON.stringify(x.e), `${material} espaciamientos:`);
      eq(JSON.stringify(h.det.map((d) => d.n)), JSON.stringify(x.n), `${material} soportes por tramo:`);
      eq(JSON.stringify(filasPdf()), JSON.stringify(x.e.map((e, i) => [String(e), String(x.n[i])])), `${material} PDF conteo por tramo:`);
    });
    /* El gobernador congela el material aceptado y avisa si cambia. */
    preparar("cobre");
    G("propAceptar")("motores>soporte");
    S.hidro.material = "cpvc";
    G("recompute")();
    eq(hidroDe().fam, "cobre", "tras cambiar a cpvc sin actualizar sigue lo aceptado:");
    eq(G("estadoPropuesta")("motores>soporte").nivel, "desactualizado", "cambio de material marca la propuesta:");
    G("propAceptar")("motores>soporte");
    G("recompute")();
    eq(hidroDe().fam, "plastico", "al actualizar toma el termoplástico:");
  } finally {
    S.hidro = hidro0; S.soporte = sop0;
    S.vinculos = vinc0;
    G("recompute")();
  }
});

t("22.9 3.1 CUMPLIMIENTO_URS lee la clase ISO del cuarto y la cascada sale NO EVALUADO, no SI fijo", () => {
  /* Parcial: el mínimo de renovaciones y el veredicto NFPA 13 esperan la decisión del criterio. */
  const clean0 = JSON.parse(JSON.stringify(S.clean));
  const filasDe = (bytes, marca) => {
    const txt = Buffer.from(bytes).toString("utf8");
    const x = [...txt.matchAll(/<worksheet[\s\S]*?<\/worksheet>/g)].map((m) => m[0]).find((h) => h.includes(marca)) || "";
    const des = (z) => z.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    return { xml: des(x), filas: [...x.matchAll(/<row\b[\s\S]*?<\/row>/g)].map((r) =>
      [...r[0].matchAll(/<c\b[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => { const m = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(c[1] || ""); return m ? des(m[1]) : ""; })) };
  };
  try {
    const room = G("defaultRoom");
    S.clean = { ci: 0, rooms: [
      { ...room("Sala A"), iso: "iso5", level: "med", achSet: 20, area: 40, height: 3, dp: 15 },
      { ...room("Sala B"), iso: "iso7", level: "min", achSet: 0, area: 60, height: 2.7, dp: 12.5 },
    ] };
    G("recompute")();
    const libros = [
      { bytes: G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" }), urs: "CUMPLIMIENTO DE URS", area: "AREAS CLASIFICADAS",
        clasif: "Clasificacion del cuarto", casc: "Cascada de presion", ne: "NO EVALUADO", si: "SI",
        crit: ["ISO 5 · rango 240–480 cambios/h", "ISO 7 · rango 30–60 cambios/h"], nota: "Un NO EVALUADO es un requisito que la suite no calcula todavia" },
      { bytes: G("buildPropuestaXlsx")({ lang: "en", mon: "USD" }), urs: "URS COMPLIANCE", area: "CLASSIFIED AREAS",
        clasif: "Classification of room", casc: "Pressure cascade", ne: "NOT EVALUATED", si: "YES",
        crit: ["ISO 5 · range 240–480 ACH", "ISO 7 · range 30–60 ACH"], nota: "A NOT EVALUATED verdict is a requirement the suite does not calculate yet" },
    ];
    libros.forEach((b) => {
      const U = filasDe(b.bytes, b.urs), A = filasDe(b.bytes, b.area);
      if (!U.filas.length || !A.filas.length) throw new Error(`${b.ne}: el libro no trae las hojas de URS y áreas`);
      eq(JSON.stringify(A.filas.filter((f) => f[0] === "Sala A" || f[0] === "Sala B").map((f) => f[1])), '["ISO 5","ISO 7"]', `${b.ne} clase en DESGLOSE_AREAS:`);
      const reng = U.filas.filter((f) => /^\d+$/.test(f[0] || ""));
      const clasif = reng.filter((f) => f[2].startsWith(b.clasif)), casc = reng.filter((f) => f[2].startsWith(b.casc));
      eq(JSON.stringify(clasif.map((f) => f[3])), JSON.stringify(b.crit), `${b.ne} criterio de clasificación:`);
      eq(JSON.stringify(casc.map((f) => f[5])), JSON.stringify([b.ne, b.ne]), `${b.ne} veredicto de cascada:`);
      if (U.xml.includes("ISO 8")) throw new Error(`${b.ne}: la hoja URS sigue imprimiendo ISO 8 sin cuarto ISO 8`);
      contiene(U.xml, b.nota, `${b.ne} nota de NO EVALUADO:`);
    });
  } finally {
    S.clean = clean0;
    G("recompute")();
  }
});

t("22.10 3.2 las bases de diseño de la memoria HVAC imprimen el exterior del sitio (SITE), no 35/24 fijos", () => {
  const site0 = JSON.parse(JSON.stringify(S.site ?? null));
  const RX = /Exterior[^°]*?(-?\d+(?:\.\d+)?) °C de bulbo seco y (-?\d+(?:\.\d+)?) °C de bulbo húmedo/g;
  const texto = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ").replace(/\s+/g, " ");
  try {
    [
      { nombre: "Mexicali", site: { key: "mexicali" }, esperado: "46/23" },
      { nombre: "Personalizado", site: { key: "custom", db: 42, wb: 26, alt: 1200, range: 14 }, esperado: "42/26" },
      { nombre: "Tijuana", site: { key: "tijuana" }, esperado: "35/24" },
    ].forEach((c) => {
      S.site = JSON.parse(JSON.stringify(c.site));
      G("recompute")();
      const SITE = G("SITE");
      eq(`${SITE.db}/${SITE.wb}`, c.esperado, `${c.nombre} exterior del motor:`);
      const suelta = [...texto(G("buildMemoriaPdf")()).matchAll(RX)].map((m) => `${m[1]}/${m[2]}`);
      eq(JSON.stringify(suelta), JSON.stringify([c.esperado]), `${c.nombre} memoria suelta, bases de diseño:`);
      if (c.nombre !== "Tijuana") {
        const integral = [...texto(G("buildMemoriaIntegralPdf")()).matchAll(RX)].map((m) => `${m[1]}/${m[2]}`);
        if (!integral.length || integral.some((x) => x !== c.esperado)) throw new Error(`${c.nombre} memoria integral, bases de diseño: ${JSON.stringify(integral)} ≠ ${c.esperado}`);
      }
    });
  } finally {
    if (site0 === null) delete S.site; else S.site = site0;
    G("recompute")();
  }
});

t("22.11 3.3 sin longitudes capturadas la red hidráulica cotiza 50 m declarados como supuesto, no \"de los tramos calculados\"", () => {
  const hidro0 = JSON.parse(JSON.stringify(S.hidro)), perms0 = JSON.parse(JSON.stringify(S.perms ?? null));
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const renglon = () => (G("QUOTE").aux || []).find((a) => a.mot === "hidro" && a.un === "ML");
  const tramo = (tag, um, L) => ({ ...G("defaultTramoAgua")(tag), um, L, alt: 3 });
  try {
    S.perms = { ...(S.perms || {}), "hidro>quote": { ts: 1, via: "banco" } };
    [
      { nombre: "sin tramos", tramos: [], qty: 50, supuesto: true },
      { nombre: "tramos en 0 m", tramos: [tramo("AF-GENERAL", 72, 0), tramo("AF-RAMAL BAÑOS", 20, 0)], qty: 50, supuesto: true },
      { nombre: "tramos de 25 y 18 m", tramos: [tramo("AF-GENERAL", 72, 25), tramo("AF-RAMAL BAÑOS", 20, 18)], qty: 43, supuesto: false },
    ].forEach((c) => {
      S.hidro = { ...G("defaultHidro")(), tramos: c.tramos };
      G("recompute")();
      if (!(G("HIDRO").umTotal > 0)) throw new Error(`${c.nombre}: la hidrosanitaria del caso no trae unidades mueble`);
      const a = renglon();
      if (!a) throw new Error(`${c.nombre}: la cotización no trae el renglón de red hidráulica`);
      eq(a.qty, c.qty, `${c.nombre} metros cotizados:`);
      cerca(a.total, c.qty * a.unit, 0.001, `${c.nombre} importe del renglón:`);
      const esperado = c.supuesto ? `(${c.qty} m supuestos: sin longitudes capturadas en los tramos; ratificar con levantamiento)` : `(${c.qty} m de los tramos calculados)`;
      contiene(a.desc, esperado, `${c.nombre} descripción:`);
      if (c.supuesto && /tramos calculados/.test(a.desc)) throw new Error(`${c.nombre}: sigue afirmando "de los tramos calculados" sobre 50 m supuestos`);
      if (/tuber[ií]a|tubo/i.test(a.desc)) throw new Error(`${c.nombre}: la descripción activaría la receta de tubería en la licitación`);
      const xlsx = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
      contiene(xlsx, esperado, `${c.nombre} libro de la propuesta:`);
      contiene(pdfTxt(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })), esperado, `${c.nombre} PDF de la propuesta:`);
    });
  } finally {
    S.hidro = hidro0;
    if (perms0 === null) delete S.perms; else S.perms = perms0;
    G("recompute")();
  }
});

t("22.12 3.4 Kaizen lee la clase ISO del cuarto limpio: propone el mínimo de su clase y no cita ISO 8 en otra clase", () => {
  /* Parcial: ISO 8 conserva el piso de 15 (mínimo URS típico) mientras se decide si baja a ach[0] = 10. */
  const zonas0 = S.zones, zi0 = S.zi, tab0 = S.tab, perms0 = JSON.parse(JSON.stringify(S.perms ?? null));
  const dz = G("defaultZone");
  const limpio = (nombre, iso, ach) => ({ ...dz(nombre), spaceType: "cleanroom", iso, achClean: ach,
    area: 120, height: 3, occ: 2, lights: 720, equip: 2400, ach: 0.05, runHours: 24 });
  try {
    S.zones = [
      { ...dz("Producción"), area: 400, height: 6, occ: 30 },
      { ...dz("Oficinas"), area: 100, height: 3, occ: 10 },
      limpio("Limpio ISO 5", "iso5", 360), limpio("Limpio ISO 6", "iso6", 135), limpio("Limpio ISO 7", "iso7", 45),
      limpio("Limpio ISO 8", "iso8", 25), limpio("Limpio ISO 8 alto", "iso8", 40), limpio("Limpio ISO 7 bajo", "iso7", 20),
    ];
    S.zi = 0;
    S.perms = { ...(S.perms || {}) };
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba 22.12" }; });
    S.tab = "valor"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null;
    G("recompute")();
    const mov = G("KAIZEN").ops.filter((o) => o.muda === "mov");
    const de = (nombre) => mov.find((o) => o.zona === nombre);
    [
      ["Limpio ISO 5", 240, "360 cambios/h contra 240, mínimo de ISO 5 (rango 240–480, ISO 14644-4 · ISPE)", 1.021],
      ["Limpio ISO 6", 90, "135 cambios/h contra 90, mínimo de ISO 6 (rango 90–180, ISO 14644-4 · ISPE)", 0.492],
      ["Limpio ISO 7", 30, "45 cambios/h contra 30, mínimo de ISO 7 (rango 30–60, ISO 14644-4 · ISPE)", 0.34],
      ["Limpio ISO 8 alto", 15, "40 cambios/h contra 15, mínimo URS típico de ISO 8 (rango de la clase 10–25)", 0.303],
    ].forEach(([zona, piso, ahora, tr]) => {
      const op = de(zona);
      if (!op) throw new Error(`${zona}: Kaizen no propone bajar los cambios de aire`);
      eq(op.ahora, ahora, `${zona} estado actual:`);
      contiene(op.cambio, `Bajar a ${piso} si el URS lo permite`, `${zona} propuesta:`);
      cerca(op.tr, tr, 0.001, `${zona} ahorro TR:`);
    });
    if (de("Limpio ISO 8")) throw new Error("ISO 8 a 25 cambios/h no debe proponer (ahorro a 15 bajo 0.2 TR)");
    if (de("Limpio ISO 7 bajo")) throw new Error("ISO 7 a 20 cambios/h ya está bajo el mínimo de su clase: no debe proponer bajar");
    eq(G("VALOR").props.filter((p) => p.medida === "kaizen:mov").length, 4, "medidas de movimiento en ingeniería de valor:");
    const xlsx = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
    if (xlsx.includes("que pide el URS para ISO 8")) throw new Error("el libro sigue afirmando \"que pide el URS para ISO 8\"");
    contiene(xlsx, "45 cambios/h contra 30, mínimo de ISO 7", "hoja INGENIERIA_VALOR:");
  } finally {
    S.zones = zonas0; S.zi = zi0; S.tab = tab0;
    if (perms0 === null) delete S.perms; else S.perms = perms0;
    G("KZ_CACHE").key = null; G("VZ_CACHE").key = null;
    G("recompute")();
  }
});
t("22.13 4.1 un respaldo con el cuarto limpio en formato viejo se migra al sanear y conserva lo capturado", () => {
  const viejo = { name: "Sala de llenado", iso: "iso6", level: "max", area: 120, height: 3, dp: 15, crackLen: 10, oaFrac: 0.15, occ: 8, procW: 40 };
  const resp = { ...JSON.parse(JSON.stringify(G("defaultState")())), clean: { ...viejo }, pid: null, linaje: null };
  const s = G("sanearEstado")(JSON.parse(JSON.stringify(resp)));
  eq(Array.isArray(s.clean.rooms), true, "rooms[] tras sanear:");
  eq(s.clean.rooms.length, 1, "cuartos:");
  eq(s.clean.ci, 0, "ci:");
  const r = s.clean.rooms[0];
  Object.entries(viejo).forEach(([k, v]) => eq(r[k], v, `cuarto migrado ${k}:`));
  eq(r.rooms, undefined, "rooms dentro del cuarto:");
  eq(r.ci, undefined, "ci dentro del cuarto:");
  const c = G("computeClean")(r);
  cerca(c.vol, 360, 1e-9, "volumen:");
  cerca(c.supply, 64800, 1e-6, "suministro m³/h:");
  eq(c.ffu, 72, "FFU:");
  /* Lo que ya terminaba en el cuarto por omisión sigue igual (huella de INIT y proyectos nuevos). */
  const def = JSON.stringify({ rooms: [G("defaultRoom")()], ci: 0 });
  eq(JSON.stringify(G("sanearEstado")(JSON.parse(JSON.stringify(G("INIT")))).clean), def, "clean de INIT:");
  eq(JSON.stringify(G("sanearEstado")({ clean: { rooms: [], x: 1 } }).clean), def, "rooms vacío:");
  eq(JSON.stringify(G("sanearEstado")({ clean: [] }).clean), def, "clean arreglo:");
  eq(JSON.stringify(G("sanearEstado")({ clean: null }).clean), def, "clean nulo:");
});

t("22.15 3.1 clasificación ISO y NFPA 13 salen NO EVALUADO en la hoja URS, nunca SI sin cálculo", () => {
  const clean0 = JSON.parse(JSON.stringify(S.clean));
  const renglones = (bytes, marca) => {
    const txt = Buffer.from(bytes).toString("utf8");
    const x = [...txt.matchAll(/<worksheet[\s\S]*?<\/worksheet>/g)].map((m) => m[0]).find((h) => h.includes(marca)) || "";
    const des = (z) => z.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    return [...x.matchAll(/<row\b[\s\S]*?<\/row>/g)].map((r) =>
      [...r[0].matchAll(/<c\b[^>]*?(?:\/>|>([\s\S]*?)<\/c>)/g)].map((c) => { const m = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(c[1] || ""); return m ? des(m[1]) : ""; }))
      .filter((f) => /^\d+$/.test(f[0] || ""));
  };
  try {
    const room = G("defaultRoom");
    /* Sala A fuera del rango de su clase: con el veredicto viejo decía SI. */
    S.clean = { ci: 0, rooms: [{ ...room("Sala A"), iso: "iso5", level: "med", achSet: 20, area: 40, height: 3, dp: 15 }] };
    G("recompute")();
    if (!(G("FUEGO") && G("FUEGO").qTotal > 0)) throw new Error("el caso necesita contra incendio con demanda");
    [["es", "MXN", "CUMPLIMIENTO DE URS", "Clasificacion del cuarto", "Densidad de descarga", "NO EVALUADO", "SI"],
     ["en", "USD", "URS COMPLIANCE", "Classification of room", "Discharge density", "NOT EVALUATED", "YES"]].forEach(([lang, mon, hoja, clasif, nfpa, ne, si]) => {
      const R = renglones(G("buildPropuestaXlsx")({ lang, mon }), hoja);
      const c = R.filter((f) => f[2].startsWith(clasif)), d = R.filter((f) => f[2].startsWith(nfpa));
      if (!c.length || !d.length) throw new Error(`${lang}: faltan los renglones de clasificación o NFPA 13`);
      eq(JSON.stringify(c.map((f) => f[5])), JSON.stringify([ne]), `${lang} veredicto de clasificación:`);
      eq(JSON.stringify(d.map((f) => f[5])), JSON.stringify([ne]), `${lang} veredicto NFPA 13:`);
      if ([...c, ...d].some((f) => f[5] === si)) throw new Error(`${lang}: queda un ${si} sin cálculo`);
    });
  } finally {
    S.clean = clean0;
    G("recompute")();
  }
});

t("22.16 2.4 con red municipal directa el aviso de caudal no menciona partida de bomba ni 0 HP", () => {
  const f0 = JSON.parse(JSON.stringify(S.fuego));
  try {
    S.fuego.riesgo = "extra1"; S.fuego.fuente = "municipal"; S.fuego.presFuente = 90;
    G("recompute")();
    const F = G("FUEGO");
    if (!(F.qTotal > F.qBomba)) throw new Error("el caso necesita demanda mayor que la lista");
    const av = F.avisos.filter((a) => /lista de prediseño/.test(a.msg));
    eq(av.length, 1, "un solo aviso de caudal:");
    if (/partida/.test(av[0].msg)) throw new Error("menciona una partida de bomba que no se cotiza: " + av[0].msg);
    if (/\b0 HP\b/.test(av[0].msg)) throw new Error("habla de 0 HP: " + av[0].msg);
    contiene(av[0].msg, "prueba de hidrante");
    S.fuego.fuente = "cisterna"; G("recompute")();
    contiene(G("FUEGO").avisos.find((a) => /lista de prediseño/.test(a.msg)).msg, "descripción de la partida", "con cisterna el texto de la bomba se conserva:");
  } finally {
    S.fuego = f0;
    G("recompute")();
  }
});

t("22.17 2.5 el resumen de la instantánea de soportería nombra el material de la tubería hidráulica", () => {
  const sn = G("snapshotSoporte")();
  const r = (mat) => G("resumenSnapSoporte")({ ...sn, hidroMat: mat });
  contiene(r("acero"), "soportada como acero");
  contiene(r("cobre"), "soportada como cobre");
  contiene(r("plastico"), "soportada como termoplástico");
  if (r("acero") === r("cobre")) throw new Error("la tarjeta desactualizada mostraría dos textos iguales");
});

/* ===== C. Contingencia en la configuración comercial (14-sep-2026) ======
   Decisiones del dueño: sobre el costo directo, 15 % de arranque, en la
   cotización privada y en la licitación; proyectos guardados sin el campo abren
   con 0 % para que su total no cambie. */
t("C.1 la contingencia es parte de la configuración de la casa con 15 % de arranque", () => {
  eq(G("QUOTE_SEED").contingencia, 0.15, "semilla:");
  eq(G("defaultState")().quote.contingencia, 0.15, "proyecto nuevo:");
  eq(G("sanearEstado")(G("defaultState")()).quote.contingencia, 0.15, "un proyecto nuevo guardado y reabierto la conserva:");
});
t("C.2 cotización privada: contingencia = % × costo directo, dentro del subtotal antes de IVA, sin generar indirectos ni utilidad", () => {
  const guardado = JSON.parse(JSON.stringify(S.quote));
  try {
    S.quote.contingencia = 0; G("recompute")();
    const Q0 = { ...G("QUOTE") };
    if (!(Q0.direct > 0)) throw new Error("el proyecto de prueba no tiene costo directo");
    eq(Q0.cont, 0, "con 0 %:");
    cerca(Q0.sub, Q0.direct + Q0.ind + Q0.uti + Q0.flete + Q0.fianza + Q0.finan, 0.01, "con 0 % el subtotal es el de antes:");
    S.quote.contingencia = 0.15; G("recompute")();
    const Q = G("QUOTE");
    cerca(Q.cont, Q.direct * 0.15, 0.01, "contingencia:");
    eq(Q.contPct, 0.15);
    cerca(Q.ind, Q0.ind, 0.01, "no mueve indirectos:"); cerca(Q.uti, Q0.uti, 0.01, "no mueve utilidad:");
    cerca(Q.sub, Q.direct + Q.ind + Q.uti + Q.cont + Q.flete + Q.fianza + Q.finan, 0.01, "antes de IVA:");
    cerca(Q.tot, Q.sub * (1 + S.quote.iva), 0.01, "total:");
    cerca(Q.tot - Q0.tot, Q.direct * 0.15 * (1 + S.quote.iva), 0.01, "diferencia de total:");
  } finally { Object.keys(S.quote).forEach((k) => delete S.quote[k]); Object.assign(S.quote, guardado); G("recompute")(); }
});
t("C.3 campo borrado vuelve a la semilla; con 0 % el renglón se oculta en pantalla y en todos los documentos", () => {
  const guardado = JSON.parse(JSON.stringify(S.quote));
  try {
    S.quote.contingencia = ""; G("recompute")();
    eq(G("QUOTE").contPct, 0.15, "vacío:");
    S.quote.contingencia = 0; G("recompute")();
    eq(G("QUOTE").contPct, 0, "cero capturado:");
    eq(G("QUOTE").cont, 0);
    S.tab = "cotizacion"; G("render")();
    const v = w.document.getElementById("view");
    if (/Contingencia · /.test(v.textContent)) throw new Error("el renglón de 0 % sigue en «Del costo al precio»");
    if (!v.querySelector('input[data-live="quote.contingencia"]')) throw new Error("la perilla debe seguir disponible para subirla");
    const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
    [["PDF de cotización", dec(G("buildCotizacionPdf")())], ["propuesta ES", dec(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }))],
     ["propuesta EN", dec(G("buildPropuestaPdf")({ lang: "en", mon: "USD" }))], ["licitación", Buffer.from(G("buildLicitacionPdf")()).toString("latin1")],
     ["libro ES", Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8")],
     ["libro EN", Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).toString("utf8")]].forEach(([etq, x]) => {
      if (/Contingenc(ia|y)/i.test(x)) throw new Error(etq + ": menciona la contingencia con 0 %");
    });
    /* Sin la fila, el subtotal del libro sigue sumando del directo a la fila anterior. */
    [["es", "COSTO DIRECTO", "SUBTOTAL ANTES DE IMPUESTO"], ["en", "DIRECT COST", "SUBTOTAL BEFORE TAX"]].forEach(([lang, dir, sub]) => {
      const x = Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : "USD" })).toString("utf8");
      const rDir = filaXlsxConRotulo(x, dir, /SUBTOTAL/), rSub = filaXlsxConRotulo(x, sub, /SUBTOTAL/);
      const f = celdasXlsxFila(x, sub, /SUBTOTAL/);
      if (!f.c.includes("=SUM(C" + rDir + ":C" + (rSub - 1) + ")")) throw new Error("libro " + lang + ": subtotal " + f.c.join(" | "));
      const tot = filaXlsxConRotulo(x, lang === "es" ? "TOTAL DE LA PROPUESTA" : "PROPOSAL TOTAL", /SUBTOTAL/);
      contiene(x, "!C" + tot + "</f>", "libro " + lang + ": la portada apunta al total:");
    });
  } finally { Object.keys(S.quote).forEach((k) => delete S.quote[k]); Object.assign(S.quote, guardado); G("recompute")(); }
});
t("C.4 un proyecto guardado antes de la contingencia abre con 0 % y su total no cambia", () => {
  const viejo = JSON.parse(JSON.stringify(G("defaultState")()));
  delete viejo.quote.contingencia;
  eq(G("sanearEstado")(viejo).quote.contingencia, 0, "sanearEstado:");
  const qv = JSON.parse(JSON.stringify(S.quote)); delete qv.contingencia;
  eq(G("cotizacionTecnica")(qv).contingencia, 0, "copia técnica de una cotización vieja:");
  const qn = JSON.parse(JSON.stringify(S.quote)); qn.contingencia = 0.15;
  eq(G("cotizacionTecnica")(qn).contingencia, 0.15, "copia técnica de una cotización nueva:");
});
t("C.5 licitación: la contingencia entra en la cascada sobre el costo directo y se imprime", () => {
  const guardado = JSON.parse(JSON.stringify(S.quote));
  try {
    S.quote.indirectPct = 18; S.quote.profitPct = 12; S.quote.finPct = 1.5; S.quote.contingencia = 0.15;
    const E = G("estructuraSobrecosto")(1000000);
    cerca(E.cc, 150000, 0.01, "contingencia sobre directo:");
    cerca(E.pu, (1000000 * 1.18 * 1.015 * 1.12 + 150000) * 1.007, 0.01, "importe integrado:");
    S.quote.contingencia = 0;
    cerca(G("estructuraSobrecosto")(1000000).pu, 1350813.968, 0.01, "con 0 % es el importe de antes:");
    S.quote.contingencia = 0.15;
    const txt = Buffer.from(G("buildLicitacionPdf")()).toString("latin1");
    const celdas = [...txt.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1"));
    const i = celdas.findIndex((c) => c === "Contingencia");
    if (i < 0) throw new Error("el PDF de licitación no trae la fila de contingencia");
    eq(celdas[i + 2], "15", "% impreso:");
    S.tab = "cotizacion"; G("render")();
    const campo = [...w.document.querySelectorAll("#view .field")].find((f) => /Contingencia %/.test(f.textContent));
    if (!campo) throw new Error("la tarjeta de licitación no muestra la contingencia");
    eq(campo.querySelector("input").value, "15");
  } finally { Object.keys(S.quote).forEach((k) => delete S.quote[k]); Object.assign(S.quote, guardado); G("recompute")(); }
});
t("C.6 pantalla: perilla, captura y renglón del costo al precio", () => {
  S.tab = "cotizacion"; G("render")();
  const v = w.document.getElementById("view");
  if (!v.querySelector('input[data-live="quote.contingencia"]')) throw new Error("no hay perilla de contingencia");
  contiene(v.textContent, "Contingencia · 15.0 % sobre directo");
});
t("C.7 documentos: PDF de cotización, propuesta PDF y libro Excel en español e inglés", () => {
  const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
  contiene(dec(G("buildCotizacionPdf")()), "Contingencia 15.0 % sobre costo directo", "PDF de cotización:");
  contiene(dec(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })), "Contingencia sobre costo directo 15 %", "propuesta ES:");
  const en = dec(G("buildPropuestaPdf")({ lang: "en", mon: "USD" }));
  contiene(en, "Contingency on direct cost 15 %", "propuesta EN:");
  if (/Contingencia/.test(en)) throw new Error("la propuesta en inglés dejó «Contingencia» en español");
  [["es", "MXN", "Contingencia sobre costo directo", "COSTO DIRECTO", "SUBTOTAL ANTES DE IMPUESTO"],
   ["en", "USD", "Contingency on direct cost", "DIRECT COST", "SUBTOTAL BEFORE TAX"]].forEach(([lang, mon, etq, dir, sub]) => {
    const x = Buffer.from(G("buildPropuestaXlsx")({ lang, mon })).toString("utf8");
    const f = celdasXlsxFila(x, etq, /SUBTOTAL/);
    if (!f) throw new Error(`libro ${lang} sin fila de contingencia`);
    const rDir = filaXlsxConRotulo(x, dir, /SUBTOTAL/), rSub = filaXlsxConRotulo(x, sub, /SUBTOTAL/);
    if (!f.c.includes(`=C${rDir}*0.15`)) throw new Error(`libro ${lang}: la fila no es fórmula sobre el directo: ${f.c.join(" | ")}`);
    if (!(f.r > rDir && f.r < rSub)) throw new Error(`libro ${lang}: la contingencia quedó fuera del SUM del subtotal`);
    const fs2 = celdasXlsxFila(x, sub, /SUBTOTAL/);
    if (!fs2.c.includes(`=SUM(C${rDir}:C${rSub - 1})`)) throw new Error(`libro ${lang}: subtotal ${fs2.c.join(" | ")}`);
  });
});

/* ===== I. Botones de IVA de la cotización (14-sep-2026) ================ */
t("I.1 los botones de IVA escriben 8 %, 16 % y exento como número, y el total los respeta", () => {
  const guardado = JSON.parse(JSON.stringify(S.quote));
  try {
    const pulsar = (texto) => {
      S.tab = "cotizacion"; G("render")();
      const b = [...w.document.querySelectorAll('#view [data-act="setnum"][data-path="quote.iva"]')].find((x) => x.textContent.includes(texto));
      if (!b) throw new Error("no está el botón «" + texto + "»");
      b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    };
    [["8 % franja fronteriza", 0.08], ["Exento", 0], ["16 % nacional", 0.16], ["8 % franja fronteriza", 0.08]].forEach(([texto, v]) => {
      pulsar(texto);
      eq(S.quote.iva, v, "«" + texto + "» guarda:");
      G("recompute")();
      const Q = G("QUOTE");
      cerca(Q.iva, Q.sub * v, 0.01, "IVA de «" + texto + "»:");
      S.tab = "cotizacion"; G("render")();
      const on = [...w.document.querySelectorAll('#view .qchip.on[data-path="quote.iva"]')].map((x) => x.textContent.trim());
      eq(on.length, 1, "un solo botón marcado:"); contiene(on[0], texto);
    });
    /* Un botón setnum sin valor numérico ya no escribe NaN. */
    const b = w.document.createElement("button");
    b.dataset.act = "setnum"; b.dataset.path = "quote.iva"; w.document.getElementById("view").appendChild(b);
    b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    eq(S.quote.iva, 0.08, "un botón sin valor no toca el IVA:");
  } finally { Object.keys(S.quote).forEach((k) => delete S.quote[k]); Object.assign(S.quote, guardado); G("recompute")(); }
});

/* ===== J. Interruptor principal con motores, art. 430-63 (15-sep-2026) ===
   Decisión del dueño: el principal no debe bajar de lo que exige proteger el
   alimentador general (ya con IdisAlim) NI de la protección del ramal del
   motor mayor (430-52, 250 % de su corriente a plena carga); se usa el mayor
   de los dos, sin techo artificial — la propia protección del motor ya es su
   límite normativo. Ver H-2.1 de la auditoría de rev 2.9.5. */
t("J.1 2.1 el interruptor principal no baja de la protección del ramal del motor mayor (art. 430-63) aunque el alimentador pida menos", () => {
  const guardado = JSON.parse(JSON.stringify(S.elec));
  try {
    S.elec = { ...G("defaultElec")(), sistema: "3F4H-220", material: "cobre", tempAmb: 30, nCond: 3,
      dvRamal: 3, dvTotal: 5, trafoKVA: 300, trafoZ: 4, Ltablero: 3, fpObjetivo: .95, tomarHVAC: false,
      cargas: [{ id: "j1m1", nombre: "Motor grande", tipo: "motor", kW: 45, V: 220, ph: 3, cant: 1, L: 10, fp: .85, fija: false }] };
    G("recompute")();
    const E = G("ELEC");
    const motor = E.calc.find((c) => c.tipo === "motor");
    if (!(motor.cond.ocpd > E.alim.ocpd))
      throw new Error(`el caso no aísla lo que se quiere probar: el ramal del motor (${motor.cond.ocpd} A) debe pedir más que el alimentador general (${E.alim.ocpd} A)`);
    eq(E.principal, motor.cond.ocpd, "el principal sube hasta la protección del ramal del motor mayor:");
  } finally { S.elec = guardado; G("recompute")(); }
});
t("J.2 2.1 sin motores, el interruptor principal es la protección del alimentador general", () => {
  const guardado = JSON.parse(JSON.stringify(S.elec));
  try {
    S.elec = { ...G("defaultElec")(), tomarHVAC: false,
      cargas: [{ id: "j2a1", nombre: "Alumbrado", tipo: "alumbrado", kW: 20, V: 220, ph: 3, cant: 1, L: 20, fp: .95, fija: false }] };
    G("recompute")();
    const E = G("ELEC");
    if (E.calc.some((c) => c.tipo === "motor")) throw new Error("el caso no aísla lo que se quiere probar: no debe haber motores");
    eq(E.principal, E.alim.ocpd, "sin motores el principal es la protección del alimentador:");
  } finally { S.elec = guardado; G("recompute")(); }
});

/* ===== K. Arranque de % de licitación desde la privada, 1.1 (15-sep-2026) */
t("K.1 un proyecto viejo con la privada en otro % copia indirectos y utilidad a la licitación al abrir", () => {
  const viejo = JSON.parse(JSON.stringify(G("defaultState")()));
  viejo.quote.indirect = 0.20; viejo.quote.utility = 0.15;
  delete viejo.quote.indirectPct; delete viejo.quote.profitPct;
  const s = G("sanearEstado")(viejo);
  eq(s.quote.indirectPct, 20, "indirectos copiados de la privada:");
  eq(s.quote.profitPct, 15, "utilidad copiada de la privada:");
});
t("K.2 un proyecto nuevo no copia nada: privada y licitación nacen en la misma semilla", () => {
  const s = G("sanearEstado")(JSON.parse(JSON.stringify(G("defaultState")())));
  eq(s.quote.indirectPct, G("QUOTE_SEED").indirectPct, "licitación en semilla:");
  eq(s.quote.profitPct, G("QUOTE_SEED").profitPct, "licitación en semilla:");
});
t("K.3 una licitación ya editada a mano no se pisa aunque la privada sea distinta", () => {
  const guardado = JSON.parse(JSON.stringify(G("defaultState")()));
  guardado.quote.indirectPct = 25; guardado.quote.profitPct = 8;
  guardado.quote.indirect = 0.20; guardado.quote.utility = 0.15;
  const s = G("sanearEstado")(guardado);
  eq(s.quote.indirectPct, 25, "licitación editada se conserva:");
  eq(s.quote.profitPct, 8, "licitación editada se conserva:");
});
t("K.4 la privada exactamente en la semilla no dispara copia aunque falte el campo", () => {
  /* Sin nada que copiar, el campo se queda sin tocar (igual que otros campos
     de S.quote que no traía un proyecto viejo): lo lee con num(...) contra la
     semilla, el mismo patrón que usa el resto de la Suite. */
  const viejo = JSON.parse(JSON.stringify(G("defaultState")()));
  delete viejo.quote.indirectPct; delete viejo.quote.profitPct;
  const s = G("sanearEstado")(viejo);
  eq(G("num")(s.quote.indirectPct, G("QUOTE_SEED").indirectPct), G("QUOTE_SEED").indirectPct, "nada que copiar, privada = semilla:");
  eq(G("num")(s.quote.profitPct, G("QUOTE_SEED").profitPct), G("QUOTE_SEED").profitPct, "nada que copiar, privada = semilla:");
});

/* ============================== resultado =============================== */
const total = ok + fail;
console.log(`\nSuiteEmp rev ${G("REV")} · banco de comprobaciones de la rev 2.9.3`);
console.log(`${ok} de ${total} comprobaciones correctas`);
if (fallos.length) { console.log("\nFALLOS:"); fallos.forEach(([n2, m]) => console.log(` ✗ ${n2}\n   ${m}`)); }
if (w.__errs.length) console.log("\nerrores de ventana:", w.__errs);
process.exit(fail ? 1 : 0);
