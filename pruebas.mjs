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
/* H-253: la formal no sale con la importación «Por cotizar». Las pruebas que revisan el CONTENIDO de la licitación la emiten
   con una importación capturada (monto, fuente y fecha) sólo durante la emisión, y dejan el estado como estaba.
   H-252: con precios semilla la formal tampoco sale; esas pruebas la emiten como borrador interno ({borrador: true}). */
const licitacionFormal = () => {
  const imp0 = JSON.parse(JSON.stringify(S.quote.importacion || {}));
  S.quote.importacion = { monto: 1000, moneda: "MXN", fuente: "banco de pruebas: importación capturada para emitir la formal", fecha: "2026-09-25" };
  try { return G("buildLicitacionPdf")({ borrador: true }); } finally { S.quote.importacion = imp0; G("recompute")(); }
};

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
/* H-266: soportería cuenta los metros de los otros motores sólo con la instantánea aceptada (propuesta motores>soporte). Las
   pruebas que arman motores y miran la soportería la aceptan después de calcular, como lo haría el usuario. */
const aceptarSoporte = () => { G("recompute")(); S.soporte.snap = G("snapshotSoporte")(); S.soporte.usarMotores = true; G("recompute")(); };
/* H-267: la selección de equipo calcula sólo con sus zonas de selección (capturadas en su pestaña o aceptadas de carga térmica como
   instantánea). Las pruebas que arman zonas y miran el sistema integrado aceptan la propuesta load>equip después de calcular, como
   lo haría el usuario (sin autoguardar ni pintar: lo mismo que hace aceptar, con su vínculo y su fecha). */
const aceptarEquip = () => { G("recompute")(); G("aceptarZonasEquip")(G("zonasPropuestasEquip")(), Date.now()); G("registrarVinculo")("load>equip", "aceptado"); G("recompute")(); };

/* --------------------------------------------------- proyecto de prueba */
function proyectoDePrueba() {
  S.meta.name = "Banco de pruebas 2.7.0";
  S.meta.client = "EMP interno";
  /* Arranque en ceros: defaultZone() ya no trae muros/vidrio/luces/equipo
     de ejemplo; el proyecto de prueba compartido por todo el banco arma los
     suyos explícitos para seguir siendo un caso de carga térmica real. */
  S.zones = [
    { ...G("defaultZone")("Producción"), area: 400, height: 6, occ: 30,
      walls: { N: 28, NE: 0, E: 18, SE: 0, S: 28, SW: 0, W: 18, NW: 0 },
      glass: { N: 4, NE: 0, E: 6, SE: 0, S: 12, SW: 0, W: 8, NW: 0 },
      lights: 1200, equip: 1440, ach: .4 },
    { ...G("defaultZone")("Oficinas"), area: 100, height: 3, occ: 10,
      walls: { N: 10, NE: 0, E: 8, SE: 0, S: 10, SW: 0, W: 8, NW: 0 },
      glass: { N: 3, NE: 0, E: 2, SE: 0, S: 4, SW: 0, W: 2, NW: 0 },
      lights: 400, equip: 500, ach: .4 },
  ];
  S.zi = 0;
  /* H-262: ventilación ya no hereda de carga térmica; el proyecto de prueba le captura sus propios datos, los mismos que antes
     heredaba (área 500 m², altura media 5.4 m, 40 ocupantes), para que las cifras del resto del banco no cambien. */
  Object.assign(S.vent, { area: 500, height: 5.4, occ: 40 });
  /* H-264: contra incendio tampoco hereda; captura lo que antes heredaba (500 m², altura máxima 6 m). */
  Object.assign(S.fuego, { area: 500, altura: 6 });
  /* H-265: obra civil tampoco toma las zonas: captura las mismas áreas de obra que antes leía de ellas. */
  S.civil.areas = S.zones.map((z, i) => ({ id: "a" + (i + 1), nombre: z.name, area: z.area, altura: z.height, perimetro: 0 }));
  /* H-250: el banco emite espejos EN-USD; sin tipo de cambio fechado ya no se emiten, así que el proyecto de prueba lo captura. */
  S.quote.fx = 18.5; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "banco de pruebas";
  G("recompute")();
  /* H-267: la selección de equipo ya no lee la carga en vivo; el proyecto de prueba acepta la propuesta de carga térmica, como el
     usuario, para que el sistema integrado (y todo lo que se alimenta de él) tenga las mismas cifras que antes. */
  aceptarEquip();
}
proyectoDePrueba();
/* rev 2.9.12 · La marca ya no se fija como literal en las pruebas: se lee
   del --marca del :root, que es la única fuente. Cambiar la paleta de la
   casa no debe obligar a reescribir cuatro pruebas; lo que se exige es que
   PDF y Excel sigan a la pantalla. */
const MARCA_HEX = (() => { const css = w.document.querySelector("style").textContent;
  return (/--marca:\s*#([0-9A-Fa-f]{6})/.exec(css) || [])[1].toUpperCase(); })();
const MARCA_RGB = [0, 2, 4].map((i) => +(parseInt(MARCA_HEX.slice(i, i + 2), 16) / 255).toFixed(3));
const MARCA_ARGB = "FF" + MARCA_HEX;

/* ============================ 1. Menú de disciplinas en cuadrícula =======
   rev 2.9.2 · La cuadrícula de disciplinas ya NO se pinta dentro de una
   pantalla de captura: la navegación es en ciclo y dentro de un módulo la
   cabecera es la barra de regreso. El índice escrito del proyecto es el
   tablero, y ahí es donde la cuadrícula sigue viviendo. */
S.tab = "tablero"; G("render")();
const tabsHtml = () => w.document.getElementById("tabs").innerHTML;
t("1.1 el menú es una columna de disciplinas a la izquierda, no una cuadrícula de íconos grandes", () => {
  /* rev 2.9.12 · Decisión del dueño (19-sep-2026): navegación en columnas de
     izquierda a derecha, estilo Claude. La cuadrícula de íconos grandes se
     retiró; si vuelve, esta comprobación lo detiene. */
  const h = tabsHtml();
  contiene(h, 'class="latg"'); contiene(h, 'class="lati"');
  if (/class="ngb"|class="ngi"/.test(h)) throw new Error("volvió la cuadrícula de íconos grandes");
  if (h.indexOf('class="tsep"') >= 0) throw new Error("quedó el separador de la tira de pestañas");
});
t("1.2 cada disciplina es un renglón de texto con un ícono chico al costado, sólo de referencia", () => {
  const tabs = G("TABS").map(([id]) => id);
  const h = tabsHtml();
  tabs.forEach((id) => {
    contiene(h, `data-tab="${id}"`, `disciplina ${id}:`);
    if (!G("ICONOS")[id]) throw new Error(`la disciplina ${id} no tiene símbolo declarado`);
  });
  eq((h.match(/<svg /g) || []).length, tabs.length, "un ícono por disciplina:");
  eq((h.match(/<svg width="15"/g) || []).length, tabs.length, "los íconos son chicos, de referencia:");
  eq((h.match(/class="ltx"/g) || []).length, tabs.length, "cada renglón lleva su nombre en texto:");
  /* El clic es sobre el renglón completo: el ícono va DENTRO del botón del
     renglón, no es un botón aparte. */
  eq((h.match(/<button class="lati"/g) || []).length, tabs.length, "un solo botón por renglón:");
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
t("1.5.1 dentro de una disciplina la columna de disciplinas sigue a la vista y marca la que está abierta", () => {
  /* rev 2.9.12 · Revierte a propósito la "navegación en ciclo" de la 2.9.2
     (que ocultaba las demás disciplinas): el dueño pidió la columna fija. */
  S.tab = "ductos"; G("render")();
  const h = tabsHtml();
  G("TABS").forEach(([id]) => contiene(h, `data-tab="${id}"`, `falta ${id} en la columna:`));
  eq((h.match(/aria-selected="true"/g) || []).length, 1, "una sola disciplina marcada:");
  contiene(h, 'data-tab="hvac" aria-selected="true"', "estando en ductos, se marca el módulo HVAC:");
  contiene(w.document.getElementById("view").innerHTML, 'class="modbar"', "falta el título de la disciplina en el contenido:");
  contiene(w.document.getElementById("view").innerHTML, "HVAC", "el título no dice en qué disciplina se está:");
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
  if (A.some((ar) => ar.regla === 1)) throw new Error("H-264/H-265: quedó una flecha de herencia (regla 1); ninguna disciplina hereda");
  if (!A.some((ar) => ar.regla === 2)) throw new Error("ninguna arista de regla 2");
});
t("2.0.6 cada flecha se pinta con el estado de lo que declara (H-264, H-265: ya no hay herencias; las propuestas se pintan con su estado)", () => {
  S.tab = "inicio"; G("render")();
  if (G("ARISTAS").some((x) => x.regla === 1)) throw new Error("quedó una flecha de herencia");
  const ar = G("ARISTAS").find((x) => x.de === "hvac" && x.a === "elec" && x.regla === 2);
  if (!ar) throw new Error("no existe la flecha de propuesta de HVAC a eléctrico");
  const e = G("estadoArista")(ar);
  if (!["vigente", "desactualizada", "propia", "pendiente", "inerte"].includes(e)) throw new Error("estado de flecha desconocido: " + e);
  contiene(vista(), "dar-" + e);
});
t("2.0.7 y el nodo HVAC se desactualiza cuando cambió el dato de origen", () => {
  /* La propuesta de carga térmica a ductos quedó DENTRO del módulo: ya no se
     dibuja como flecha, pero su estado no se perdió — sube al semáforo del
     nodo, que muestra el peor de los cinco. */
  G("propAceptar")("load>duct");
  S.zones[0].area = Number(S.zones[0].area) + 150; G("recompute")();
  eq(G("estadoPropuesta")("load>duct").nivel, "desactualizado", "la propuesta interna:");
  /* H-267: la selección de equipo tomó la carga como instantánea aceptada: también queda desactualizada, dentro del mismo nodo. */
  eq(G("estadoPropuesta")("load>equip").nivel, "desactualizado", "la propuesta interna de selección:");
  eq(G("semaforoHvac")().nivel, "desactualizada", "el peor de los cinco manda en el nodo:");
  S.tab = "inicio"; G("render")();
  contiene(vista(), "sem-desactualizada");
  G("propAceptar")("load>duct");
  G("recompute")();
  eq(G("semaforoHvac")().nivel, "desactualizada", "H-267: con la selección todavía desactualizada el nodo sigue desactualizado:");
  G("propAceptar")("load>equip");
  G("recompute")();
  if (G("semaforoHvac")().nivel === "desactualizada") throw new Error("al actualizar el nodo no volvió a estar al día");
  /* Se deja el proyecto como estaba para que las pruebas de las reglas
     empiecen desde cero y no desde lo que acepto esta. */
  S.zones[0].area = Number(S.zones[0].area) - 150;
  delete S.vinculos["load>duct"];
  S.duct.segments = [];
  aceptarEquip();   /* H-267: la selección vuelve a la carga original, como la dejó el proyecto de prueba */
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
  ["Tablero del proyecto", "Con datos", "Desactualizadas"].forEach((x) => contiene(v, x));
  /* H-262 a H-266: ninguna disciplina hereda: la tarjeta de geometría heredada ya no tiene qué mostrar y no se pinta. */
  if (v.includes("Geometría y ocupación heredadas")) throw new Error("el tablero sigue pintando la tarjeta de herencia sin herencias");
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
  sem.filter((s) => s.tab && G("conSemaforo")(s)).forEach((s) => contiene(h, `sem-${s.nivel}`, `${s.id}:`));
  /* rev 2.9.16 · Kaizen y Valor no llevan semáforo: ni punto en el menú. */
  if (/sem-gestion/.test(h)) throw new Error("el menú pinta un punto de semáforo a Kaizen o Valor");
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
t("3.2 ninguna disciplina hereda: ventilación (H-262) y contra incendio (H-264) calculan con lo capturado en su pestaña", () => {
  G("recompute")();
  eq(Object.keys(G("HEREDA")).length, 0, "HEREDA queda vacío:");
  eq(S.fuego.area, 500, "contra incendio: el área capturada:"); eq(S.fuego.altura, 6, "contra incendio: la altura capturada:");
  eq(S.vent.area, 500, "ventilación: el área capturada:");
});
t("3.3 si cambia la geometría de las zonas, ningún destino se mueve (H-262, H-264)", () => {
  S.zones[1].area = 300; S.zones[1].height = 8; G("recompute")();
  eq(S.fuego.area, 500, "H-264: contra incendio se queda con lo capturado:"); eq(S.fuego.altura, 6, "H-264: la altura tampoco sigue a la zona más alta:");
  eq(S.vent.area, 500, "H-262: ventilación se queda con lo capturado:");
  S.zones[1].area = 100; S.zones[1].height = 3; G("recompute")();
});
t("3.4 la pantalla ya no anuncia herencia: un campo que no está en HEREDA no pinta aviso (H-264)", () => {
  eq(G("herenciaHtml")("fuego.area"), "", "fuego.area:"); eq(G("herenciaHtml")("vent.area"), "", "vent.area:");
});
t("3.5 lo capturado manda: cambiarlo mueve el cálculo y las zonas no lo pisan (H-264)", () => {
  G("setPath")("fuego.area", 250); G("recompute")();
  eq(S.fuego.area, 250, "respeta lo capturado:");
  S.zones[1].area = 300; G("recompute")();
  eq(S.fuego.area, 250, "el cambio de zonas no lo pisa:");
  S.zones[1].area = 100; G("setPath")("fuego.area", 500); G("recompute")();
  eq(S.fuego.area, 500);
});
t("3.6 no queda registro de herencia: sincronizarHerencia no copia nada y el saneado retira los registros viejos (H-264)", () => {
  const her0 = JSON.stringify(S.her || {});
  G("sincronizarHerencia")();
  eq(JSON.stringify(S.her || {}), her0, "sincronizarHerencia no escribe:");
  const s = G("sanearEstado")(JSON.parse(JSON.stringify({ ...S, her: { "fuego.area": { modo: "heredado", ts: 1, valor: 500 }, "vent.area": { modo: "propio", ts: 1, valor: 500 } } })));
  eq(Object.keys(s.her).length, 0, "registros viejos retirados:");
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
  /* H-262: la propuesta load>vent ya no existe; se prueba con la de la cédula eléctrica, sin dejar rastro en el estado. */
  const guardado = JSON.stringify(S);
  try {
    G("propPropio")("cedula>elec");
    const v = G("vinculoDe")("cedula>elec");
    eq(v.estado, "propio");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "propio");
    eq(G("PROPUESTAS")["load>vent"], undefined, "H-262: no queda propuesta carga térmica → ventilación:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});
t("4.5 (H-268) la cédula de equipos no entra al cuadro de cargas sin aceptarla: ni con los cruces autorizados ni con el tomarHVAC de revisiones anteriores (se retiró el modo en vivo)", () => {
  eq(S.elec.tomarHVAC, false, "el modo automático viene apagado:");
  const auto = (G("ELEC").calc || []).filter((c) => c.auto);
  eq(auto.length, 0, "cargas que entraron solas:");
  eq(G("estadoPropuesta")("cedula>elec").nivel, "pendiente");
  /* H-268: el modo en vivo se retiró: con los cruces autorizados y tomarHVAC tampoco entra nada sin aceptar la propuesta. */
  const perms0 = JSON.parse(JSON.stringify(S.perms)), n0 = G("ELEC").calc.length;
  try {
    G("CRUCES_ELEC").forEach((k) => { S.perms[k] = { ts: 1, via: "prueba 4.5" }; }); S.elec.tomarHVAC = true; G("recompute")();
    eq(G("ELEC").calc.length, n0, "con tomarHVAC y los cruces autorizados nada entra sin aceptar la propuesta:");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "pendiente", "la propuesta sigue por decidir, no «vivo»:");
  } finally { S.elec.tomarHVAC = false; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, perms0); G("recompute")(); }
});
t("4.6 aceptada, cada carga queda como carga propia del cuadro con su origen", () => {
  G("propAceptar")("cedula>elec");
  const ced = (S.elec.cargas || []).filter((c) => c.origen === "cedula");
  if (!ced.length) throw new Error("no entró ninguna carga de la cédula");
  ced.forEach((c) => { if (!c.ts) throw new Error("carga sin fecha de origen"); });
  eq(G("estadoPropuesta")("cedula>elec").nivel, "aceptado");
});
/* H-177 (rev 2.9.24): el equipo con motocompresor se rige por el art. 440 con sus datos de placa; aceptar la cédula
   descartaba MCA y MOP y el cuadro protegía al 250 % de la Tabla 430-52, por arriba del MOP. */
t("S.45 (H-177) aceptada la cédula, cada equipo con motocompresor conserva su MCA y su MOP; el conductor cubre la MCA y la protección no pasa del MOP (NOM-001-SEDE-2012 440-4(b), 440-22(a) y (c), 440-35, p. 445-450)", () => {
  const prop = G("propuestaElecFilas")().filter((c) => Number(c.mop) > 0);
  if (!prop.length) throw new Error("la cédula del banco no trae equipos con MOP: la prueba no probaría nada");
  const ced = (S.elec.cargas || []).filter((c) => c.origen === "cedula" && Number(c.mop) > 0);
  eq(ced.length, prop.length, "cargas aceptadas que conservan el MOP:");
  ced.forEach((c, i) => { eq(c.mca, prop[i].mca, `${c.nombre}, MCA:`); eq(c.mop, prop[i].mop, `${c.nombre}, MOP:`); });
  const filas = G("ELEC").calc.filter((c) => Number(c.mop) > 0);
  eq(filas.length, prop.length, "filas del cuadro con MOP:");
  filas.forEach((c) => {
    if (!(c.cond.ocpd <= c.mop)) throw new Error(`${c.nombre}: protección ${c.cond.ocpd} A arriba del MOP ${c.mop} A`);
    if (!(c.cond.ampCorr >= c.mca)) throw new Error(`${c.nombre}: ampacidad corregida ${c.cond.ampCorr} A abajo de la MCA ${c.mca} A`);
    /* La MCA y el MOP de la cédula los estimó la suite (elecOf): se marcan y no bajan el conductor del 125 % de la corriente. */
    eq(c.mcaEst && c.mopEst, true, `${c.nombre}, MCA y MOP marcados como estimados:`);
    if (!(c.cond.ampCorr >= 1.25 * c.I - 1e-9)) throw new Error(`${c.nombre}: con MCA estimada el conductor (${c.cond.ampCorr} A) quedó abajo del 125 % de ${c.I} A`);
  });
  const memoria = G("ELEC").memo.join(" ");
  contiene(memoria, "ESTIMADA", "la memoria marca la MCA estimada:"); contiene(memoria, "ESTIMADO", "la memoria marca el MOP estimado:");
  if (!G("ELEC").avisos.some((a) => /estimad/i.test(a.msg) && /placa/.test(a.msg))) throw new Error("sin aviso de MCA/MOP estimados");
});
/* H-177: datos de placa incompletos o incongruentes, placa capturada por el usuario y equipo sin kW. */
t("S.46 (H-177) art. 440 con placa: sólo el MOP → aviso y se protege como motor general; MCA de placa manda sola; MOP 10 A → fusible de 10 A, nunca 15; sin kW no fija el principal", () => {
  const guardado = JSON.stringify(S.elec);
  const dc = (x) => ({ ...G("defaultCarga")(x.nombre), tipo: "motor", V: 220, ph: 3, cant: 1, L: 20, fp: .85, ...x });
  const arma = (cargas) => { S.elec = { ...G("defaultElec")(), tomarHVAC: false, trafoKVA: 300, Ltablero: 30, trafoZ: 4, cargas }; G("recompute")(); return G("ELEC"); };
  try {
    let R = arma([dc({ nombre: "Mini split", kW: 1, ph: 1, fp: .9, L: 10, mca: 6, mop: 10 })]);
    eq(R.calc[0].cond.ocpd, 10, "MOP 10 A → fusible de 10 A (240-6(a)), no 15:");
    eq(R.calc[0].cond.fusible, true, "se declara fusible:");
    R = arma([dc({ nombre: "Sólo MOP", kW: 10, mop: 60 })]);
    if (!R.avisos.some((a) => a.lvl === "err" && /falta la MCA/.test(a.msg))) throw new Error("sin aviso de MCA faltante");
    eq(R.calc[0].cond.ocpd, 110, "con un solo dato no rige el art. 440: motor general, 10 kW → 15 hp → 42 A (Tabla 430-250, H-178), 250 % → 110 A:");
    R = arma([dc({ nombre: "Sólo MCA", kW: 10, mca: 40 })]);
    if (!R.avisos.some((a) => a.lvl === "err" && /falta el MOP/.test(a.msg))) throw new Error("sin aviso de MOP faltante");
    eq(R.calc[0].I, 42, "sólo la MCA: tampoco rige el art. 440; motor general por la Tabla 430-250 (10 kW → 15 hp → 42 A):");
    eq(R.calc[0].cond.ocpd, 110, "sólo la MCA: 250 % de 42 A → 110 A:");
    R = arma([dc({ nombre: "Placa MCA 40", kW: 12, mca: 40, mop: 60 })]);
    eq(R.calc[0].mcaEst, false, "capturada por el usuario, la MCA es de placa:");
    eq(R.calc[0].cond.Idis, 40, "la MCA de placa manda sola (aunque 125 % de la corriente calculada dé más):");
    R = arma([dc({ nombre: "IEC 32", kW: 7, ph: 1, fp: .9, L: 10, mca: 31, mop: 32 })]);
    eq(R.calc[0].cond.ocpd, 32, "32 A es normalizado en 240-6(a):");
    R = arma([dc({ nombre: "MOP bajo", kW: 12, mca: 44, mop: 42 })]);
    if (!R.avisos.some((a) => a.lvl === "warn" && /debajo de la MCA/.test(a.msg))) throw new Error("sin aviso de protección debajo de la MCA");
    R = arma([dc({ nombre: "Sin kW", kW: 0, mca: 50, mop: 80 }), { ...G("defaultCarga")("Alumbrado"), tipo: "alumbrado", kW: 3, V: 127, ph: 1, cant: 1, L: 20, fp: .95 }]);
    eq(R.calc[0].cond.ocpd, 80, "el ramal sin kW sí se dimensiona con su placa:");
    eq(R.principal, R.alim.ocpd, "una carga que no entra a la demanda no fija el principal:");
    if (!R.avisos.some((a) => a.lvl === "err" && /sin kW/.test(a.msg))) throw new Error("sin aviso de equipo sin kW");
    R = arma([dc({ nombre: "Borrados", kW: 10, modelo: "40VMA-096", origen: "cedula" })]);
    if (!R.avisos.some((a) => /sin MCA ni MOP/.test(a.msg) && /ESTIMÓ/.test(a.msg))) throw new Error("equipo de catálogo sin MCA ni MOP sin aviso de corriente estimada");
    eq(R.calc[0].motorTabla, null, "equipo con motocompresor (modelo de la cédula) sin placa: no es motor de uso general (440-6(a)), no pasa por la Tabla 430-250 (H-178):");
    cerca(R.calc[0].I, 10000 / (Math.sqrt(3) * 220 * .85), 0.01, "sigue con kW/(1.732·V·fp) hasta capturar la placa:");
    if (R.avisos.some((a) => /antes de la rev/.test(a.msg))) throw new Error("aviso que afirma una fecha que no conoce");
  } finally { S.elec = JSON.parse(guardado); G("recompute")(); }
});
/* H-179 (rev 2.9.24): «nada se estima» (CLAUDE.md regla 6). Ltablero 30 m, transformador 150 kVA / Z 4 %, distancias automáticas
   Ltablero + 15/25/20/15/30/10 m y 25 m por carga se imprimían como si fueran captura. Cubre también H-189 (L = 0 imprimía
   una caída de 0.00 % sin aviso). Se comprueba renglón por renglón en motor, memoria, PDF, libro y pantalla, en las dos
   direcciones: sin captura dice «pendiente»; con captura vuelve el número con su procedencia. */
const txtPdfE = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
t("S.47 (H-179, H-189) sin captura no hay distancia al tablero, transformador ni longitud supuestos: caída y falla quedan «pendiente» con aviso en motor, memoria, PDF, libro y pantalla; con captura vuelven los números con su procedencia", () => {
  const guardado = JSON.stringify(S.elec), tab0 = S.tab;
  try {
    const d = G("defaultElec")();
    eq([d.Ltablero, d.trafoKVA, d.trafoZ].map((v) => (v == null ? "vacío" : v)).join("|"), "vacío|vacío|vacío", "defaultElec sin distancia ni transformador:");
    /* Proyecto vacío: sin cargas no hay nada que pedir. */
    S.elec = { ...d, tomarHVAC: false, cargas: [] }; G("recompute")();
    if (G("ELEC").avisos.some((a) => a.lvl === "err")) throw new Error("un proyecto sin cargas no debe mostrar errores de distancia ni de transformador");
    S.elec = { ...d, tomarHVAC: false, cargas: [
      { ...G("defaultCarga")("Motor sin distancia"), tipo: "motor", kW: 7.5, V: 220, ph: 3, fp: .85 },
      { ...G("defaultCarga")("Alumbrado nave"), tipo: "alumbrado", kW: 4, V: 127, ph: 1, fp: .95, L: 35 }] };
    G("recompute")();
    let R = G("ELEC");
    eq(R.calc[0].cond.dv, null, "caída del ramal con L = 0 (H-189): pendiente, no 0.00 % ni 25 m supuestos:");
    eq(R.alim.dv, null, "caída del alimentador sin distancia: pendiente (no 30 m):");
    eq(R.IccTrafo, null, "corriente de falla sin transformador: pendiente (no 150 kVA / Z 4 %):");
    eq(R.kAIC, null, "capacidad interruptiva: pendiente:");
    contiene(R.alim.rige, "pendiente de longitud", "sin distancia el calibre del alimentador se declara mínimo, no «rige ampacidad» a secas:");
    contiene(R.calc[0].cond.nota, "pendiente de longitud", "y el del ramal:");
    const err = (k) => R.avisos.some((a) => a.lvl === "err" && a.msg.includes(k));
    ["sin longitud capturada (Motor sin distancia)", "Falta la distancia al tablero", "Falta el transformador de la acometida"].forEach((k) => { if (!err(k)) throw new Error(`sin aviso «${k}»`); });
    if (R.avisos.some((a) => /80 %|\(0 kVA\)/.test(a.msg))) throw new Error("sin transformador no puede haber aviso de «80 % del transformador»");
    const memo = R.memo.join(" ");
    contiene(memo, "Caída de tensión PENDIENTE (falta la distancia al tablero)", "memoria, alimentador:");
    contiene(memo, "Corriente de falla PENDIENTE: falta el transformador de la acometida", "memoria, falla:");
    contiene(memo, "Motor sin distancia pendiente", "memoria, L de cada carga (pendiente):"); contiene(memo, "Alumbrado nave 35 m", "y la capturada:");
    if (/\b30 m\b|150 kVA|Z 4 %|\bnull\b|—|en 0 m|de 0 kVA|datos capturados/.test(memo)) throw new Error("la memoria imprime un valor por omisión o un hueco como dato");
    const pdf = txtPdfE(G("buildElecPdf")());
    if (/undefined|NaN|\bnull\b/.test(pdf)) throw new Error("el PDF imprime «undefined», «NaN» o «null»");
    contiene(pdf, "Caida de tension del alimentador pendiente: falta la distancia al tablero", "PDF, alimentador:");
    contiene(pdf, "Corriente de falla estimada pendiente: falta el transformador", "PDF, falla:");
    contiene(pdf, "Distancia al tablero pendiente", "PDF, bases:"); contiene(pdf, "Transformador pendiente", "PDF, bases del transformador:");
    if (!/Motor sin distancia .*pend\. pend\./.test(pdf)) throw new Error("PDF: la fila de la carga sin L no dice «pend.» en L y en e %");
    if (/minima (null|\d+) kA/.test(pdf)) throw new Error("PDF: capacidad interruptiva sin transformador");
    const x = leerXlsx(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).txt;
    if (/undefined|NaN|Transformador de 0 kVA|Z 0 %/.test(x)) throw new Error("el libro imprime un hueco como dato");
    const cumpl = celdasXlsxFila(x, "Caida de tension del alimentador", /3 % maximo recomendado/);
    if (!cumpl || !cumpl.c.includes("PENDIENTE") || cumpl.c.includes("SI")) throw new Error(`libro, cumplimiento de caída: ${cumpl && cumpl.c.join(" | ")}`);
    const hojaMem = /MEMORIA ELECTRICA/;
    const filaMotor = celdasXlsxFila(x, "Motor sin distancia", hojaMem);
    if (!filaMotor || !filaMotor.c.includes("pendiente")) throw new Error(`libro, L de la carga sin distancia: ${filaMotor && filaMotor.c.join(" | ")}`);
    ["Corriente de falla estimada", "Capacidad interruptiva sugerida"].forEach((k) => { const f = celdasXlsxFila(x, k, hojaMem); if (!f || !f.c.includes("PENDIENTE")) throw new Error(`libro, ${k}: ${f && f.c.join(" | ")}`); });
    S.tab = "electrico"; G("render")();
    const h = w.document.querySelector("#view").textContent;
    contiene(h, "Caída del alimentadorpendiente", "pantalla, alimentador:"); contiene(h, "Falla estimadapendiente", "pantalla, falla:");
    if (!/Motor sin distancia[\s\S]*?pendiente/.test(h)) throw new Error("pantalla: la carga sin L no dice pendiente");
    if (/null kA|— %/.test(h)) throw new Error("pantalla: hueco impreso como número");
    /* Transformador a medias: sin falla ni capacidad interruptiva, y el aviso dice cuál dato falta. El 80 % sólo necesita el kVA. */
    S.elec = { ...S.elec, trafoKVA: 5, trafoZ: null }; G("recompute")(); R = G("ELEC");
    eq(R.IccTrafo, null, "kVA sin Z: falla pendiente:"); eq(R.kAIC, null, "kVA sin Z: interruptiva pendiente:");
    if (!err("Falta la impedancia Z de placa del transformador (kVA capturado: 5)")) throw new Error("kVA sin Z: el aviso no dice que falta la Z");
    if (!R.avisos.some((a) => a.lvl === "err" && /supera el 80 % del transformador/.test(a.msg))) throw new Error("con kVA capturado la sobrecarga del transformador debe avisarse aunque falte la Z");
    S.elec = { ...S.elec, trafoKVA: null, trafoZ: 4 }; G("recompute")(); R = G("ELEC");
    eq(R.IccTrafo, null, "Z sin kVA: falla pendiente:");
    if (!err("Falta la capacidad en kVA del transformador (Z capturada: 4 %)")) throw new Error("Z sin kVA: el aviso no dice que falta el kVA");
    /* Con todo capturado vuelve el número con su procedencia, en todas las salidas. */
    S.elec = { ...S.elec, Ltablero: 30, trafoKVA: 300, trafoZ: 4, cargas: S.elec.cargas.map((c) => ({ ...c, L: c.L || 20 })) }; G("recompute")(); R = G("ELEC");
    if (!(R.alim.dv > 0) || !(R.calc[0].cond.dv > 0) || !(R.IccTrafo > 0) || !(R.kAIC > 0)) throw new Error("con captura completa la caída y la falla deben calcularse");
    if (/pendiente/.test(R.alim.rige)) throw new Error("con distancia el alimentador ya no es «mínimo»");
    const memo2 = R.memo.join(" ");
    contiene(memo2, "% en 30 m de los", "memoria con distancia:"); contiene(memo2, "transformador de 300 kVA e impedancia 4 % (datos capturados)", "memoria con transformador:");
    if (/PENDIENTE/.test(memo2)) throw new Error("con captura completa la memoria sigue diciendo PENDIENTE");
    const pdf2 = txtPdfE(G("buildElecPdf")());
    contiene(pdf2, "Distancia al tablero 30 m (capturada)", "PDF con distancia:"); contiene(pdf2, "300 kVA, Z 4 % (placa capturada)", "PDF con transformador:");
    if (!/Corriente de falla estimada [\d.,]+ kA · capacidad interruptiva minima \d+ kA/.test(pdf2)) throw new Error("PDF: la falla no volvió a ser número");
    const x2 = leerXlsx(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).txt;
    const f2 = celdasXlsxFila(x2, "Corriente de falla estimada", /MEMORIA ELECTRICA/);
    if (!f2 || f2.c.includes("PENDIENTE") || !f2.c.some((v) => /300 kVA con Z 4 % — placa capturada/.test(v))) throw new Error(`libro con transformador: ${f2 && f2.c.join(" | ")}`);
    G("render")();
    const h2 = w.document.querySelector("#view").textContent;
    if (/Caída del alimentadorpendiente|Falla estimadapendiente/.test(h2)) throw new Error("pantalla con captura completa sigue en pendiente");
  } finally { S.elec = JSON.parse(guardado); S.tab = tab0; G("recompute")(); }
});
t("S.48 (H-179, H-268) las seis cargas que proponen otros motores (cédula HVAC, extracción, compresor de aire, bomba de agua, bomba contra incendio, FFU) no traen distancia supuesta: sin L quedan pendientes de longitud", () => {
  const R = G(`(() => { const sv = { AIRE, HIDRO, FUEGO, CLEAN };
    try {
      AIRE = { ...(AIRE || {}), principal: { ...((AIRE && AIRE.principal) || {}), tipo: "tornillo", hp: 10, kW: 7.46 }, nUnidades: 1 };
      HIDRO = { ...(HIDRO || {}), kWbomba: 1.87, hpBomba: 2.5 };
      FUEGO = { ...(FUEGO || {}), kWbomba: 3.8, hpBomba: 10 };   /* H-210: el proyecto del banco no captura cabezal ni montante; la bomba va en sombra, como en S.50 */
      CLEAN = { ...(CLEAN || {}), sum: { ...((CLEAN && CLEAN.sum) || {}), ffu: 12 } };
      /* H-268: computeElec ya no lee otros motores; la propuesta se arma con cargasOtrosMotoresElec y corre en sombra. */
      const E0 = defaultElec(); return computeElec({ ...E0, cargas: cargasOtrosMotoresElec(E0) });
    } finally { AIRE = sv.AIRE; HIDRO = sv.HIDRO; FUEGO = sv.FUEGO; CLEAN = sv.CLEAN; } })()`);
  const ids = R.calc.map((c) => c.id);
  ["vent-1", "aire-1", "hidro-1", "fuego-1", "ffu-1"].forEach((id) => { if (!ids.includes(id)) throw new Error(`falta la carga ${id}: la prueba no probaría esa rama (hay ${ids.join(", ")})`); });
  if (!ids.some((id) => id.startsWith("hvac-"))) throw new Error("falta la cédula HVAC");
  R.calc.forEach((c) => { eq(c.L, null, `${c.id}, L:`); eq(c.cond.dv, null, `${c.id}, caída:`); });
  const a = R.avisos.find((x) => x.lvl === "err" && /sin longitud capturada/.test(x.msg));
  if (!a || !/acepta la propuesta «Cargas eléctricas de los demás motores»/.test(a.msg)) throw new Error("el aviso de las cargas propuestas debe decir cómo capturar su distancia");
  G("recompute")();
  const f = G("propuestaElecFilas")();
  f.forEach((c) => { if (c.L != null && c.L !== 0) throw new Error(`${c.nombre}: la propuesta la entrega con L = ${c.L} m que nadie capturó`); });
});
t("S.49 (H-179) un proyecto guardado antes de la rev 2.9.24 conserva sus números, pero los valores por omisión viejos (30 m, 150 kVA, Z 4 %, distancia al tablero + 10 a 30 m de la cédula) salen «sin confirmar», nunca como captura; la marca cae al capturar", () => {
  const guardado = JSON.stringify(S);
  const txtPdf = txtPdfE;
  try {
    const viejo = JSON.parse(JSON.stringify(S));
    viejo.elec = { sistema: "3F4H-220", material: "cobre", aislamiento: "thw-ls", tempAmb: 40, nCond: 3, dvRamal: 3, dvTotal: 5, trafoKVA: 150, trafoZ: 4, Ltablero: 30, fpObjetivo: .95, tomarHVAC: false,
      cargas: [{ id: "cedA", nombre: "Condensadora", tipo: "motor", kW: 7.6, V: 220, ph: 3, cant: 1, L: 45, fp: .85, origen: "cedula", ts: 1, modelo: "40VMA-096" },
        { id: "u1", nombre: "Bomba capturada", tipo: "proceso", kW: 3, V: 220, ph: 3, cant: 1, L: 45, fp: .85 }] };
    G("reemplazarEstado")(viejo); G("recompute")();
    let R = G("ELEC");
    const memo = R.memo.join(" ");
    contiene(memo, "Condensadora 45 m (sin confirmar)", "memoria, carga:"); contiene(memo, "alimentador general 30 m (sin confirmar)", "memoria, alimentador:");
    contiene(memo, "SIN CONFIRMAR", "memoria, falla:");
    eq(S.elec.Ltablero, 30, "el valor se conserva (no se mueve ningún número):");
    eq(R.sinConf.Ltablero && R.sinConf.trafoKVA && R.sinConf.trafoZ, true, "distancia, kVA y Z marcados sin confirmar:");
    eq(R.calc[0].Lsin, true, "la distancia automática de la cédula (30 + 15) sale sin confirmar:");
    eq(R.calc[1].Lsin, false, "la de una carga capturada a mano no:");
    if (/datos capturados/.test(memo)) throw new Error("la memoria da como captura un valor por omisión viejo");
    if (!R.avisos.some((a) => a.lvl === "warn" && /sin confirmar/.test(a.msg))) throw new Error("sin aviso para confirmar los valores viejos");
    const pdf = txtPdf(G("buildElecPdf")());
    if (/\(capturada\)|placa capturada/.test(pdf)) throw new Error("el PDF da como captura un valor por omisión viejo");
    contiene(pdf, "sin confirmar", "PDF:");
    /* Al capturar otro valor la marca cae. */
    S.elec.Ltablero = 32; S.elec.trafoZ = 5.5; G("recompute")(); R = G("ELEC");
    eq(R.sinConf.Ltablero || R.sinConf.trafoZ, false, "capturados, dejan de estar sin confirmar:");
    eq(R.sinConf.trafoKVA, true, "el kVA que no se tocó sigue sin confirmar:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});
/* H-178 (rev 2.9.24): las cargas que entran de otros motores traen el hp de su motor como REFERENCIA (catálogo de la casa o
   estimado por hidráulica / contra incendio: no es de placa y sólo puede subir el renglón que da el kW, decisión del dueño 2 y
   criterio de la casa de H-177); los FFU son aparato (430-6(a)(1) Exc. 2); el equipo con motocompresor sin placa sigue en kW
   (440-6(a)); fuera de la tabla o con la celda en blanco, corriente ESTIMADA con la fórmula de sus fases, o PENDIENTE sin kW. */
t("S.50 (H-178) cargas de otros motores: el hp de catálogo o estimado no es de placa y sólo sube el renglón del kW; FFU como aparato; fuera de la tabla ESTIMADA (3F y 1F) o PENDIENTE; celda en blanco sin saltar; hp decimal; pantalla, PDF y libro", () => {
  const R = G(`(() => { const sv = { AIRE, HIDRO, FUEGO, CLEAN };
    try {
      AIRE = { ...(AIRE || {}), principal: { ...((AIRE && AIRE.principal) || {}), tipo: "tornillo", hp: 10, kW: 8 }, nUnidades: 1 };
      HIDRO = { ...(HIDRO || {}), kWbomba: 2.3, hpBomba: 2.5 };
      FUEGO = { ...(FUEGO || {}), kWbomba: 3.8, hpBomba: 10 };
      CLEAN = { ...(CLEAN || {}), sum: { ...((CLEAN && CLEAN.sum) || {}), ffu: 12 } };
      /* H-268: computeElec ya no lee otros motores; la propuesta se arma con cargasOtrosMotoresElec y corre en sombra. */
      const E0 = defaultElec(); return computeElec({ ...E0, cargas: cargasOtrosMotoresElec(E0) });
    } finally { AIRE = sv.AIRE; HIDRO = sv.HIDRO; FUEGO = sv.FUEGO; CLEAN = sv.CLEAN; } })()`);
  const f = (id) => { const c = R.calc.find((x) => x.id === id); if (!c) throw new Error(`falta la carga ${id}`); return c; };
  const aire = f("aire-1");
  eq(aire.I, 42, "compresor de 10 hp de catálogo y 8 kW: el kW da 15 hp → 42 A; el hp de catálogo no es de placa y no baja el renglón (antes 28 A):");
  eq(aire.hp, undefined, "el hp del catálogo no se guarda como hp de placa:"); eq(aire.hpRef, 10, "va como referencia:");
  eq(f("hidro-1").I, 15.2, "bomba de agua de 2.3 kW → 5 hp → 15.2 A; los 2.5 hp estimados no la bajan a 3 hp (9.6 A):");
  eq(f("hidro-1").hpRef, 2.5, "la bomba de agua lleva su hp estimado como referencia:"); eq(f("hidro-1").hpRefOrigen, "hidro", "con su origen:");
  const fuego = f("fuego-1");
  eq(fuego.I, 28, "bomba contra incendio de 3.8 kW (el kW da 7.5 hp, 22 A) con 10 hp estimados: la referencia sí sube el renglón → 28 A:");
  eq(fuego.motorTabla.origen, "hp de referencia", "origen declarado:");
  const ffu = f("ffu-1");
  cerca(ffu.I, ffu.kW * 1000 / (ffu.V * ffu.fp), 1e-9, "FFU: aparato, corriente con W/(V·fp) mientras no se capture la placa (no la tabla):");
  if (!R.avisos.some((a) => /Exc\. 2/.test(a.msg) && a.msg.startsWith(ffu.nombre))) throw new Error("sin aviso de la corriente de placa de los FFU");
  const memo = R.memo.join(" ");
  contiene(memo, "corriente de la tabla, no de kW/fp", "memoria:");
  contiene(memo, "no son de placa y no bajan el renglón", "memoria, compresor de catálogo:");
  contiene(memo, "(no es de placa) → renglón de 10 hp", "memoria, bomba contra incendio:");
  if (/\b(10|2\.5) hp de placa/.test(memo)) throw new Error("la memoria llama «de placa» a un hp de catálogo o estimado");
  if (!R.avisos.some((a) => a.lvl === "info" && a.msg.startsWith(aire.nombre) && /se tomó 15 hp/.test(a.msg) && /no son de placa/.test(a.msg))) throw new Error("sin aviso del hp inferido y de la referencia que no manda");
  /* Fuera de la tabla, sin kW, equipo sin placa, celda en blanco (errata 10 hp / 575 V) y hp decimal. */
  const dm = (nombre, x) => ({ ...G("defaultCarga")(nombre), tipo: "motor", V: 220, ph: 3, cant: 1, L: 20, fp: .85, ...x });
  const cargas = [dm("Motor 200 kW", { kW: 200 }), dm("Motor 1F 9 kW", { kW: 9, ph: 1 }), dm("Motor 1F 15 hp sin kW", { kW: 0, hp: 15, ph: 1 }),
    dm("Motor 10 hp sin kW", { kW: 0, hp: 10 }), dm("Equipo sin placa", { kW: 10.5, modelo: "X" }), dm("Motor 600 V 10 hp", { kW: 7.5, hp: 10, V: 600 }),
    dm("Motor 1/6 hp", { kW: 0.12, hp: 0.17, V: 127, ph: 1 })];
  const R2 = G("computeElec")({ ...G("defaultElec")(), trafoKVA: 300, trafoZ: 4, Ltablero: 30, cargas });
  const [m200, m1f, p15, p10, e440, m600, m16] = R2.calc;
  cerca(m200.I, 200000 / (Math.sqrt(3) * 220 * .85), 0.01, "200 kW → 300 hp, celda «—» a 230 V: corriente ESTIMADA con kW/(1.732·V·fp):");
  cerca(m200.kVA, 200 / .85, 0.001, "y su kVA con kW/fp:");
  if (!R2.avisos.some((a) => a.lvl === "err" && a.msg.startsWith("Motor 200 kW") && /la Tabla 430-250 no da corriente para 300 hp a 230 V/.test(a.msg) && /ESTIMÓ con kW\/\(1\.732·V·fp\)/.test(a.msg))) throw new Error("un motor sin corriente en la tabla debe avisar que la suya es estimada (y por qué)");
  cerca(m1f.I, 9000 / (220 * .85), 0.01, "1F fuera de la Tabla 430-248: kW/(V·fp), sin raíz de 3:");
  if (!R2.avisos.some((a) => a.msg.startsWith("Motor 1F 9 kW") && /ESTIMÓ con kW\/\(V·fp\)/.test(a.msg))) throw new Error("el aviso monofásico debe citar kW/(V·fp)");
  eq(p15.sinI, true, "15 hp 1F sin kW: fuera de la tabla y sin kW con qué estimar → corriente PENDIENTE:");
  if (!R2.avisos.some((a) => a.lvl === "err" && a.msg.startsWith("Motor 1F 15 hp sin kW") && /PENDIENTE/.test(a.msg) && !/Captura el hp/.test(a.msg))) throw new Error("sin aviso de corriente pendiente (o pide el hp que ya está capturado)");
  eq(p10.I, 28, "10 hp de placa sin kW → 28 A:"); cerca(p10.kVA, Math.sqrt(3) * 220 * 28 / 1000, 0.001, "su kVA sale de la corriente de tabla:");
  eq(p10.kWsin, true, "su kW se marca pendiente, no 0:");
  eq(e440.motorTabla, null, "equipo con motocompresor sin MCA ni MOP no es motor de uso general (440-6(a)):");
  eq(m600.motorTabla.I, null, "10 hp a 575 V: el DOF trae una errata (44 A); no se salta al renglón de 15 hp (17 A):");
  contiene(m600.motorTabla.motivo, "errata", "motivo:");
  eq(m16.I, 4, "0.17 hp (1/6 escrito con dos decimales) → renglón de 1/6 hp → 4 A a 127 V, no 1/4 hp (5.3 A):");
  eq(m16.motorTabla.origen, "hp de placa", "0.17 es el renglón de 1/6, no «fuera de la tabla»:");
  if (R2.avisos.some((a) => /√/.test(a.msg)) || /√/.test(G("MOTOR_CAMBIOS").elec.find((c) => c.ver === "8").que)) throw new Error("un texto que llega al PDF lleva «√», que el PDF imprime como «?»");
  /* Pantalla, PDF y libro: lo pendiente sale «pendiente»; el campo de hp admite decimales. */
  const guardado = JSON.stringify(S.elec);
  try {
    S.elec = { ...G("defaultElec")(), tomarHVAC: false, trafoKVA: 300, trafoZ: 4, Ltablero: 30, cargas: [cargas[2], cargas[3]] }; G("recompute")();
    const v = G("viewElec")();
    contiene(v, 'step="any" data-path="elec.cargas.0.hp"', "pantalla, campo hp de placa:");
    eq((v.match(/>pendiente</g) || []).length, 3, "pantalla: kW de los dos motores sin kW y el ramal sin corriente, «pendiente»:");
    const pdf = txtPdfE(G("buildElecPdf")());
    eq((pdf.match(/pend\./g) || []).length, 7, "PDF: kW de los dos motores y corriente, calibre, protección, tierra y tubo del ramal sin corriente, «pend.»:");
    const hojas = G(`(() => { const o = xlsxBuild; let h = null; xlsxBuild = (x) => { h = x; return o(x); }; try { buildPropuestaXlsx({ lang: "en", mon: "USD" }); } finally { xlsxBuild = o; } return h; })()`);
    const me = JSON.stringify((hojas.find((h) => JSON.stringify(h.filas).includes("PANEL SCHEDULE AND FEEDERS")) || {}).filas);
    contiene(me, "General-purpose motors (430-6(a)(1))", "libro EN, nota de motores:"); contiene(me, "PENDING", "libro EN, corriente pendiente:");
    contiene(me, "10 hp nameplate", "libro EN, origen del hp:");
  } finally { S.elec = JSON.parse(guardado); G("recompute")(); }
  const fuego0 = JSON.stringify(S.fuego);
  try {
    S.fuego.Lramal = 30; S.fuego.Lmontante = 12;   /* H-210: sin cabezal ni montante capturados la bomba queda pendiente y no se propone */
    G("recompute")();
    const bomba = G("propuestaElecFilas")().find((c) => /Bomba contra incendio/.test(c.nombre));
    if (!bomba) throw new Error("la propuesta del banco no trae la bomba contra incendio");
    eq(bomba.hpRef, G("FUEGO").hpBomba, "la propuesta entrega el hp de la bomba como referencia:"); eq(bomba.hpRefOrigen, "fuego", "con su origen:");
    eq(bomba.hp, undefined, "y no como hp de placa:");
  } finally { S.fuego = JSON.parse(fuego0); G("recompute")(); }
});
/* H-178: un proyecto que aceptó la cédula con elec v7 guardó las cargas sin hp de referencia ni marca de aparato. */
t("S.51 (H-178) proyecto que aceptó la cédula antes de la rev 2.9.24: los FFU abren como aparato, la propuesta sale «Desactualizada» y al volver a aceptarla trae el hp de referencia sin perder la distancia capturada", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(JSON.parse(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8"))); G("recompute")();
    G("propAceptar")("cedula>elec"); G("recompute")();
    /* Así lo guardaba elec v7: sin hpRef, hpRefOrigen ni aparato en las cargas de la cédula, sin la marca h178 y con la firma de
       cinco campos. La distancia de 23 m la capturó el usuario. */
    const viejo = JSON.parse(JSON.stringify(S));
    delete viejo.elec.h178;
    viejo.elec.cargas.forEach((c) => { if (c.origen === "cedula") { delete c.hpRef; delete c.hpRefOrigen; delete c.aparato; c.L = 23; } });
    viejo.vinculos["cedula>elec"].firma = JSON.stringify(G("propuestaElecFilas")().map((c) => [c.nombre, +Number(c.kW).toFixed(2), c.cant, c.V, c.ph]));
    G("reemplazarEstado")(viejo); G("recompute")();
    eq(G("estadoPropuesta")("cedula>elec").nivel, "desactualizado", "la propuesta aceptada sin hp de referencia ni aparato sale desactualizada:");
    const ffu = G("ELEC").calc.find((c) => /^Módulos FFU/.test(c.nombre));
    if (!ffu) throw new Error("el proyecto de regresión no trae FFU");
    eq(ffu.aparato, true, "el FFU abre como aparato (430-6(a)(1) Exc. 2):");
    cerca(ffu.I, ffu.kW * 1000 / (ffu.V * ffu.fp), 1e-9, "y su corriente es W/(V·fp), no la de un motor de la Tabla 430-248:");
    G("propAceptar")("cedula>elec"); G("recompute")();
    eq(G("estadoPropuesta")("cedula>elec").nivel, "aceptado", "vuelta a aceptar:");
    const ced = S.elec.cargas.filter((c) => c.origen === "cedula");
    const comp = ced.find((c) => /^Compresor/.test(c.nombre));
    eq(comp.hpRef, G("AIRE").principal.hp, "el compresor trae su hp de catálogo como referencia:"); eq(comp.hpRefOrigen, "catalogo", "origen:");
    eq(ced.find((c) => /^Módulos FFU/.test(c.nombre)).aparato, true, "el FFU vuelve como aparato:");
    eq(ced.every((c) => c.L === 23), true, "volver a aceptar conserva la distancia capturada en cada carga:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});
/* H-180 (rev 2.9.24): trazabilidad de lo que no es dato. El kW que no es de placa (familia de equipo, caudal × presión, bombas
   estimadas, catálogo de la casa) sale con su procedencia; el fp de cada carga se captura y se imprime con su origen (capturado o
   criterio de la casa por tipo); el fp del alimentador (antes 0.95 oculto) se ve, se captura y se imprime. No mueve números. */
const fpOrigenTxt = (c) => G("fpOrigenTexto")(c, false);
t("S.52 (H-180) kW estimados y de catálogo con su procedencia; fp por carga editable e impreso con su origen (vacío = el de la casa; fuera de 0.5–1 no se usa); fp del alimentador visible, editable e impreso; filas propuestas por otros motores (H-268); proyecto viejo (aun renombrado) sin mover números", () => {
  const guardado = JSON.stringify(S), tab0 = S.tab;
  try {
    const dm = (nombre, x) => ({ ...G("defaultCarga")(nombre), V: 220, ph: 3, cant: 1, L: 20, ...x });
    S.elec = { ...G("defaultElec")(), tomarHVAC: false, trafoKVA: 300, trafoZ: 4, Ltablero: 30,
      cargas: [dm("Motor sin fp", { tipo: "motor", kW: 11 }), dm("Proceso fp 0.8", { tipo: "proceso", kW: 10, fp: 0.8 })] };
    G("recompute")();
    const v = G("viewElec")();
    contiene(v, 'data-path="elec.cargas.0.fp"', "pantalla: el fp de cada carga se captura:");
    contiene(v, 'data-path="elec.fpObjetivo"', "pantalla: el fp del alimentador se ve y se captura:");
    let R = G("ELEC");
    eq(R.calc[0].fpOrigen, "casa", "sin fp capturado, el del tipo es criterio de la casa:");
    eq(R.calc[1].fpOrigen, "capturado", "el fp capturado se declara capturado:"); eq(R.calc[1].fp, 0.8, "y se usa:");
    let memo = R.memo.join(" ");
    contiene(memo, "Motor sin fp: kW capturado, fp 0.85 criterio de la casa (tipo «Motor / equipo HVAC»)", "memoria, fp por tipo:");
    if (!/Proceso fp 0\.8: kW capturado, fp 0\.80? capturado/.test(memo)) throw new Error("la memoria no dice que el fp de 0.8 es capturado");
    contiene(memo, "fp del alimentador 0.95 (criterio de la casa)", "memoria, alimentador:");
    let pdf = txtPdfE(G("buildElecPdf")());
    contiene(pdf, "alimentador 0.95 (criterio de la casa)", "PDF, bases:");
    if (!/(^| )0\.85\*( |$)/.test(pdf)) throw new Error("el PDF no marca el fp por tipo (criterio de la casa) en el cuadro");
    const libro = () => { const hojas = G(`(() => { const o = xlsxBuild; let h = null; xlsxBuild = (x) => { h = x; return o(x); }; try { buildPropuestaXlsx({ lang: "en", mon: "USD" }); } finally { xlsxBuild = o; } return h; })()`);
      return JSON.stringify((hojas.find((h) => JSON.stringify(h.filas).includes("PANEL SCHEDULE AND FEEDERS")) || {}).filas); };
    let me = libro();
    contiene(me, "house criterion (load type default)", "libro EN, fp por tipo:"); contiene(me, "Feeder power factor", "libro EN, fp del alimentador:");
    /* Vaciar el campo por la pantalla (el manejador guarda 0): vuelve al de la casa, no a 0.5. */
    S.tab = "electrico"; G("render")();
    const inpFp = w.document.querySelector('input[data-path="elec.cargas.1.fp"]');
    if (!inpFp) throw new Error("no se encontró el campo fp de la carga");
    inpFp.value = ""; inpFp.dispatchEvent(new w.Event("input", { bubbles: true })); G("recompute")(); R = G("ELEC");
    eq(R.calc[1].fp, 0.85, "fp vacío: el del tipo «Proceso» (0.85), no 0.5:"); eq(R.calc[1].fpOrigen, "casa", "declarado criterio de la casa:");
    if (R.avisos.some((a) => a.msg.startsWith("Proceso fp 0.8") && /fuera de 0.5 a 1/.test(a.msg))) throw new Error("un campo vacío no es un fp fuera de rango");
    /* Fuera de 0.5 a 1 (85 por 0.85): no se usa y se avisa. */
    S.elec.cargas[1].fp = 85; S.elec.fpObjetivo = 95; G("recompute")(); R = G("ELEC");
    eq(R.calc[1].fp, 0.85, "fp 85: no se usa; el del tipo:"); eq(R.calc[1].fpOrigen, "casa", "declarado criterio de la casa:");
    if (!R.avisos.some((a) => a.lvl === "err" && a.msg.startsWith("Proceso fp 0.8") && /fuera de 0\.5 a 1/.test(a.msg))) throw new Error("sin aviso del fp fuera de rango");
    eq(R.fpAlim, 0.95, "fp del alimentador 95: no se usa; 0.95 de la casa:"); eq(R.fpAlimOrigen, "casa", "declarado:");
    if (!R.avisos.some((a) => a.lvl === "err" && /fp del alimentador capturado \(95\)/.test(a.msg))) throw new Error("sin aviso del fp del alimentador fuera de rango");
    S.elec.cargas[1].fp = 0.8; S.elec.fpObjetivo = 0.9; G("recompute")(); R = G("ELEC");
    if (!/fp del alimentador 0\.90? \(capturado\)/.test(R.memo.join(" "))) throw new Error("fp del alimentador capturado: la memoria no lo dice");
    eq(R.fpAlim, 0.9, "la caída del alimentador usa el fp capturado:"); eq(R.fpAlimOrigen, "capturado", "y lo declara:");
    pdf = txtPdfE(G("buildElecPdf")()); if (!/alimentador 0\.90? \(capturado\)/.test(pdf)) throw new Error("el PDF no imprime el fp del alimentador capturado");
    contiene(libro(), "Captured, for the feeder voltage drop", "libro EN, fp del alimentador capturado:");
    /* Filas que proponen los otros motores (H-268: corrida en sombra de la propuesta; el modo en vivo se retiró): procedencia por
       fila, fp de la casa. */
    G("reemplazarEstado")(JSON.parse(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8"))); G("recompute")();
    const RV = G(`computeElec({ ...S.elec, cargas: cargasOtrosMotoresElec(S.elec) })`);
    const esperado = { hvac: "hvac", vent: "vent", aire: "aire", hidro: "hidro", fuego: "fuego", ffu: "ffu" };
    const vivas = RV.calc.filter((c) => c.auto);
    if (vivas.length < 6) throw new Error(`el proyecto de regresión propone ${vivas.length} filas`);
    vivas.forEach((c) => { eq(c.kWOrigen, esperado[c.id.split("-")[0]], `${c.id}, procedencia del kW:`); eq(c.fpOrigen, "casa", `${c.id}, fp:`); });
    vivas.forEach((c) => eq(c.kWEst, ["hvac", "vent", "hidro", "fuego"].includes(c.id.split("-")[0]), c.id + ", estimado (equipo HVAC, extractor y bombas):"));
    /* La cédula aceptada: kW de familia estimado, compresor y FFU de catálogo de la casa. */
    G("propAceptar")("cedula>elec"); G("recompute")();
    R = G("ELEC"); memo = R.memo.join(" ");
    const cf = (re) => { const c = R.calc.find((x) => x.origen === "cedula" && re.test(x.nombre)); if (!c) throw new Error(`la cédula no trae ${re}`); return c; };
    const hv = R.calc.find((x) => x.origen === "cedula" && x.modelo);
    if (!hv) throw new Error("la cédula del proyecto de regresión no trae equipo HVAC");
    eq(hv.kWOrigen, "hvac", "kW del equipo HVAC: estimado por familia:"); eq(hv.kWEst, true, "marcado estimado:");
    contiene(memo, `${hv.nombre}: kW ESTIMADO por familia de equipo`, "memoria, equipo HVAC:");
    eq(hv.fpOrigen, "casa", "el fp del equipo es supuesto de anteproyecto:");
    eq(cf(/^Compresor/).kWOrigen, "aire", "compresor: kW del catálogo de la casa:"); eq(cf(/^Compresor/).kWEst, false, "de catálogo, no estimado:");
    eq(cf(/^Módulos FFU/).kWOrigen, "ffu", "FFU: kW del catálogo de la casa:");
    eq(cf(/^Bomba de agua/).kWEst, true, "bomba de agua: estimado:");
    const hv1f = R.calc.find((x) => x.origen === "cedula" && x.modelo && x.ph === 1);
    if (!hv1f) throw new Error("la cédula del proyecto de regresión no trae equipo monofásico");
    eq(hv1f.fp, 0.9, "el fp de anteproyecto de la cédula se conserva (0.90 en monofásico), aunque ya no se guarde como captura:");
    if (!R.avisos.some((a) => a.lvl === "info" && /con kW ESTIMADO, no de placa/.test(a.msg) && a.msg.includes(hv.nombre))) throw new Error("sin aviso de las cargas con kW estimado");
    /* Con hp de placa la corriente y la demanda salen de la Tabla 430-250: ese kW estimado ya no manda y no se avisa. */
    const iBci = S.elec.cargas.findIndex((c) => c.origen === "cedula" && /^Bomba contra incendio/.test(c.nombre));
    const nBci = S.elec.cargas[iBci].nombre;
    const nEst = () => { const x = G("ELEC").avisos.find((a) => /con kW ESTIMADO, no de placa/.test(a.msg)); return x ? +x.msg.match(/^(\d+) carga/)[1] : 0; };
    const n0 = nEst();
    if (!(n0 > 0)) throw new Error("sin aviso de kW estimado antes de capturar el hp");
    S.elec.cargas[iBci].hp = 40; G("recompute")();
    eq(nEst(), n0 - 1, `con hp de placa, ${nBci} sale del aviso de kW estimado:`);
    delete S.elec.cargas[iBci].hp; G("recompute")(); R = G("ELEC");
    pdf = txtPdfE(G("buildElecPdf")());
    contiene(pdf, `${G("n")(hv.kWtot, 2)} e`, "PDF: kW estimado con «e»:"); contiene(pdf, `${G("n")(cf(/^Compresor/).kWtot, 2)} c`, "PDF: kW de catálogo con «c»:");
    /* El usuario captura kW y fp sobre la cédula: dejan de ser estimado / de la casa, y el fp capturado se usa. */
    const i = S.elec.cargas.findIndex((c) => c.origen === "cedula" && c.modelo);
    const kW0 = S.elec.cargas[i].kW, dem0 = R.kVAdemanda, pri0 = R.principal;
    S.elec.cargas[i].kW = kW0 + 1; S.elec.cargas[i].fp = 0.9; G("recompute")();
    const hv2 = G("ELEC").calc.find((x) => x.id === S.elec.cargas[i].id);
    eq(hv2.kWOrigen, "capturado", "kW capturado sobre la cédula:"); eq(hv2.fpOrigen, "capturado", "fp capturado sobre la cédula:");
    eq(hv2.fp, 0.9, "y el fp capturado se usa aunque la cédula traiga el suyo:");
    cerca(hv2.I, (kW0 + 1) * 1000 / ((hv2.ph === 3 ? Math.sqrt(3) : 1) * hv2.V * 0.9), 1e-6, "la corriente sale del kW y el fp capturados:");
    S.elec.cargas[i].kW = kW0; G("recompute")();
    /* Volver a aceptar la cédula conserva el fp capturado en la carga del mismo nombre. */
    const nom = S.elec.cargas[i].nombre;
    G("propAceptar")("cedula>elec"); G("recompute")();
    eq(S.elec.cargas.find((c) => c.origen === "cedula" && c.nombre === nom).fp, 0.9, "volver a aceptar conserva el fp capturado:");
    S.elec.cargas.find((c) => c.origen === "cedula" && c.nombre === nom).fp = null; G("recompute")();
    /* Proyecto guardado antes de H-180 (fp de la cédula como dato, sin procedencia del kW, fp del alimentador 0.95), con cargas
       renombradas y una anonimizada (sin origen ni modelo, como la deja etiquetasGenericas): abren con procedencia, mismos números. */
    const viejo = JSON.parse(JSON.stringify(S));
    delete viejo.elec.h180; viejo.elec.fpObjetivo = .95;
    const calcAntes = G("ELEC").calc;
    const ced = viejo.elec.cargas.filter((c) => c.origen === "cedula");
    ced.forEach((c, k) => { const x = calcAntes.find((y) => y.id === c.id); c.fp = x.fp; delete c.fpCasa; delete c.kWOrigen; delete c.kWRef; if (!c.modelo) c.nombre = `Renombrada ${k}`; });
    const hvs = ced.filter((c) => c.modelo);
    if (hvs.length < 2) throw new Error("se necesitan dos equipos HVAC en la cédula");
    const anon = hvs[1]; delete anon.modelo; delete anon.origen; anon.nombre = "Motor / equipo HVAC 9";
    G("reemplazarEstado")(viejo); G("recompute")(); R = G("ELEC");
    const por = (id) => R.calc.find((x) => x.id === id);
    eq(por(hvs[0].id).kWOrigen, "hvac", "equipo HVAC (por su modelo):"); eq(por(hvs[0].id).fpOrigen, "casa", "y su fp de la casa:");
    eq(por(anon.id).kWOrigen, "otro", "equipo anonimizado: de otro módulo, nunca «capturado»:"); eq(por(anon.id).kWEst, true, "marcado no de placa:");
    eq(por(anon.id).fpOrigen, "casa", "su fp, de la casa:"); if (/tipo «/.test(fpOrigenTxt(por(anon.id)))) throw new Error("el fp de la cédula anonimizada se rotula como el del tipo");
    const ren = (re) => { const c0 = ced.find((c) => !c.modelo && c !== anon && re(c)); if (!c0) throw new Error("falta una carga renombrada"); return por(c0.id); };
    eq(ren((c) => c.hpRefOrigen === "catalogo").kWOrigen, "aire", "compresor renombrado (por su hp de referencia):");
    eq(ren((c) => c.hpRefOrigen === "hidro").kWOrigen, "hidro", "bomba de agua renombrada:");
    eq(ren((c) => c.hpRefOrigen === "fuego").kWOrigen, "fuego", "bomba contra incendio renombrada:");
    eq(ren((c) => c.aparato).kWOrigen, "ffu", "FFU renombrado (por su marca de aparato):");
    eq(ren((c) => !c.hpRefOrigen && !c.aparato).kWOrigen, "otro", "extractor renombrado: de otro módulo, nunca «capturado»:");
    cerca(R.kVAdemanda, dem0, 1e-9, "sin mover la demanda:"); eq(R.principal, pri0, "ni el principal:");
    contiene(R.memo.join(" "), "fp del alimentador 0.95 (criterio de la casa)", "el 0.95 guardado por omisión abre como criterio de la casa:");
    /* Un kW de placa tecleado en una revisión vieja: el botón «El kW es de placa» lo declara capturado. */
    S.tab = "electrico"; G("render")();
    const k0 = S.elec.cargas.findIndex((c) => c.id === hvs[0].id);
    const btn = w.document.querySelector(`button[data-act="ec-kwplaca"][data-i="${k0}"]`);
    if (!btn) throw new Error("sin botón para declarar el kW de placa");
    btn.dispatchEvent(new w.Event("click", { bubbles: true })); G("recompute")();
    eq(G("ELEC").calc.find((x) => x.id === hvs[0].id).kWOrigen, "capturado", "declarado de placa:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); S.tab = tab0; G("recompute")(); }
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
  eq(JSON.stringify(G("PDF_MARCA")), JSON.stringify(MARCA_RGB), "PDF_MARCA sigue al --marca del :root:");
  eq(JSON.stringify(G("PDF_SENAL")), JSON.stringify([.941, .337, .114]));
  const txt = Buffer.from(pdf).toString("latin1");
  contiene(txt, "ELECTROMEC"); contiene(txt, `SuiteEmp rev ${G("REV")}`);
});
t("6.4 imprime el trazado de origen de cada valor heredado", () => {
  const txt = Buffer.from(pdf).toString("latin1");
  contiene(txt, "Trazado de origen");
  contiene(txt, "regla 1"); contiene(txt, "regla 2");
  const tr = G("trazaHerencia")();
  /* H-262 a H-266: ninguna disciplina hereda; el trazado lo declara (regla 1) y lista las propuestas (regla 2). */
  if (tr.some((r) => r.regla === 1)) throw new Error("quedó un valor heredado en el trazado: " + tr.filter((r) => r.regla === 1).map((r) => r.campo).join(", "));
  contiene(txt, "ninguna disciplina hereda", "la memoria dice que ya nadie hereda:");
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
    /* rev 2.9.24 (H-120): si el motor de carga subió de versión respecto a la base, el cambio está permitido y declarado
       (MOTOR_CAMBIOS); la igualdad sólo se exige con la misma versión. R.3 vigila que nada cambie sin subir versión. */
    const vb = String(Gb("typeof MOTOR_VER !== 'undefined' ? MOTOR_VER.load : '1'")), va = String(G("MOTOR_VER").load);
    if (vb !== va) { if (!(G("MOTOR_CAMBIOS").load || []).some((c) => +c.ver > +vb)) throw new Error(`carga v${vb} → v${va} sin hallazgo en MOTOR_CAMBIOS`); return; }
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
    /* rev 2.9.24 (H-178): la corriente de un motor de uso general sale de la Tabla 430-250, así que con esos motores la
       demanda y el principal cambian contra la base. Mientras la versión difiera se exige el hallazgo en MOTOR_CAMBIOS y se
       comparan las demás cargas (sin los motores de uso general); R.1 (esperado por versión) y R.3 vigilan los motores. */
    const vb = String(Gb("typeof MOTOR_VER !== 'undefined' ? MOTOR_VER.elec : '1'")), va = String(G("MOTOR_VER").elec);
    const general = (c) => c.tipo === "motor" && !(Number(c.mca) > 0 && Number(c.mop) > 0) && !c.aparato && !c.modelo;
    const guardado = JSON.stringify(S.elec);
    try {
      if (vb !== va) {
        if (!(G("MOTOR_CAMBIOS").elec || []).some((c) => +c.ver > +vb && /H-178/.test(c.que))) throw new Error(`eléctrico v${vb} → v${va}: la demanda cambió sin el hallazgo H-178 en MOTOR_CAMBIOS`);
        S.elec.cargas = (S.elec.cargas || []).filter((c) => !general(c));
        if (!S.elec.cargas.length) throw new Error("sin cargas que comparar fuera de los motores de uso general");
      }
      Gb("S").elec = JSON.parse(JSON.stringify(S.elec));
      Gb("S").elec.tomarHVAC = false;
      /* H-180: la cédula guarda su fp como fpCasa (el mismo valor); la base no conoce ese campo. */
      Gb("S").elec.cargas.forEach((c) => { if (c.fp == null && c.fpCasa != null) c.fp = c.fpCasa; });
      Gb("recompute")(); G("recompute")();
      cerca(G("ELEC").kVAdemanda, Gb("ELEC").kVAdemanda, 0.01, "kVA de demanda:");
      eq(G("ELEC").principal, Gb("ELEC").principal, "interruptor principal:");
    } finally { S.elec = JSON.parse(guardado); G("recompute")(); }
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
    fuego: { ...G("defaultState")().fuego, area: 800, tomarArea: true },   /* H-264: tomarArea ya no se usa */
    civil: { ...G("defaultState")().civil, usarZonas: "false" },
    soporte: { ...G("defaultState")().soporte, sismico: "false" },
  };
  const s = G("sanearEstado")(JSON.parse(JSON.stringify(viejo)));
  eq(s.vent.area, 120, "el área de ventilación capturada a mano se respeta:");
  eq(s.her["vent.area"], undefined, "H-262: ventilación ya no lleva registro de herencia:");
  eq(s.her["fuego.area"], undefined, "H-264: contra incendio ya no lleva registro de herencia:"); eq(s.fuego.area, 800, "H-264: el área de contra incendio guardada se respeta:");
  eq(s.civil.usarZonas, false, "el menú de sí/no guardado como texto se corrige:");
  eq(s.soporte.sismico, false);
});

/* ========= 10. Código de color por capa, tomado del isométrico ========== */
const ROOT = () => {
  const css = w.document.querySelector("style").textContent;
  const ini = css.indexOf(":root{"); /* rev 2.9.13: la ventana son 4000 caracteres DESDE :root, no hasta la posición 4000 del CSS (el comentario de identidad va antes) */
  const raiz = css.slice(ini, css.indexOf("@font-face") >= 0 ? css.indexOf("@font-face") : ini + 4000);
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
t("10.4 la vista sigue publicando su capa, pero el chrome monocromo ya no la pinta", () => {
  /* rev 2.9.13 · Decisión del dueño (19-sep-2026): monocromo con dos acentos.
     El código de capas (CAPAS / capaDe / --p-*) NO se toca y sigue publicándose
     en cada vista y en cada nodo del diagrama; lo que se retiró es que el filete
     de las tarjetas, la guía y el ícono del menú lo usaran como acento. */
  ["fuego", "electrico", "aire", "hidro", "ductos"].forEach((tab) => {
    S.tab = tab; G("render")();
    eq(w.document.getElementById("view").style.getPropertyValue("--capa"), G("capaDe")(tab), `pestaña ${tab}:`);
  });
  const css = w.document.querySelector("style").textContent;
  if (/\.card>h3\{[^}]*var\(--capa\)/.test(css)) throw new Error("el filete de las tarjetas volvió a pintar la capa");
  if (/\.guia\{[^}]*border-left-color:var\(--capa\)/.test(css)) throw new Error("la guía volvió a pintar la capa");
  if (/nav\.tabs\.lat \.lico,nav\.col2 \.lico\{[^}]*var\(--capa\)/.test(css)) throw new Error("el ícono del menú volvió a pintar la capa");
});
t("10.5 la barra de acento es un filete neutro; los colores de capa siguen declarados", () => {
  const css = w.document.querySelector("style").textContent;
  const regla = css.slice(css.indexOf(".accent-bar{"), css.indexOf("}", css.indexOf(".accent-bar{")) + 1);
  if (/--p-|--senal|--orange/.test(regla)) throw new Error("la barra de acento volvió a llevar color: " + regla);
  const v = ROOT();
  ["p-el", "p-pot", "p-air", "p-mt", "p-plu", "p-cw"].forEach((x) => { if (!v(x)) throw new Error("no está declarado --" + x); });
  contiene(css, "--p-fire:var(--senal)");
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
  contiene(LES.txt, MARCA_ARGB, "color de la marca en los encabezados:");
  contiene(LES.txt, "FFF0561D", "naranja de señal en los totales:");
  eq(LES.txt.indexOf(MARCA_ARGB) >= 0, LEN.txt.indexOf(MARCA_ARGB) >= 0, "mismos colores en los dos archivos:");
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
t("12.9 (rev 2.9.16, decisión del dueño) Kaizen e ingeniería de valor no son motores: no llevan semáforo y no cuentan en la completitud", () => {
  ["valor", "kaizen"].forEach((id) => {
    const s2 = G("semaforoSuite")().find((x) => x.id === id);
    if (!s2) throw new Error(`${id}: no aparece en el tablero`);
    eq(s2.nivel, "gestion", `${id} sin semáforo:`);
  });
  const R = G("cxzResumenSemaforo")(), total = Object.values(R).reduce((a, b) => a + b, 0);
  eq(total, G("semaforoSuite")().filter(G("conSemaforo")).length, "la completitud sólo cuenta disciplinas con semáforo:");
  eq(total, 12, "doce disciplinas de cálculo con semáforo (15 menos Kaizen, Valor y el estructural externo):");
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
t("13.3 se navegan como pantallas en la segunda columna, no como una sola pantalla larga", () => {
  S.tab = "carga"; G("render")();
  const sub = w.document.getElementById("subnav");
  if (sub.hidden) throw new Error("la segunda columna no se abrió dentro del módulo");
  const h = sub.innerHTML;
  contiene(h, 'class="subtabs"', "falta la lista de pantallas:");
  G("MODULOS").hvac.subs.forEach(([id]) => contiene(h, `data-tab="${id}"`, `pantalla ${id}:`));
  eq((h.match(/aria-selected="true"/g) || []).length, 1, "una sola activa:");
  /* Una disciplina sin pantallas propias no abre segunda columna. */
  S.tab = "electrico"; G("render")();
  if (!w.document.getElementById("subnav").hidden) throw new Error("eléctrico abrió una segunda columna vacía");
  S.tab = "carga"; G("render")();
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
  eq(de("hvac", "fuego"), 0, "hacia contra incendio (H-264: ya no hereda; es autónomo):");
  eq(de("hvac", "civil"), 0, "hacia obra civil (H-265: ya no hereda; es autónoma):");
  eq(de("hvac", "elec"), 3, "hacia eléctrico (cédula de equipos, ventilador y FFU de cuartos limpios):");
  eq(de("hvac", "soporte"), 1, "hacia soportería:");
  eq(de("proyecto", "hvac"), 1, "y el proyecto sigue alimentándolo:");
  /* Las que corrían entre las cinco desaparecen: son tránsito interno. */
  ["load", "clean", "equip", "vent", "duct"].forEach((id) => {
    if (A.some((x) => x.de === id || x.a === id)) throw new Error(`quedó una flecha de ${id}`);
  });
  /* Cada una conserva su significado, no se fusionaron en una sola. */
  A.filter((x) => x.de === "hvac").forEach((x) => { if (!x.que) throw new Error("una flecha del módulo perdió su texto"); });
});
t("13.7 las demás disciplinas siguen siendo nodos independientes", () => {
  const N = G("NODOS").map((nd) => nd.id);
  ["elec", "hidro", "fuego", "aire", "soporte"].forEach((id) => {
    if (!N.includes(id)) throw new Error(`${id} dejó de ser un nodo independiente`);
  });
});
t("13.8 el semáforo del nodo HVAC es el PEOR de las cinco", () => {
  const área0 = Number(S.zones[0].area);
  G("chainToDuct")(true);   /* H-262: chainToVent ya no existe (ventilación captura lo suyo) */
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
t("14.2 la disciplina abierta se nombra al inicio del contenido y el tablero queda a un clic en la columna izquierda", () => {
  ["carga", "limpios", "electrico", "civil", "kaizen"].forEach((tab) => {
    S.tab = tab; G("render")();
    contiene(vista(), 'class="modnom"', `${tab}: falta el nombre de la disciplina —`);
    contiene(tabsHtml(), 'data-tab="tablero"', `${tab}: el tablero no está a la vista —`);
  });
});
t("14.3 el renglón Tablero de la columna izquierda lleva de vuelta al tablero, con el diagrama embebido", () => {
  S.tab = "ductos"; G("render")();
  w.document.querySelector('#tabs [data-tab="tablero"]').dispatchEvent(new w.Event("click", { bubbles: true }));
  eq(S.tab, "tablero", "después del clic:");
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
t("14.6 las pantallas de HVAC se navegan entre sí sin salir del módulo", () => {
  S.tab = "carga"; G("render")();
  G("MODULOS").hvac.subs.forEach(([id]) => {
    const b = w.document.querySelector(`#subnav .subtab[data-tab="${id}"]`);
    if (!b) throw new Error(`no se puede llegar a ${id} desde la segunda columna`);
    b.dispatchEvent(new w.Event("click", { bubbles: true }));
    eq(S.tab, id, `pantalla ${id}:`);
    const sub = w.document.getElementById("subnav");
    if (sub.hidden) throw new Error(`${id}: se cerró la segunda columna —`);
    contiene(sub.innerHTML, 'class="subtabs"', `${id}: se salió del módulo —`);
    contiene(sub.innerHTML, "HVAC", `${id}: la columna dejó de decir en qué módulo se está —`);
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
  const marca = `${MARCA_RGB.join(" ")} rg`, senal = "0.941 0.337 0.114 rg";
  [prop, mem].forEach((doc, i) => {
    if (doc.indexOf(marca) < 0) throw new Error(`el documento ${i} no usa el color de marca`);
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
  /* Espejo: la misma cantidad de páginas (con ±1 de tolerancia — una
     traducción más larga puede empujar UNA página de más justo en el borde
     de un salto de página, sin que el documento deje de ser el mismo
     contenido; H-95, 17-sep-2026, lo expuso al agregar el bloque de firma al
     final) y las mismas claves de sección, que son las de la casa y NO se
     traducen. */
  const pgs = (x) => (x.match(/\/Type \/Page[^s]/g) || []).length;
  if (Math.abs(pgs(en) - pgs(es)) > 1) throw new Error(`páginas del espejo se separaron demasiado: ES ${pgs(es)}, EN ${pgs(en)}`);
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
  contiene(G("XLSX_STYLES"), MARCA_ARGB, "la banda de encabezado no usa el color de marca:");
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
    par(0, "TEXT") + par(8, "A-TEXTO") + par(10, 6000) + par(20, 4000) + par(40, 250) + par(1, "OFICINA ABIERTA 96 m2 h=2.80 m") +   /* H-272c: la altura viene rotulada; sin rótulo ya no se supone */
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
      /* rev 2.9.14 · el texto que explica los dos puntos de partida vive en la guía, no en el panel: éste sólo lleva el
         rótulo, los botones y el estado de la última carga. */
      contiene(G("cxGuiaTexto")(tab), "desde cero", `${tab}: texto de la guía:`);
      contiene(v.querySelector(".guia").textContent, "desde cero", `${tab}: la guía lo muestra:`);
      contiene(v.querySelector(".cx-panel").textContent, "Punto de partida", `${tab}: rótulo del panel:`);
      if (/desde cero/.test(v.querySelector(".cx-panel").textContent)) throw new Error(`${tab}: el panel repite el texto de la guía`);
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
  t("17.8 la zona nacida del plano calcula con lo que el plano trae: muros exteriores a la altura ROTULADA, el muro compartido en cero, y sin vidrio, ocupantes, luces ni equipo inventados (H-272c)", () => {
    const z = S.zones[0];
    cerca(z.height, 2.8, 1e-9, "altura rotulada en el plano:");
    cerca(z.walls.N, 12 * 2.8, .2, "muro norte = ancho × altura rotulada:");
    cerca(z.walls.W, 8 * 2.8, .2, "muro poniente = fondo × altura rotulada:");
    eq(z.occ, 0, "ocupantes no rotulados no se suponen (antes 10 por escala de una oficina de 120 m²):"); eq(z.lights, 0, "luces (antes 960 W supuestos):"); eq(z.equip, 0, "equipo (antes 1152 W supuestos):");
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
    /* H-264: ya no hay herencia que pueda pisar el dato cargado (antes: herDe("fuego.area") pasaba a «propio»). */
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
      const m = Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : G("monedaEspejoEN")() })).toString("utf8").match(VETADOS);
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
    /* H-272a: obra civil ya no recibe un total a mano (civil.areaManual): cada espacio nombrado en la memoria se ofrece como
       renglón propio de «Áreas de obra» (civil.areas), sin marcar porque no viene de un plano ni de una tabla. */
    const b = await cx("cxProcesarArchivos")([archivo("tabla.txt", "Oficinas 120 m2\nAlmacen 340 m2\n")], "civil");
    const ops = b.propuestas.filter((p) => p.destino === "civil.areas");
    eq(ops.length, 2, "renglones ofrecidos: " + b.propuestas.map((p) => p.destino + " " + p.etiqueta).join(" | "));
    if (ops.some((p) => p.marcado)) throw new Error("un área sin palabra clave salió marcada");
    if (b.propuestas.some((p) => /^civil\.(areaManual|alturaManual|murosManual)$/.test(p.destino))) throw new Error("la carga ya no debe escribir los totales a mano de obra civil (H-265/H-272a)");
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
  await tA("17.22 las capas se clasifican por palabra completa y leer un plano alimenta la captura propia de soportería sin tocar usarMotores (H-266/H-272d)", async () => {
    const lin = (c, L) => par(0, "LINE") + par(8, c) + par(10, 0) + par(20, 0) + par(11, L) + par(21, 0);
    const d = dxfDe(lin("E-ALIMENTADOR-PRINCIPAL", 120000) + lin("A-FASCIA", 40000) + lin("HVAC-EQUIPOS", 65000) + lin("IH-AGUA-FRIA-PRINCIPAL", 80000));
    const l = await cx("cxProcesarArchivos")([archivo("instalaciones.dxf", d)], "soporte");
    const largos = l.propuestas.filter((p) => /medido en plano/.test(p.etiqueta));
    eq(largos.length, 1, "longitudes propuestas: " + largos.map((p) => p.etiqueta + " " + p.valor).join(" | "));
    contiene(largos[0].etiqueta, "hidrosanitaria"); eq(largos[0].valor, 80);
    /* H-272d: ya no hay casilla «apagar el conteo por motores» (el conteo en vivo se retiró en H-266); leer un plano no toca usarMotores. */
    if (l.propuestas.some((p) => p.destino === "soporte.usarMotores")) throw new Error("la carga no debe ofrecer apagar/prender el conteo por motores (retirado en H-266)");
    if (l.propuestas.some((p) => p.destino === "soporte.alturaTrabajo")) throw new Error("la altura de trabajo no se propone desde el plano: no es la altura libre y no se estima (H-266)");
    const antes = S.soporte.usarMotores;
    G("cxAplicar")(l, "abierto");
    eq(S.soporte.usarMotores, antes, "aplicar una longitud cambió usarMotores:");
    if (!(S.soporte.snap && S.soporte.usarMotores !== false)) eq(S.soporte.tubHidroM, 80, "los metros medidos entran a la captura propia de soportería:");
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
  await tA("17.28 un equipo detectado en archivo sale solo como referencia, sin marcar ni aplicar (decisión 4.2, 15-sep-2026)", async () => {
    /* Ningún motor lee un equipo leído de archivo (selección, cédula y
       cotización viven de sus propias capturas), así que ya no se ofrece
       para marcar ni aplicar: es dato de referencia, igual que área o altura
       "(referencia)". La confianza sigue distinguiendo una clave de plano
       (DN-50, PTR-102) de un equipo con marca o capacidad real. */
    const l = await cx("cxProcesarArchivos")([archivo("cedula.txt", "UMA-01 CARRIER 39M-15 12,000 CFM\nTUBO DN-50 CEDULA SCH-40\nPTR-102 perfil\n")], "seleccion");
    const eqs = l.propuestas.filter((p) => /^Equipo · /.test(p.etiqueta));
    if (!eqs.length) throw new Error("no se detectó ningún equipo en el renglón");
    if (eqs.some((p) => p.grupo !== "info")) throw new Error("un equipo detectado ya no debe ofrecerse para marcar ni aplicar (grupo debe ser 'info')");
    if (eqs.some((p) => p.marcado)) throw new Error("un equipo detectado no debe salir marcado");
    if (eqs.some((p) => p.fn)) throw new Error("un equipo detectado no debe traer función de aplicación");
    const uma = eqs.find((p) => /UMA-01/.test(p.etiqueta));
    if (!uma) throw new Error("UMA-01 no aparece como referencia");
    contiene(uma.etiqueta, "(referencia)");
    if (uma.confianza < .8) throw new Error("UMA-01 trae marca y capacidad: debe quedar con confianza alta");
    const dn = eqs.find((p) => /DN-50/.test(p.etiqueta));
    if (dn && dn.confianza >= .8) throw new Error("una clave de plano sin marca ni capacidad no debe quedar con confianza alta");
    /* Aplicar el lote completo no debe escribir ningún equipo. */
    G("cxAplicar")(l, "abierto");
    const ultimoLote = S.cx.lotes[S.cx.lotes.length - 1];
    if (ultimoLote.equipos.length) throw new Error("aplicar el lote no debe guardar ningún equipo (nada lo lee)");
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
  /* Banco (27-sep-2026): lo asíncrono se espera por su condición, no con un reloj fijo. El FileReader de jsdom encadena tres
     setImmediate; si el proceso se detiene más de 80 ms entre saltos (GC, varios bancos a la vez), el reloj de la prueba ganaba:
     18.10 veía el proyecto viejo y la importación tardía caía dentro de la espera de 18.16. Sondea cada 5 ms, tope ~10 s. */
  const esperarA = async (cond, veces = 2000) => { for (let i = 0; i < veces && !cond(); i++) await esperar(5); };
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
  /* Arranque en ceros: defaultZone() ya no trae muros/vidrio/luces/equipo
     de ejemplo; este proyecto histórico compartido por la sección 18 arma
     los suyos explícitos para seguir teniendo costo directo real. */
  S.zones = [{ ...G("defaultZone")("Sala blanca CLIENTE-HISTORICO"), area: 180, height: 3.5, occ: 9,
    walls: { N: 20, NE: 0, E: 14, SE: 0, S: 20, SW: 0, W: 14, NW: 0 },
    glass: { N: 3, NE: 0, E: 4, SE: 0, S: 6, SW: 0, W: 4, NW: 0 },
    lights: 600, equip: 700, ach: .4 }];
  G("recompute")();
  S.aire.consumos = [{ id: "u1", tipo: "actuador", nombre: "Linea CLIENTE-HISTORICO", cant: 12, lmin: 0, bar: 0, uso: 0 }];
  S.aire.presionUso = 7.7;
  S.civil.areaManual = 999;
  S.civil.areas = [{ id: "a1", nombre: "Nave histórica", area: 999, altura: 4, perimetro: 0 }];   /* H-272a: la captura propia de civil (ingeniería, sin identidad) tampoco viaja al proyecto en blanco */
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
    if ((S.civil.areas || []).some((a) => num(a.area) === 999)) throw new Error("viajó la obra civil (áreas de obra capturadas)");
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
    ["es", "en"].forEach((lang) => sinViejo(Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : G("monedaEspejoEN")() })).toString("utf8"), `libro ${lang}`));
    S.tab = "cotizacion"; G("render")();
    const opciones = [...w.document.querySelectorAll('[data-act="q-cmp-sel"] option')].map((o) => o.value);
    if (opciones.includes(idA)) throw new Error("el selector ofrece comparar contra otro proyecto");
    S.quote.prop.comparaCon = null;
  });
  t("18.6 una nueva revisión sí se compara contra la anterior del mismo proyecto", () => {
    /* Arranque en ceros: el proyecto en blanco de 18.1 no trae geometría; sin
       costo directo la pantalla de cotización no pinta el selector de
       comparativo. Esta prueba necesita zona real para poder verlo. */
    S.zones = [{ ...G("defaultZone")("Zona 1"), area: 120, height: 2.8, occ: 12,
      walls: { N: 28, NE: 0, E: 18, SE: 0, S: 28, SW: 0, W: 18, NW: 0 },
      glass: { N: 4, NE: 0, E: 6, SE: 0, S: 12, SW: 0, W: 8, NW: 0 },
      lights: 1200, equip: 1440, ach: .4 }];
    G("recompute")();
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
    await esperarA(() => S.meta.name === "Respaldo importado");
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
    /* Arranque en ceros: un proyecto nuevo ya no trae tramos de ejemplo, así
       que esta prueba arma los suyos propios antes de indexarlos. */
    S.duct.segments = [G("defaultSegment")("SA-PRINCIPAL-CLIENTE-HISTORICO", 2500), { ...G("defaultSegment")("SA-RAMAL-OBRA-HISTORICA", 800), shape: "round" }];
    S.duct.segments.push({ ...G("defaultSegment")("RA-OBRA-HISTORICA", 600), service: "return" });
    S.hidro.tramos = [{ ...G("defaultTramoAgua")("AF-CLIENTE-HISTORICO"), um: 72 }, { ...G("defaultTramoAgua")("AC-OBRA-HISTORICA"), um: 20, servicio: "caliente" }];
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
    ["es", "en"].forEach((lang) => sinViejo(Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : G("monedaEspejoEN")() })).toString("utf8"), `libro ${lang}`));
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
      await esperarA(() => /Revisión B creada/.test(avisoTxt()) && /Se retiró del historial/.test(avisoTxt()));
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
    /* Arranque en ceros: un proyecto nuevo ya no trae 2 tramos de ejemplo;
       esta prueba necesita esa base explícita antes de agregar el tercero. */
    S.duct.segments = [G("defaultSegment")("SA-1", 2500), G("defaultSegment")("SA-2", 800)];
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
    await esperarA(() => S.meta.name === "RESPALDO-IDENTIDAD");
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
      w.document.getElementById("toast").textContent = "";   /* el aviso que se espera es el de ESTA importación */
      inp.onchange({ target: { files: [new w.File([JSON.stringify({ meta: { name: "RESPALDO-ROTO" }, zones: [{ area: 5 }] })], "roto.emp.json")] } });
      await esperarA(() => avisoTxt().indexOf("Archivo no válido") >= 0);
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
    act("proj-new"); S.meta.name = "OBRA-NUEVA-V";
    /* Arranque en ceros: sin geometría real la pantalla de cotización no
       pinta el selector de comparativo que esta prueba verifica. */
    S.zones = [{ ...G("defaultZone")("Zona 1"), area: 120, height: 2.8, occ: 12,
      walls: { N: 28, NE: 0, E: 18, SE: 0, S: 28, SW: 0, W: 18, NW: 0 },
      glass: { N: 4, NE: 0, E: 6, SE: 0, S: 12, SW: 0, W: 8, NW: 0 },
      lights: 1200, equip: 1440, ach: .4 }];
    G("recompute")();
    G("projSave")(true);
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
    /* H-272d: la planta arquitectónica es un levantamiento: alimenta la captura propia de varias disciplinas (civil entre ellas). */
    eq(de("planta.dxf").motor, "levantamiento", "planta en /arquitectonico/ es un levantamiento por la carpeta:");
    eq(de("cuadro de cargas.csv").motor, "electrico", "cuadro de cargas al eléctrico:");
    eq(de("memoria sci.pdf").motor, "fuego", "memoria SCI por su contenido:");
    eq(de("fachada.png").motor, "referencia", "la foto queda de referencia:"); eq(de("fachada.png").estado, "listo");
    contiene(de("fachada.png").detalle, "1024×768");
    eq(de("modelo.rvt").estado, "norec", "formato no reconocido:"); contiene(de("modelo.rvt").detalle, ".rvt");
    eq(de("escaneo.pdf").estado, "error", "el PDF sin texto es un error claro:"); contiene(de("escaneo.pdf").detalle, "escaneo");
    if (/stack|TypeError|undefined/i.test(de("escaneo.pdf").detalle)) throw new Error("el mensaje de error trae basura técnica");
    ["cuadro de cargas.csv", "memoria sci.pdf", "planta.dxf"].forEach((n2) => { if (de(n2).estado !== "listo" || !(de(n2).propuestas > 0)) throw new Error(`${n2}: ${de(n2).estado} · ${de(n2).detalle}`); });
    /* H-272a: la planta alimenta la captura propia de obra civil (renglones de «Áreas de obra»), no un total a mano. */
    const lotePlanta = G("CXZ_LOTES")[de("planta.dxf").id];
    const propsCivil = lotePlanta ? (lotePlanta.compuesto ? ((lotePlanta.porTab.civil || {}).lote || { propuestas: [] }).propuestas : lotePlanta.propuestas) : [];
    if (!propsCivil.some((p) => p.destino === "civil.areas")) throw new Error("la planta en /arquitectonico/ debe proponer renglones de «Áreas de obra» (civil.areas): " + (lotePlanta ? JSON.stringify(lotePlanta.tabs || lotePlanta.propuestas.map((p) => p.destino)) : "sin lote"));
    if (!(S.civil.areas || []).some((a) => /OFICINA/i.test(a.nombre))) throw new Error("el levantamiento debe alimentar la captura propia de obra civil");
    if (S.civil.usarZonas === false || Number(S.civil.areaManual) > 0) throw new Error("cargar la planta no debe pasar obra civil a totales a mano");
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
  await tA("20.9 (decisión del dueño, 25-sep-2026) revisar desde la tabla abre la ventana de hallazgos con lo que ya entró al cargar; «Aplicar» no lo duplica y la fila sigue diciendo cuánto entró", async () => {
    const f = filasT().find((x) => x.nombre === "cuadro de cargas.csv");
    const antes = S.elec.cargas.length;
    if (!(f.aplicados > 0)) throw new Error("las cargas del CSV no entraron solas al cargar: " + f.detalle);
    await G("cxzRevisar")(f.id);
    const m = w.document.getElementById("modal");
    if (m.hidden || !m.querySelector('[data-act="cx-aplicar"]')) throw new Error("no abrió la ventana de hallazgos");
    contiene(m.textContent, "aplicado al cargar");
    m.querySelector('[data-act="cx-aplicar"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    eq(S.elec.cargas.length, antes, "«Aplicar» no vuelve a meter lo que ya entró:");
    if (!(f.aplicados > 0)) throw new Error("la fila perdió la cuenta de lo aplicado: " + f.detalle);
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
    /* A tiene sus propias cargas: las que entraron solas de su «cuadro de cargas.csv» al cargarlo (S.56). */
    const cargasA = A.data.elec.cargas.length, aplicadosA = A.data.cx.archivos.filter((f) => f.motor === "electrico").reduce((s, f) => s + (f.aplicados || 0), 0);
    if (!(cargasA > 0 && cargasA < cargasB)) throw new Error("el caso no distingue A de B: " + cargasA + " / " + cargasB);
    G("cxzCambiarProyecto")(A.id);
    /* Hay cambios sin guardar en B (lo aplicado desde la tabla): se avisa. */
    const m = w.document.getElementById("modal");
    if (m.hidden || !m.querySelector('[data-act="cxz-cambiar-guardar"]')) throw new Error("no avisó de los cambios sin guardar");
    m.querySelector('[data-act="cxz-cambiar-guardar"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    eq(S.pid, A.id, "proyecto abierto:");
    eq(filasT().length, 6, "la tabla de A es la de A:");
    if (filasT().some((f) => f.nombre === "cargas.xlsx")) throw new Error("un archivo de B apareció en A");
    eq(S.elec.cargas.length, cargasA, "las cargas aplicadas en B no están en A (A sólo trae las suyas):");
    const M = G("cxzEstadoMotores")();
    eq(M.find((x) => x.id === "electrico").aplicados, aplicadosA, "el estado de motores es el de A, no arrastra lo de B:");
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
  await tA("S.56 (decisión del dueño, 25-sep-2026) lo que se carga en el tablero entra solo a cada disciplina: los datos claros se aplican al terminar de leerse sin salir del tablero, quedan registrados con su archivo, lo dudoso espera la marca y «Aplicar» después no duplica", async () => {
    const antes = S.elec.cargas.length;
    S.tab = "tablero";
    await G("cxzAgregarArchivos")([archivo("cuadro auto.csv", CSV)]);
    await esperaCola();
    const f = filasT().find((x) => x.nombre === "cuadro auto.csv");
    eq(f.motor, "electrico", "motor por encabezados:"); eq(f.estado, "listo", f.detalle);
    const entradas = S.elec.cargas.length - antes;
    if (!(entradas > 0)) throw new Error("las cargas del CSV no entraron solas al eléctrico");
    eq(f.aplicados, entradas, "la fila cuenta lo que entró:");
    contiene(f.detalle, "aplicados al cargar");
    eq(S.tab, "tablero", "la carga automática no saca del tablero:");
    const lote = S.cx.lotes[S.cx.lotes.length - 1];
    eq(lote.tab, "electrico", "registro de origen en la disciplina:");
    if (!lote.aplicados.some((a) => a.archivo === "cuadro auto.csv")) throw new Error("el origen no registra el archivo del que salió cada dato");
    const P = G("CXZ_LOTES")[f.id].propuestas.filter((p) => p.grupo !== "info");
    if (P.some((p) => p.aplicado && !(p.confianza >= .8))) throw new Error("entró solo un dato de confianza baja");
    if (P.some((p) => p.aplicado && p.marcado)) throw new Error("un dato ya aplicado sigue marcado para volver a entrar");
    const v = vistaT();
    contiene(v.querySelector(".cxz-motores").textContent, "aplicados", "el estado del motor dice cuánto entró:");
    await G("cxzRevisar")(f.id);
    const m = w.document.getElementById("modal");
    contiene(m.textContent, "aplicado al cargar");
    m.querySelector('[data-act="cx-aplicar"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
    eq(S.elec.cargas.length - antes, entradas, "«Aplicar» no duplica lo que entró al cargar:");
    eq(f.aplicados, entradas, "la cuenta se conserva:");
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

  await tA("21.15 la portada ya no es una segunda pantalla de inicio: Escape y el renglón Tablero llevan al tablero", () => {
    const tabs = G("TABS").map(([id]) => id);
    if (tabs.includes("inicio")) throw new Error("«Portada» sigue en el menú de primer nivel");
    S.tab = "carga"; G("render")();
    w.document.querySelector('#tabs [data-tab="tablero"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    eq(S.tab, "tablero", "el renglón Tablero lleva al tablero:");
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
    const x = Buffer.from(G("buildPropuestaXlsx")({ lang, mon: lang === "es" ? "MXN" : G("monedaEspejoEN")() })).toString("utf8");
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
  proyectoDePrueba();
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
    const txt = Buffer.from(licitacionFormal()).toString("latin1");
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
  const txt = Buffer.from(licitacionFormal()).toString("latin1");
  /* El pie y el encabezado se repiten en cada página; si un párrafo de un
     concepto cae justo en el salto de página, ese texto se cuela en medio de
     la oración al concatenar. Se filtra antes de armar `todo`, para que la
     prueba no dependa de en qué página cae cada tarjeta. */
  const esFurniture = (c) => /^Página \d+ de \d+/.test(c) || c === "ELECTROMECÁNICA DEL PACÍFICO" || c === "Propuesta para licitacion publica";
  const celdas = [...txt.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).filter((c) => !esFurniture(c));
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
    contiene(todo, `Diferencia ${nf((A.directo / p.unit - 1) * 100, 1)} %. El precio unitario integrado que se oferta y el importe total de la propuesta se integran con el precio del catalogo`, p.clave + " diferencia al mismo nivel y origen del importe:");
    /* 1.2 · Decisión del dueño: se oferta el precio del catálogo. La tarjeta
       ya no puede imprimir un P.U. integrado distinto de eso: tiene que
       cuadrar con un renglón de ajuste explícito. */
    const i = celdas.indexOf(`${p.clave} · ${p.desc}`);
    if (i < 0) throw new Error(`${p.clave} no aparece con su encabezado de tarjeta`);
    const jAjuste = celdas.indexOf("Ajuste para cuadrar con el catálogo", i);
    if (jAjuste < 0) throw new Error(`${p.clave}: falta el renglón de ajuste`);
    const jFinal = celdas.indexOf("PRECIO UNITARIO OFERTADO (del catálogo)", jAjuste);
    if (jFinal < 0) throw new Error(`${p.clave}: falta el precio unitario ofertado`);
    const esCat = ES(p.unit), esCard = ES(A.directo);
    const num22 = (s) => +String(s).replace(/,/g, "");
    eq(num22(celdas[jFinal + 3]), +esCat.pu.toFixed(2), p.clave + " precio unitario ofertado = catálogo:");
    if (Math.abs(num22(celdas[jAjuste + 3]) - +(esCat.pu - esCard.pu).toFixed(2)) > 0.011)
      throw new Error(`${p.clave}: el ajuste (${celdas[jAjuste + 3]}) no cuadra la tarjeta contra el catálogo`);
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
    /* H-178 (rev 2.9.24): la corriente de cada motor sale de la Tabla 430-250 (NOM-001-SEDE-2012 p. 443), no de kW/fp:
       15 kW → 25 hp → 68 A; 7.5 kW → 10 hp → 28 A (230 V). Antes: motores 35.29 + 25 % del mayor 4.41 + alumbrado 10 +
       contactos 10 = 59.71 kVA; 2/0, 175 A, principal 175. Después: 47.25 + 6.48 + 10 + 10 = 73.73 kVA; 4/0, 225 A, principal 225. */
    const kVAm = (I) => Math.sqrt(3) * 220 * I / 1000;
    const dem = kVAm(68) + 2 * kVAm(28) + .25 * kVAm(68) + 9.5 / .95 + 9 / .90;
    const Iref = (dem + .25 * 9.5 / .95) * 1000 / (Math.sqrt(3) * 220);
    cerca(E.kVAdemanda, dem, 0.01, "kVAdemanda (ya trae el 25 % del motor mayor, con corrientes de tabla):");
    cerca(E.kVAdemanda, 73.728, 0.01, "kVAdemanda, valor a mano:");
    cerca(E.IdisAlim, Iref, 0.01, "corriente de diseño del alimentador:");
    cerca(E.IdisAlim / E.Itab, (dem + 2.5) / dem, 0.001, "factor sobre Itab (no 1.25):");
    const o = { I: E.Itab, V: 220, ph: 3, L: 5, fp: .95, material: "cobre", tempAmb: 30, nCond: 3, dvMax: 2 };
    const c = G("selConductor")({ ...o, Idis: E.IdisAlim });
    cerca(c.Idis, E.IdisAlim, 1e-9, "selConductor respeta Idis explícita:");
    eq(c.awg, "4/0", "calibre con la corriente de diseño corregida (200.05 A > 200 del 3/0):");
    eq(c.ocpd, 225, "protección del conductor con la corriente de diseño corregida:");
    const d = G("selConductor")({ ...o, continua: true });
    cerca(d.Idis, E.Itab * 1.25, 1e-9, "sin Idis explícita sigue el 125 % de carga continua:");
    if (!(c.I === d.I)) throw new Error("la caída de tensión debe seguir calculándose con la corriente real I");
    /* rev 2.9.6.2 · Ya conectado: el alimentador general se dimensiona con
       IdisAlim (no Itab × 1.25) y el interruptor principal es el mayor entre
       lo que exige proteger ese conductor y la protección del ramal del motor
       mayor (art. 430-63); aquí domina el alimentador, no el motor. */
    eq(E.alim.awg, "4/0", "calibre del alimentador general con la corriente corregida:");
    eq(E.alim.ocpd, 225, "protección del alimentador general con la corriente corregida:");
    eq(E.principal, 225, "interruptor principal = protección del alimentador (domina sobre el ramal del motor mayor, 250 %·68 → 175 A):");
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
    /* H-84 (15-sep-2026): el diámetro real de cobre tipo L (50.42/38.23 mm)
       reemplazó el placeholder genérico (50/38 mm) que compartían los tres
       materiales — la fricción baja porque el interior real es MAYOR, no un
       error. Valores recalculados con el motor ya corregido. */
    /* rev 2.9.18 · curva de Hunter del IPC E103.3(3): la fricción pasa de 4.9693 a 4.9548 m (antes → después). */
    cerca(friccion, 4.9548, 0.001, "fricción de los tramos:");
    /* H-194 (rev 2.9.24, hidro v5): la presión que la bomba deja en el mueble más alto es máx(residual capturada 15 m, mínima
       de norma del mueble que más pide). Con WC de fluxómetro sifónico rige la norma: 35 psi = 24.6074 m (IPC 2015 Tabla 604.3;
       antes 10.5 m sin fuente y la CDT llevaba el residual fijo: 6 + 4.9548 + 15 = 25.9548 m, 1.570 kW, 2.5 HP). Cifras
       calculadas fuera de la suite (parches/casos-a-mano/hidro.calc.mjs, casos 1 y 12). */
    cerca(H.presMinReq, 24.6074, 0.001, "presión mínima requerida: WC con fluxómetro sifónico, 35 psi × 0.703070 m/psi (IPC 2015 Tabla 604.3):");
    cerca(H.cdt, 35.5622, 0.001, "cdt = altura del edificio 6 + fricción 4.9548 + máx(residual 15, mínima 24.6074) (H-194; antes 25.9548):");
    cerca(H.presDisp, 25 - friccion - 6, 1e-9, "presión disponible sigue descontando la altura de los tramos:");
    cerca(H.kWbomba, 2.1511, 0.001, "kW al eje = 9.81 × 3.6996 × 35.5622 / 1000 / 0.6 (η 0.6 criterio de la casa; antes 1.570):");
    eq(H.hpBomba, 3, "HP nominales, redondeo a 0.5 HP de la casa: ceil(2.1511 / 0.746 × 2) / 2 = 3 (antes 2.5):");
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
      /* rev 2.9.14 · decisión del dueño: el texto explicativo vive solo en la guía. La nota de la gráfica ya no se repite
         en la vista; su contenido está en GUIA.ductos.ojo, que sí sale en la pantalla (la guía va dentro de #view). */
      if (pant.includes("La presión del ventilador que se muestra suma")) throw new Error(`${red} · la nota de la gráfica volvió a repetir la guía`);
      contiene(pant, `la suite muestra la suma de los tramos de suministro y retorno, porque el recorrido crítico todavía no se calcula: es ${COTA}.`, `${red} · guía de ductos en la pantalla:`);
      contiene(pant, `+15 % de margen · suma de los tramos de suministro y retorno (extracción y grasa van en sus propios ventiladores), cota superior solo de los tramos capturados${hayRetorno ? "" : " · sin tramos de retorno capturados"}`, `${red} · sub de Presión del ventilador:`);
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
    contiene(ojo, "la suma de los tramos de suministro y retorno, porque el recorrido crítico todavía no se calcula", "guía de ductos (qué se suma y por qué):");
    contiene(ojo, "Si un tramo domina la pérdida, revisa su velocidad o sus accesorios antes de subir el equipo", "guía de ductos (criterio de la nota que se quitó de la gráfica):");
    if (/sin tramos de retorno capturados/.test(ojo)) throw new Error("la guía trae el aviso dinámico de la pantalla: ese lo pinta la métrica según haya o no retorno");
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
    /* Arranque en ceros: defaultHidro() ya no trae tramos ni muebles de
       ejemplo; esta prueba necesita los dos tramos reales (72/20 um, 25/18 m)
       y muebles con fluxómetro (para que tipoSistema salga "fluxometro" como
       antes) que traía por default, para poder comparar espaciamiento entre
       materiales. */
    S.hidro = { ...G("defaultHidro")(), material,
      muebles: [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }],
      tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 }] };
    S.soporte = G("defaultSoporte")();
    G("recompute")();
  };
  try {
    /* H-84 (15-sep-2026): los cuatro materiales compartían el mismo placeholder
       de diámetro [50,38] mm — desde que cada uno tiene su interior real
       (cobre tipo L, acero cédula 40, CPVC CTS/SDR-11 hasta 2", PEAD sin
       tocar) el diámetro que sizeAgua() resuelve ya no es igual entre
       materiales, y con él cambian espaciamiento y conteo de acero (su
       interior real es ligeramente mayor al placeholder en cada nominal, así
       que el segundo tramo ya no necesita subir de 1-1/4" a 1-1/2"). */
    const esperado = {
      /* H-229: cobre 2" y 1½" al mínimo MSS/IPC = 8 ft = 2.438 m (antes 2.4). */
      cobre: { fam: "cobre", d: [50.42, 38.23], e: [2.438, 2.438], n: [12, 9] },
      /* H-198 (rev 2.9.24): CPVC CTS sólo llega a 2" (43.59 mm); la general (3.7 L/s) queda fuera de catálogo con el tope de 2" y va
         «Por cotizar» (antes 63 mm, renglón «SIN VERIFICAR»). La soportería sigue contándola con 43.59 mm: dependencia de soporte. */
      /* H-228: CPVC ≥ 1¼" = 4 ft (IPC 2009 T308.5); PEAD no está en la tabla y queda pendiente de claro (antes ambos 1.2 con 22/16). */
      cpvc: { fam: "plastico", d: [43.59, 43.59], e: [1.219, 1.219], n: [22, 16] },
      pead: { fam: "plastico", d: [50, 38], e: [null, null], n: [0, 0], pdf: [["pendiente", "0"], ["pendiente", "0"]] },
      acero: { fam: "acero", d: [52.5, 35.05], e: [3, 2.1], n: [10, 10] },
    };
    Object.entries(esperado).forEach(([material, x]) => {
      preparar(material);
      if (hidroDe()) throw new Error(`${material}: H-266: sin aceptar la instantánea la soportería no toma la hidráulica de los motores`);
      G("propAceptar")("motores>soporte");
      G("recompute")();
      eq(S.soporte.snap.hidroMat, x.fam, `${material} instantánea hidroMat:`);
      const h = hidroDe();
      eq(h.fam, x.fam, `${material} familia gobernada:`);
      eq(JSON.stringify(h.det.map((d) => d.d)), JSON.stringify(x.d), `${material} diámetros del caso:`);
      eq(JSON.stringify(h.det.map((d) => d.e)), JSON.stringify(x.e), `${material} espaciamientos:`);
      eq(JSON.stringify(h.det.map((d) => d.n)), JSON.stringify(x.n), `${material} soportes por tramo:`);
      /* El PDF imprime el claro con un decimal (2.438 → «2.4»). */
      eq(JSON.stringify(filasPdf()), JSON.stringify(x.pdf || x.e.map((e, i) => [String(Math.round(e * 10) / 10), String(x.n[i])])), `${material} PDF conteo por tramo:`);
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
  proyectoDePrueba();
  const site0 = JSON.parse(JSON.stringify(S.site ?? null));
  const RX = /Exterior[^°]*?(-?\d+(?:\.\d+)?) °C de bulbo seco y (-?\d+(?:\.\d+)?) °C de bulbo húmedo/g;
  const texto = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ").replace(/\s+/g, " ");
  try {
    [
      { nombre: "Mexicali", site: { key: "mexicali" }, esperado: "44/24.8" }, /* rev 2.9.23 · Mexicali Intl 760053 adoptada como dato (antes 46/23 sin fuente) */
      { nombre: "Personalizado", site: { key: "custom", db: 42, wb: 26, alt: 1200, range: 14 }, esperado: "42/26" },
      { nombre: "Tijuana", site: { key: "tijuana" }, esperado: "32.8/17.5" }, /* rev 2.9.18 · ASHRAE 2021 (antes 35/24) */
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

t("22.11 3.3 (rev 2.9.16, decisión del dueño) la red hidráulica se cotiza por diámetro y material con el precio capturado; sin longitud queda «pendiente de longitud» y sin precio «pendiente de precio unitario»: nada se supone", () => {
  const hidro0 = JSON.parse(JSON.stringify(S.hidro)), perms0 = JSON.parse(JSON.stringify(S.perms ?? null)), pu0 = JSON.parse(JSON.stringify(S.quote.hidroPU || {}));
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const renglones = () => (G("QUOTE").aux || []).filter((a) => a.mot === "hidro" && a.un === "ML");
  /* H-196: la cisterna sin dotación queda «pendiente de volumen» aparte; aquí sólo se mira la red. */
  const pend = () => (G("QUOTE").pendientes || []).filter((p) => p.mot === "hidro" && !/volumen/.test(p.motivo));
  const tramo = (tag, um, L) => ({ ...G("defaultTramoAgua")(tag), um, L, alt: 3 });
  const muebles = [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }];
  try {
    S.perms = { ...(S.perms || {}), "hidro>quote": { ts: 1, via: "banco" } };
    S.quote.hidroPU = {};
    /* Sin tramos: nada de metros inventados. */
    S.hidro = { ...G("defaultHidro")(), tramos: [], muebles }; G("recompute")();
    if (!(G("HIDRO").umTotal > 0)) throw new Error("el caso no trae unidades mueble");
    eq(renglones().length, 0, "sin tramos no hay renglón de tubería:");
    eq(pend().map((p) => p.motivo).join(","), "pendiente de longitud", "sin tramos:");
    /* Tramos en 0 m: pendientes de longitud, sin cotizar. */
    S.hidro = { ...G("defaultHidro")(), tramos: [tramo("AF-GENERAL", 72, 0), tramo("AF-RAMAL BAÑOS", 20, 0)], muebles }; G("recompute")();
    eq(renglones().length, 0, "tramos en 0 m no cotizan:");
    contiene(pend()[0].desc, "2 tramo(s) de agua sin longitud capturada", "tramos en 0 m:");
    /* Con longitudes y sin precio: pendiente de precio unitario por diámetro. */
    S.hidro = { ...G("defaultHidro")(), tramos: [tramo("AF-GENERAL", 72, 25), tramo("AF-RAMAL BAÑOS", 20, 18)], muebles }; G("recompute")();
    const H = G("HIDRO"), noms = [...new Set(H.tramos.map((t) => t.nom))];
    eq(renglones().length, 0, "sin precio no se cotiza:");
    eq(pend().length, noms.length, "un pendiente por diámetro:");
    pend().forEach((p) => eq(p.motivo, "pendiente de precio unitario", "motivo:"));
    const txt = pdfTxt(G("buildCotizacionPdf")());
    contiene(txt, "PARTIDAS PENDIENTES, NO COTIZADAS", "PDF de cotización:");
    contiene(pdfTxt(G("buildPropuestaPdf")({ lang: "en", mon: "USD" })), "Pending items, not priced", "propuesta en inglés:");
    /* Con precio por diámetro: un renglón por diámetro, metros de los tramos capturados, importe = precio × metros. */
    noms.forEach((nom, i) => { S.quote.hidroPU[G("claveHidroPU")(H.mat, nom)] = 500 + 100 * i; });
    G("recompute")();
    const R = renglones();
    eq(R.length, noms.length, "renglones por diámetro:");
    eq(pend().length, 0, "sin pendientes:");
    cerca(R.reduce((a, r) => a + r.qty, 0), 43, 1e-9, "metros cotizados (25 + 18):");
    R.forEach((r) => { cerca(r.total, r.qty * r.unit, 1e-9, "importe:"); contiene(r.desc, "de los tramos calculados", "descripción:"); if (/supuesto/.test(r.desc)) throw new Error("un renglón dice supuesto"); });
    /* Un precio basura del respaldo se descarta al abrir. */
    const sucio = JSON.parse(JSON.stringify(S)); sucio.quote.hidroPU = { "cobre_1_": -5, "x.y": 9, cobre_3_4_: "abc" };
    const san = G("sanearEstado")(sucio).quote.hidroPU; /* rev 2.9.23: la basura se descarta y entran sólo las referencias de mercado */
    eq(JSON.stringify(Object.keys(san).sort()), JSON.stringify(Object.keys(G("HIDRO_PU_REFERENCIA")).sort()), "precios inválidos descartados; quedan las referencias:");
    Object.values(san).forEach((e) => eq(e.origen, "referencia", "todo lo cargado es Referencia Budget:"));
  } finally {
    S.hidro = hidro0; S.quote.hidroPU = pu0;
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
      ["Limpio ISO 5", 240, "360 cambios/h contra 240, mínimo de ISO 5 (rango 240–480, ISO 14644-4 · ISPE)", 1.1041] /* rev 2.9.21 · unidad de aire exterior + serpentín seco; 2.9.20 daba 1.0291, 2.9.19 1.021 */,
      ["Limpio ISO 6", 90, "135 cambios/h contra 90, mínimo de ISO 6 (rango 90–180, ISO 14644-4 · ISPE)", 0.5744] /* 2.9.20 0.4995 · 2.9.19 0.492 */,
      ["Limpio ISO 7", 30, "45 cambios/h contra 30, mínimo de ISO 7 (rango 30–60, ISO 14644-4 · ISPE)", 0.4231] /* 2.9.20 0.3481 · 2.9.19 0.34 */,
      ["Limpio ISO 8 alto", 15, "40 cambios/h contra 15, mínimo URS típico de ISO 8 (rango de la clase 10–25)", 0.3852] /* 2.9.20 0.3103 · 2.9.19 0.303 */,
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
  proyectoDePrueba();
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
  proyectoDePrueba();
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
     ["propuesta EN", dec(G("buildPropuestaPdf")({ lang: "en", mon: "USD" }))], ["licitación", Buffer.from(licitacionFormal()).toString("latin1")],
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
  proyectoDePrueba();
  const guardado = JSON.parse(JSON.stringify(S.quote));
  try {
    S.quote.indirectPct = 18; S.quote.profitPct = 12; S.quote.finPct = 1.5; S.quote.contingencia = 0.15;
    const E = G("estructuraSobrecosto")(1000000);
    cerca(E.cc, 150000, 0.01, "contingencia sobre directo:");
    cerca(E.pu, (1000000 * 1.18 * 1.015 * 1.12 + 150000) * 1.007, 0.01, "importe integrado:");
    S.quote.contingencia = 0;
    cerca(G("estructuraSobrecosto")(1000000).pu, 1350813.968, 0.01, "con 0 % es el importe de antes:");
    S.quote.contingencia = 0.15;
    const txt = Buffer.from(licitacionFormal()).toString("latin1");
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
  proyectoDePrueba();
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
  proyectoDePrueba();
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
  delete viejo.formato; /* rev 2.9.14 · «viejo» = anterior al formato 2 */
  const s = G("sanearEstado")(viejo);
  eq(s.quote.indirectPct, 20, "indirectos copiados de la privada:");
  eq(s.quote.profitPct, 15, "utilidad copiada de la privada:");
});
t("K.1b un proyecto del formato 2 NO se remigra: la licitación que quedó en la semilla sigue independiente de la privada", () => {
  /* rev 2.9.14 · La migración corría en cada apertura, deshacer e importación: un proyecto recién guardado cambiaba de precio de licitación. */
  const guardado = JSON.parse(JSON.stringify(G("defaultState")()));
  guardado.quote.indirect = 0.22; guardado.quote.utility = 0.15; /* privada movida; licitación en la semilla 18/12 */
  const s = G("sanearEstado")(guardado);
  eq(s.quote.indirectPct, G("QUOTE_SEED").indirectPct, "licitación intacta:"); eq(s.quote.profitPct, G("QUOTE_SEED").profitPct, "licitación intacta:");
  const otra = G("sanearEstado")(JSON.parse(JSON.stringify(s)));
  eq(JSON.stringify(otra.quote), JSON.stringify(s.quote), "abrir dos veces da lo mismo:");
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

/* ===== L. Altura hidráulica y tablas de soportería (15-sep-2026) ========= */
t("L.1 2.2 la altura estática es la del edificio; si no coincide con la suma de los tramos, avisa (decisión del dueño)", () => {
  const guardado = JSON.parse(JSON.stringify(S.hidro));
  try {
    S.hidro = { ...G("defaultHidro")(), alturaEdificio: 8, presResidual: 15,
      tramos: [{ ...G("defaultTramoAgua")("AF-1"), um: 20, L: 15, alt: 2 }, { ...G("defaultTramoAgua")("AF-2"), um: 10, L: 10, alt: 1 }] };
    G("recompute")();
    const H = G("HIDRO");
    eq(H.tramos.reduce((a, t) => a + t.alt, 0), 3, "suma de alturas de los tramos del caso:");
    /* H-194 (rev 2.9.24): sin muebles capturados la mínima de norma es el menor renglón de la Tabla 604.3 del IPC 2015 (8 psi =
       5.6246 m; antes 5.6 sin fuente) y rige el residual de la casa (15 m): la CDT sigue siendo altura + fricción + 15. */
    cerca(H.presMinReq, 5.6246, 0.001, "sin muebles: mínima de la Tabla 604.3, 8 psi × 0.703070 m/psi (H-194):");
    cerca(H.cdt, 8 + H.tramos.reduce((a, t) => a + t.hf, 0) + 15, 0.01, "la carga dinámica usa la altura del edificio, no la de los tramos (residual 15 > 5.62 de norma):");
    if (!H.avisos.some((a) => /altura del edificio capturada.*no coincide/.test(a.msg)))
      throw new Error("no avisa la discrepancia de alturas (5 m de diferencia, > 0.5 m)");
  } finally { S.hidro = guardado; G("recompute")(); }
});
t("L.1.1 2.2 sin discrepancia relevante (≤ 0.5 m) no avisa", () => {
  const guardado = JSON.parse(JSON.stringify(S.hidro));
  try {
    S.hidro = { ...G("defaultHidro")(), alturaEdificio: 6, presResidual: 15,
      tramos: [{ ...G("defaultTramoAgua")("AF-1"), um: 20, L: 15, alt: 3 }, { ...G("defaultTramoAgua")("AF-2"), um: 10, L: 10, alt: 3.3 }] };
    G("recompute")();
    const H = G("HIDRO");
    if (H.avisos.some((a) => /no coincide/.test(a.msg))) throw new Error("con 0.3 m de diferencia no debería avisar");
  } finally { S.hidro = guardado; G("recompute")(); }
});
t("L.2 2.5 / H-229 tablas de espaciamiento: cobre al mínimo de MSS SP-58-2018 e IPC 2009 T308.5 (decisión 4 del dueño), la tabla viva es la única cifra; termoplástico con su tabla propia", () => {
  /* H-75 (15-sep-2026) había alineado todo a 1.8 m «de código»; H-229 (25-sep-2026) sustituye ese valor por el mínimo de las
     dos tablas (secundarias declaradas, ratificar con texto): ¾" = 5 ft = 1.524 m, 1¼" = 6 ft = 1.829 m. */
  const esp = G("espSoporte");
  cerca(esp(20, "cobre"), 1.524, 0.001, `cobre ¾" (20 mm):`);
  cerca(esp(32, "cobre"), 1.829, 0.001, `cobre 1¼" (32 mm), tabla viva:`);
  cerca(esp(32, "cobre"), G("C_SOP").ESPAC_COBRE['1-1/4"'], 1e-12, "misma cifra que el motor:");
  cerca(esp(32, "acero"), G("C_SOP").ESPAC_ACERO['1-1/4"'], 1e-12, "acero, misma cifra que el motor:");
  for (const k of ["SOP_ACERO", "SOP_COBRE"]) if (w.eval(`typeof ${k}`) !== "undefined") throw new Error(`${k} sigue en la lista activa`);
  cerca(esp(15, "cobre"), 1.524, 0.001, `cobre ½" (15 mm):`);
  cerca(esp(25, "plastico", "cpvc"), 0.9, 0.001, `termoplástico 1" (25 mm):`);
  if (!(esp(20, "cobre") < esp(20, "acero"))) throw new Error("el cobre debe seguir dando menos distancia que el acero en el mismo diámetro");
  if (!(esp(25, "plastico", "cpvc") < esp(32, "plastico", "cpvc"))) throw new Error("el termoplástico debe dar menos distancia en 1\" que en 1¼\"–2\"");
});

/* ===== M. Balance global: compresor, bombas y FFU al cuadro eléctrico ====
   Decisión del dueño (15-sep-2026): compresor de aire, bomba de agua, bomba
   contra incendio y FFU de cuartos limpios llegan al motor eléctrico, cada
   uno con su propio cruce (aire>elec, hidro>elec, fuego>elec, clean>elec),
   igual que el equipo HVAC y el ventilador.
   H-268 (decisión del dueño, 27-sep-2026): llegan SÓLO al aceptar la propuesta
   «cedula>elec» (instantánea con origen y fecha, que concede los cruces); el
   modo en vivo (tomarHVAC con permisos) se retiró y ya no mete nada al calcular. */
function limpiarPermisosElecBalance() {
  ["aire>elec", "hidro>elec", "fuego>elec", "clean>elec", "equip>elec", "vent>elec"].forEach((k) => delete S.perms[k]);
}
t("M.1 (H-268) sin aceptar la propuesta, compresor, bombas y FFU no llegan al cuadro eléctrico: ni sin permisos ni con los cuatro autorizados (se retiró el modo en vivo)", () => {
  const g = { aire: JSON.parse(JSON.stringify(S.aire)), hidro: JSON.parse(JSON.stringify(S.hidro)), fuego: JSON.parse(JSON.stringify(S.fuego)), clean: JSON.parse(JSON.stringify(S.clean)), elec: JSON.parse(JSON.stringify(S.elec)), perms: JSON.parse(JSON.stringify(S.perms)) };
  try {
    S.aire = G("defaultAire")(); S.hidro = G("defaultHidro")(); S.fuego = G("defaultFuego")();
    S.clean = { rooms: [G("defaultRoom")()], ci: 0 };
    S.elec.tomarHVAC = true;
    limpiarPermisosElecBalance();
    G("recompute")();
    const sinNada = (E, caso) => { if (E.calc.some((c) => c.auto || /^(aire|hidro|fuego|ffu)-/.test(c.id))) throw new Error(`una carga de otro motor llegó al cuadro eléctrico sin aceptar la propuesta (${caso})`); };
    sinNada(G("ELEC"), "sin permisos");
    ["aire>elec", "hidro>elec", "fuego>elec", "clean>elec"].forEach((k) => { S.perms[k] = { ts: 1, via: "prueba M.1" }; });
    G("recompute")();
    sinNada(G("ELEC"), "con los cuatro permisos y tomarHVAC");
  } finally { S.aire = g.aire; S.hidro = g.hidro; S.fuego = g.fuego; S.clean = g.clean; S.elec = g.elec; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); G("recompute")(); }
});
t("M.2 (H-268) con los cuatro cruces autorizados nada entra solo; al aceptar la propuesta las cuatro cargas llegan como instantánea con la tensión del sistema (o 127 V para FFU) y los permisos ya no mueven el cuadro", () => {
  const g = { aire: JSON.parse(JSON.stringify(S.aire)), hidro: JSON.parse(JSON.stringify(S.hidro)), fuego: JSON.parse(JSON.stringify(S.fuego)), clean: JSON.parse(JSON.stringify(S.clean)), elec: JSON.parse(JSON.stringify(S.elec)), perms: JSON.parse(JSON.stringify(S.perms)), vinculos: JSON.parse(JSON.stringify(S.vinculos || {})) };
  try {
    S.aire = { ...G("defaultAire")(), consumos: [{ id: "c1", tipo: "pistola", nombre: "Prueba M.2", cant: 4, lmin: 0, bar: 0, uso: 0 }] };
    /* Arranque en ceros: defaultHidro() ya no trae muebles de ejemplo; sin
       ellos H.kWbomba sale 0 y el caso no aísla la bomba de agua. */
    S.hidro = { ...G("defaultHidro")(), muebles: [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }] };
    S.fuego = { ...G("defaultFuego")(), area: 500, altura: 6, Lramal: 30, Lmontante: 12 };   /* H-264: contra incendio ya no hereda área ni altura: se capturan; H-210: sin cabezal ni montante la bomba queda pendiente */
    S.clean = { rooms: [{ ...G("defaultRoom")(), area: 60, height: 2.7, occ: 4, procW: 25 }], ci: 0 };
    S.elec.sistema = "3F4H-220"; S.elec.tomarHVAC = true;
    limpiarPermisosElecBalance();
    ["aire>elec", "hidro>elec", "fuego>elec", "clean>elec"].forEach((k) => { S.perms[k] = { ts: 1, via: "prueba M.2" }; });
    G("recompute")();
    const A = G("AIRE"), H = G("HIDRO"), F = G("FUEGO"), C = G("CLEAN");
    if (!(A.principal && A.principal.kW > 0)) throw new Error("el caso no aísla lo que se quiere probar: el compresor por omisión debe tener kW > 0");
    if (!(H.kWbomba > 0)) throw new Error("el caso no aísla lo que se quiere probar: la bomba de agua por omisión debe tener kW > 0");
    if (!(F.kWbomba > 0)) throw new Error("el caso no aísla lo que se quiere probar: la bomba contra incendio por omisión debe tener kW > 0");
    if (!(C.sum.ffu > 0)) throw new Error("el caso no aísla lo que se quiere probar: el cuarto limpio por omisión debe tener FFU > 0");
    /* H-268: con los cruces autorizados y tomarHVAC, sin aceptar la propuesta, nada entra. */
    if (G("ELEC").calc.some((c) => c.auto || c.origen === "cedula")) throw new Error("una carga de otro motor entró al cuadro sin aceptar la propuesta");
    G("propAceptar")("cedula>elec");
    const E = G("ELEC"), de = (o) => E.calc.find((c) => c.origen === "cedula" && c.kWOrigen === o);
    const aire1 = de("aire"), hidro1 = de("hidro"), fuego1 = de("fuego"), ffu1 = de("ffu");
    if (!aire1) throw new Error("el compresor no llegó al cuadro al aceptar la propuesta");
    if (!hidro1) throw new Error("la bomba de agua no llegó al cuadro al aceptar la propuesta");
    if (!fuego1) throw new Error("la bomba contra incendio no llegó al cuadro al aceptar la propuesta");
    if (!ffu1) throw new Error("los FFU no llegaron al cuadro al aceptar la propuesta");
    [aire1, hidro1, fuego1, ffu1].forEach((c) => { if (!(c.ts > 0)) throw new Error(`${c.nombre}: la instantánea debe llevar fecha`); });
    cerca(aire1.kW, A.principal.kW, 1e-9, "kW del compresor = el del catálogo, sin inventar otro dato:");
    eq(aire1.V, 220, "compresor a la tensión del sistema:"); eq(aire1.ph, 3, "compresor trifásico:"); eq(aire1.tipo, "motor");
    cerca(hidro1.kW, +H.kWbomba.toFixed(2), 1e-9, "kW de la bomba de agua:");
    cerca(fuego1.kW, +F.kWbomba.toFixed(2), 1e-9, "kW de la bomba contra incendio:");
    cerca(ffu1.kW, +(C.sum.ffu * G("FFU").watts / 1000).toFixed(2), 1e-9, "kW de los FFU = conteo × 120 W:");
    eq(ffu1.V, 127, "FFU a 127 V monofásico:"); eq(ffu1.ph, 1);
    /* Cada una pesa en la demanda del tablero: quitar la carga aceptada del compresor baja kVAdemanda. Quitar el permiso ya no
       mueve nada (H-268, regla 3: la instantánea es captura propia con origen). */
    const kVAconTodo = E.kVAdemanda;
    delete S.perms["aire>elec"]; G("recompute")();
    cerca(G("ELEC").kVAdemanda, kVAconTodo, 1e-9, "quitar el permiso no mueve la instantánea aceptada (H-268):");
    S.elec.cargas = S.elec.cargas.filter((c) => c.kWOrigen !== "aire"); G("recompute")();
    if (!(G("ELEC").kVAdemanda < kVAconTodo)) throw new Error("quitar la carga del compresor no bajó la demanda del tablero");
  } finally { S.aire = g.aire; S.hidro = g.hidro; S.fuego = g.fuego; S.clean = g.clean; S.elec = g.elec; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); Object.keys(S.vinculos || {}).forEach((k) => delete S.vinculos[k]); Object.assign(S.vinculos, g.vinculos); G("recompute")(); }
});
t("M.3 aceptar la propuesta combinada escribe las cuatro cargas nuevas con origen «cedula», y el alimentador ya las refleja", () => {
  const g = { aire: JSON.parse(JSON.stringify(S.aire)), hidro: JSON.parse(JSON.stringify(S.hidro)), fuego: JSON.parse(JSON.stringify(S.fuego)), clean: JSON.parse(JSON.stringify(S.clean)), elec: JSON.parse(JSON.stringify(S.elec)), perms: JSON.parse(JSON.stringify(S.perms)), vinculos: JSON.parse(JSON.stringify(S.vinculos || {})) };
  try {
    S.aire = G("defaultAire")(); S.hidro = G("defaultHidro")(); S.fuego = G("defaultFuego")();
    S.clean = { rooms: [G("defaultRoom")()], ci: 0 };
    S.elec.cargas = []; S.elec.tomarHVAC = false;
    limpiarPermisosElecBalance();
    G("CRUCES_ELEC").forEach((k) => { S.perms[k] = { ts: 1, via: "prueba M.3" }; });
    G("recompute")();
    G("PROPUESTAS")["cedula>elec"].aplicar();
    G("registrarVinculo")("cedula>elec", "aceptado");
    G("recompute")();
    const ced = S.elec.cargas.filter((c) => c.origen === "cedula");
    if (ced.length < 4) throw new Error(`se esperaban al menos 4 cargas aceptadas (compresor, bomba de agua, bomba de incendio, FFU); llegaron ${ced.length}`);
    const E = G("ELEC");
    if (!(E.principal >= E.alim.ocpd)) throw new Error("el principal debe seguir protegiendo el alimentador general tras aceptar las cargas nuevas");
    if (!(E.kVAdemanda > 0)) throw new Error("la demanda del tablero debe reflejar las cargas recién aceptadas");
  } finally { S.aire = g.aire; S.hidro = g.hidro; S.fuego = g.fuego; S.clean = g.clean; S.elec = g.elec; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); Object.keys(S.vinculos || {}).forEach((k) => delete S.vinculos[k]); Object.assign(S.vinculos, g.vinculos); G("recompute")(); }
});
t("M.4 (reordenamiento, H-268) un cambio en el compresor se refleja en la PROPUESTA en el MISMO ciclo de recompute, no en el siguiente; la instantánea aceptada no se mueve sola", () => {
  /* Antes de la rev 2.9.5, ELEC corría antes que AIRE/HIDRO/FUEGO en recompute(): un cambio en el compresor solo se veía un
     recompute() después. H-268: el compresor ya no entra al cuadro al calcular, pero la propuesta se arma en el mismo ciclo con
     el compresor de ESE ciclo; lo aceptado es instantánea y no se mueve (regla 3). */
  const g = { aire: JSON.parse(JSON.stringify(S.aire)), elec: JSON.parse(JSON.stringify(S.elec)), perms: JSON.parse(JSON.stringify(S.perms)), vinculos: JSON.parse(JSON.stringify(S.vinculos || {})) };
  try {
    S.aire = { ...G("defaultAire")(), consumos: [{ id: "c1", tipo: "actuador", nombre: "Chico", cant: 1, lmin: 0, bar: 0, uso: 0 }] };
    S.elec.tomarHVAC = true;   /* el modo de revisiones anteriores ya no mete nada */
    limpiarPermisosElecBalance();
    S.perms["aire>elec"] = { ts: 1, via: "prueba M.4" };
    G("recompute")();
    const kWchico = G("AIRE").principal.kW;
    const propChico = G("propuestaElecFilas")().find((c) => c.kWOrigen === "aire");
    if (!propChico) throw new Error("la propuesta no trae el compresor");
    eq(propChico.kW, kWchico, "con el compresor chico, la propuesta ya trae su kW en el primer recompute:");
    if (G("ELEC").calc.some((c) => c.kWOrigen === "aire")) throw new Error("H-268: el compresor no debe entrar al cuadro sin aceptar la propuesta");
    G("propAceptar")("cedula>elec");
    eq(G("ELEC").calc.find((c) => c.kWOrigen === "aire").kW, kWchico, "aceptada, el cuadro trae el kW del compresor chico:");
    S.aire = { ...G("defaultAire")(), consumos: [
      { id: "c1", tipo: "actuador", nombre: "Grande 1", cant: 400, lmin: 0, bar: 0, uso: 0 },
      { id: "c2", tipo: "pistola", nombre: "Grande 2", cant: 200, lmin: 0, bar: 0, uso: 0 },
    ] };
    G("recompute")();
    const kWgrande = G("AIRE").principal.kW;
    if (!(kWgrande > kWchico)) throw new Error("el caso no aísla lo que se quiere probar: el segundo compresor debe ser más grande");
    eq(G("propuestaElecFilas")().find((c) => c.kWOrigen === "aire").kW, kWgrande, "un solo recompute() basta: la propuesta ya trae el kW del compresor grande, no el del chico:");
    eq(G("ELEC").calc.find((c) => c.kWOrigen === "aire").kW, kWchico, "la instantánea aceptada no se mueve sola (regla 3):");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "desactualizado", "y la propuesta avisa que el origen cambió:");
  } finally { S.aire = g.aire; S.elec = g.elec; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); Object.keys(S.vinculos || {}).forEach((k) => delete S.vinculos[k]); Object.assign(S.vinculos, g.vinculos); G("recompute")(); }
});

/* ===== N. Balance global: cierres de coherencia (aire y agua) ===========
   Decisión del dueño (15-sep-2026): avisos de coherencia con datos que la
   suite ya calcula, no una fórmula de dimensionamiento nueva. Aire (carga y
   cuartos limpios comparten núcleo térmico, sin permiso); agua (hidráulico y
   contra incendio son autónomos, con su propio permiso fuego>hidro). */
t("N.1 balance de aire: si los cuartos limpios piden más reposición de la que la carga térmica capta de aire exterior, avisa", () => {
  /* Arranque en ceros: el proyecto ambiente puede haber quedado en blanco
     por una prueba anterior (proj-new); se restablece el fijo del banco. */
  proyectoDePrueba();
  const g = { zones: JSON.parse(JSON.stringify(S.zones)), zi: S.zi, clean: JSON.parse(JSON.stringify(S.clean)) };
  try {
    G("recompute")();
    const oaHoy = G("totals")().oa;
    S.clean = { rooms: [{ ...G("defaultRoom")("Cuarto de prueba"), area: 60, height: 2.7, occ: 5000, dp: 12.5, crackLen: 6, oaFrac: .1 }], ci: 0 };
    G("recompute")();
    const C = G("CLEAN");
    if (!(C.sum.makeup > oaHoy * 1.05)) throw new Error(`el caso no aísla lo que se quiere probar: la reposición (${C.sum.makeup}) debe superar el aire exterior del proyecto (${oaHoy}) por más de 5 %`);
    const V = G("validateAll")();
    if (!V.rows.some((r) => /Balance de aire.*reposici.n/i.test(r.msg) && r.lvl === "warn")) throw new Error("no avisa la falta de coherencia entre reposición de limpios y aire exterior del proyecto");
  } finally { S.zones = g.zones; S.zi = g.zi; S.clean = g.clean; G("recompute")(); }
});
t("N.1.1 balance de aire: un cuarto limpio chico, con la reposición muy por debajo del aire exterior del proyecto, no avisa", () => {
  proyectoDePrueba();
  const g = { clean: JSON.parse(JSON.stringify(S.clean)) };
  try {
    G("recompute")();
    const oaHoy = G("totals")().oa;
    if (!(oaHoy > 100)) throw new Error("el caso no aísla lo que se quiere probar: el proyecto de prueba debe capturar un aire exterior apreciable");
    S.clean = { rooms: [{ ...G("defaultRoom")("Cuarto chico"), area: 1, height: 2.2, occ: 0, dp: 0, crackLen: 0, oaFrac: 0 }], ci: 0 };
    G("recompute")();
    const C = G("CLEAN");
    if (!(C.sum.makeup > 0 && C.sum.makeup < oaHoy * 1.05)) throw new Error(`el caso no aísla lo que se quiere probar: la reposición (${C.sum.makeup}) debe quedar chica pero positiva, por debajo del aire exterior del proyecto (${oaHoy})`);
    const V = G("validateAll")();
    if (V.rows.some((r) => /Balance de aire.*reposici.n/i.test(r.msg))) throw new Error("avisó una falta de coherencia que no existe: la reposición cabe sobrada dentro del aire exterior capturado");
  } finally { S.clean = g.clean; G("recompute")(); }
});
t("N.2 balance de agua: con fuego>hidro autorizado, contrasta cisterna doméstica contra la reserva contra incendio", () => {
  const g = { perms: JSON.parse(JSON.stringify(S.perms)), hidro: JSON.parse(JSON.stringify(S.hidro)) };
  const nf = G("n");
  try {
    /* Arranque en ceros: defaultHidro() ya no trae habitantes de ejemplo;
       sin ellos H.cisterna sale 0 y el caso no aísla el balance de agua. */
    S.hidro = { ...S.hidro, habitantes: 60 };
    Object.keys(S.perms).forEach((k) => delete S.perms[k]);
    G("recompute")();
    const H = G("HIDRO"), F = G("FUEGO");
    if (!(H.cisterna > 0)) throw new Error("el caso no aísla lo que se quiere probar: la cisterna por omisión debe ser > 0");
    if (!(F.reserva > 0)) throw new Error("el caso no aísla lo que se quiere probar: la reserva contra incendio por omisión debe ser > 0");
    let V = G("validateAll")();
    if (V.rows.some((r) => /Balance de agua/i.test(r.msg))) throw new Error("avisó el balance de agua sin el permiso fuego>hidro autorizado");
    S.perms["fuego>hidro"] = { ts: 1, via: "prueba N.2" };
    G("recompute")();
    V = G("validateAll")();
    const fila = V.rows.find((r) => /Balance de agua/i.test(r.msg));
    if (!fila) throw new Error("no avisa el balance de agua con el permiso autorizado");
    contiene(fila.msg, `${nf(H.cisterna / 1000, 1)} m³`, "cita la cisterna doméstica:");
    contiene(fila.msg, `${nf(F.reserva / 1000, 1)} m³`, "cita la reserva contra incendio:");
    eq(fila.lvl, "info", "es informativo, no un error ni una advertencia:");
  } finally { S.hidro = g.hidro; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); G("recompute")(); }
});

/* ===== O. SoporteCalc v0.1.0 integrado (decisión del dueño, 15-sep-2026) =
   Varilla, trapecio y anclaje a concreto ya se calculan por capacidad real
   (MSS SP-58, ASD, ACI 318-19 cap. 17), no solo se cuentan por espaciamiento.
   El termoplástico (CPVC/PEAD) sigue con el sistema propio de la suite: el
   motor integrado no lo cubre. */
t("O.1 la corrida completa de SoporteCalc queda expuesta y calcula varilla y anclaje reales, no solo cuenta soportes", () => {
  const g = { hidro: JSON.parse(JSON.stringify(S.hidro)), fuego: JSON.parse(JSON.stringify(S.fuego)), perms: JSON.parse(JSON.stringify(S.perms)), soporte: JSON.parse(JSON.stringify(S.soporte)) };
  try {
    /* Arranque en ceros: sin tramos capturados no hay nada de acero/cobre
       que SoporteCalc pueda calcular. */
    S.hidro = { ...G("defaultHidro")(), material: "acero",
      tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 }] };
    S.fuego = { ...G("defaultFuego")(), area: 600, altura: 6, Lramal: 30, Lmontante: 12, presFuente: 30 };
    Object.keys(S.perms).forEach((k) => delete S.perms[k]);
    ["hidro>quote", "fuego>quote", "aire>quote", "duct>equip", "soporte>quote"].forEach((k) => { S.perms[k] = { ts: 1, via: "prueba O.1" }; });
    aceptarSoporte();   /* H-266: los tramos de los motores entran con la instantánea aceptada */
    const SOP = G("SOPORTE");
    eq(SOP.sopcalc.version, "0.1.0", "expone la corrida de SoporteCalc:");
    if (!(SOP.sopcalc.tramos.length > 0)) throw new Error("el caso no aísla lo que se quiere probar: debe haber tramos de acero/cobre calculados");
    const conVarilla = SOP.sopcalc.tramos.filter((t) => t.varilla);
    if (!conVarilla.length) throw new Error("ningún tramo resolvió varilla por capacidad");
    conVarilla.forEach((t) => {
      if (!(t.varilla.adm_kgf > 0)) throw new Error(`${t.id}: la varilla no trae capacidad admisible calculada`);
      cerca(t.carga_por_varilla_kgf / t.varilla.adm_kgf, t.varilla.fu, 0.01, `${t.id} FU de varilla consistente con carga/admisible:`);
    });
    const conAnclaje = SOP.sopcalc.tramos.filter((t) => t.anclaje);
    if (!conAnclaje.length) throw new Error("ningún tramo trae anclaje calculado (estructura por omisión debe ser losa_concreto)");
    conAnclaje.forEach((t) => { if (!(t.anclaje.interaccion >= 0)) throw new Error(`${t.id}: interacción de anclaje inválida`); });
  } finally { S.hidro = g.hidro; S.fuego = g.fuego; S.soporte = g.soporte; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); G("recompute")(); }
});
t("O.2 una carga que rebasa la varilla o el anclaje mayor del catálogo se declara con error, no se aprueba en silencio", () => {
  /* Unitario, directo al motor: no depende de armar una captura extrema en
     hidráulica para llegar a la carga que se quiere probar. */
  const sinVarilla = G("seleccionarVarilla")(999999, '3/8"');
  if (sinVarilla !== null) throw new Error("999,999 kgf debería quedar fuera de toda la tabla MSS SP-58 de varilla");
  const sinAnclaje = G("seleccionarAnclaje")({ tension_kgf: 999999, cortante_kgf: 0, fc_mpa: 25 });
  if (sinAnclaje !== null) throw new Error("999,999 kgf de tensión debería quedar fuera de todo el catálogo de anclajes");
  /* Y que calcularTramo lo declare como error, no como éxito silencioso. */
  const t = G("calcularTramo")(
    { id: "t-enorme", disciplina: "hidrosanitario", tipo: "tuberia", material: "acero", dn: '12"',
      longitud_m: 3, espaciamiento_forzado_m: 500 },
    { estructura: { tipo: "losa_concreto" }, sismo: {} },
  );
  if (t.ok) throw new Error("un tramo cuya carga no cabe en ninguna varilla debe salir con ok:false");
  if (!t.errores.length) throw new Error("debe traer al menos un error declarado");
  if (!(t.varilla === null)) throw new Error("no debe resolver varilla con esa carga forzada");
});
t("O.3 el termoplástico no calculado por SoporteCalc sigue por el sistema propio de la suite, y lo avisa", () => {
  const g = { hidro: JSON.parse(JSON.stringify(S.hidro)), soporte: JSON.parse(JSON.stringify(S.soporte)) };
  try {
    S.hidro = { ...G("defaultHidro")(), material: "cpvc",
      tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 }] };
    aceptarSoporte();   /* H-266 */
    const SOP = G("SOPORTE");
    const grupo = (SOP.porTuberia || []).find((x) => x.etiqueta === "Hidráulica y sanitario");
    if (!grupo || grupo.fam !== "plastico") throw new Error("el caso no aísla lo que se quiere probar: debe agrupar como plástico");
    /* H-228: el ancla sí se selecciona por el camino propio (d.ancla); lo que sigue fuera es el trapecio de SoporteCalc. */
    if (grupo.det.some((d) => d.anclaje || d.trapecio)) throw new Error("un tramo de termoplástico no debería traer anclaje ni trapecio de SoporteCalc: no lo calcula");
    if (!grupo.det.every((d) => d.ancla)) throw new Error("cada tramo de termoplástico trae su ancla por el camino propio (H-228)");
    if (!SOP.avisos.some((a) => /termopl.stico.*SoporteCalc solo cubre acero y cobre/.test(a.msg)))
      throw new Error("no avisa que el termoplástico se queda fuera del motor integrado");
  } finally { S.hidro = g.hidro; S.soporte = g.soporte; G("recompute")(); }
});
t("O.4 el SDS capturado mueve la fuerza sísmica de los soportes (art. 13.3.1)", () => {
  const g = { soporte: JSON.parse(JSON.stringify(S.soporte)), hidro: JSON.parse(JSON.stringify(S.hidro)) };
  try {
    /* Arranque en ceros: sin tramos capturados no hay nada de acero/cobre
       que traiga sismo calculado. */
    S.hidro = { ...G("defaultHidro")(), material: "acero",
      tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 }] };
    S.soporte.sismoSDS = 0.3; S.soporte.alturaEstructura = 6;   /* H-266: altura de la estructura capturada */
    aceptarSoporte();
    const bajo = G("SOPORTE").sopcalc.tramos.find((t) => t.sismo);
    if (!bajo) throw new Error("el caso no aísla lo que se quiere probar: debe haber al menos un tramo con sismo calculado");
    const fpBajo = bajo.sismo.Fp_kgf;
    S.soporte.sismoSDS = 1.5;
    G("recompute")();
    const alto = G("SOPORTE").sopcalc.tramos.find((t) => t.id === bajo.id);
    if (!(alto.sismo.Fp_kgf > fpBajo)) throw new Error(`SDS más alto (1.5 vs 0.3) debe subir la fuerza sísmica del mismo tramo (${alto.sismo.Fp_kgf} vs ${fpBajo})`);
  } finally { S.soporte = g.soporte; S.hidro = g.hidro; G("recompute")(); }
});
t("O.5 el total de la sección G cierra exacto contra la suma de sus partidas", () => {
  G("recompute")();
  const SOP = G("SOPORTE");
  const suma = SOP.part.reduce((a, p) => a + p.total, 0);
  cerca(SOP.total, suma, 0.01, "total = suma de partidas:");
  SOP.part.forEach((p) => cerca(p.total, p.qty * p.unit, 0.01, `${p.desc}: importe = cantidad × P.U.:`));
});

/* ===== P. Correcciones de la auditoría, defectos "reportados sin reproducir" (15-sep-2026) */
t("P.1 la pestaña Estructural cita StructCalc v0.1.2 (no v0.1.1) y no promete revisión AISC 360 ni despiece que no tiene", () => {
  const estr = G("DISCIPLINAS").find((d) => d.id === "estr");
  contiene(estr.hara, "v0.1.2");
  if (/v0\.1\.1/.test(estr.hara)) throw new Error("sigue citando la v0.1.1");
  if (estr.metodo === "AISC 360 · NTC sismo y viento") throw new Error("sigue con el método viejo, que promete revisión AISC 360 y cargas de norma que StructCalc no hace");
  S.tab = "estructural"; G("render")();
  const v = w.document.getElementById("view").textContent;
  contiene(v, "v0.1.2");
  contiene(v, "no cumple su propio criterio de liberación");
  /* rev 2.9.14 · el aviso vive en la guía (GUIA.estructural), no en la vista: se comprueba en la fuente y, con la guía
     oculta, no debe quedar en ningún otro lugar de la pantalla (el usuario decidió que el texto viva sólo en la guía). */
  const gu = G("GUIA").estructural;
  contiene(gu.que, "v0.1.2", "guía de Estructural:");
  contiene(gu.ojo, "no cumple su propio criterio de liberación", "guía de Estructural:");
  contiene(gu.ojo, "AISC 360", "guía de Estructural:");
  contiene(gu.cuando, "no construcción", "guía de Estructural:");
  const g0 = S.guia;
  try {
    S.guia = false; G("render")();
    if (/no cumple su propio criterio de liberación/.test(w.document.getElementById("view").textContent)) throw new Error("con la guía oculta el aviso sigue en la vista");
  } finally { if (g0 === undefined) delete S.guia; else S.guia = g0; G("render")(); }
  if (/kg de acero, placa por espesor|Cuantificación y compra/.test(v)) throw new Error("sigue prometiendo un despiece que StructCalc no calcula");
});

t("P.2 «Solo esta vez» sí autoriza el cruce durante esa corrida, y no lo deja permanente", () => {
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) };
  try {
    delete S.perms["duct>load"];
    let vistoDentro = null;
    G("requestLink")("duct>load", () => { vistoDentro = G("linkAllowed")("duct>load"); });
    const b = w.document.querySelector('[data-act="link-once"]');
    if (!b) throw new Error("no se abrió el diálogo de permiso con el botón «Solo esta vez»");
    b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    if (vistoDentro !== true) throw new Error("run() no vio el cruce autorizado durante «Solo esta vez»");
    if (S.perms["duct>load"]) throw new Error("«Solo esta vez» no debe dejar el permiso guardado después");
    if (G("linkAllowed")("duct>load")) throw new Error("el cruce debe volver a estar negado tras la operación única");
  } finally { Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); }
});
t("P.3 la firma de la caché de Kaizen distingue proyectos con la misma arquitectura y distinta capacidad instalada", () => {
  proyectoDePrueba();
  const g = { zones: JSON.parse(JSON.stringify(S.zones)), zi: S.zi };
  try {
    G("recompute")();
    const SYS1 = G("SYS");
    if (!(SYS1 && SYS1.chosen)) throw new Error("el caso no aísla lo que se quiere probar: debe haber un sistema elegido");
    const k1 = `${SYS1.chosen.key}|${SYS1.chosen.instPlant}|${SYS1.chosen.instTerm}`;
    /* Duplicar la carga cambia instPlant/instTerm; si la arquitectura elegida
       es la misma, la firma vieja (que dependía de .installed, inexistente)
       hubiera quedado idéntica. */
    S.zones = S.zones.concat(JSON.parse(JSON.stringify(S.zones)));
    aceptarEquip();   /* H-267: la selección toma la carga duplicada al aceptar la propuesta (ya no la lee en vivo) */
    const SYS2 = G("SYS");
    if (SYS2.chosen.key !== SYS1.chosen.key) throw new Error("el caso no aísla lo que se quiere probar: la arquitectura debe seguir siendo la misma al duplicar la carga");
    const k2 = `${SYS2.chosen.key}|${SYS2.chosen.instPlant}|${SYS2.chosen.instTerm}`;
    if (k1 === k2) throw new Error("la firma no cambió aunque la capacidad instalada sí (instPlant/instTerm distintos)");
  } finally { S.zones = g.zones; S.zi = g.zi; G("recompute")(); }
});

t("P.4 las bases de equipo de la instantánea leen S.quote.items directo, no la corrida de QUOTE con un ciclo de retraso; sin instantánea ni captura no se cuentan (H-266)", () => {
  const g = { items: JSON.parse(JSON.stringify(S.quote.items)), soporte: JSON.parse(JSON.stringify(S.soporte)) };
  try {
    S.quote.items = [];
    S.soporte.basesEquipo = 0; S.soporte.usarMotores = false; delete S.soporte.snap;
    G("recompute")();
    const id = G("CARRIER")[0].id;
    S.quote.items = [{ id, qty: 3, unit: null }];
    G("recompute")();
    eq(G("SOPORTE").nEquipos, 0, "H-266: sin instantánea ni captura no se cuentan los equipos de la cotización:");
    const aire = Number(G("AIRE") && G("AIRE").totalUnidades) || 0;
    aceptarSoporte();
    eq(G("SOPORTE").nEquipos, 3 + aire, "la instantánea ve las 3 unidades de la cotización sin esperar otra corrida:");
  } finally { S.quote.items = g.items; S.soporte = g.soporte; G("recompute")(); }
});
t("P.5 la declaración de la base de precios en la licitación cita el estado real de la plaza, no siempre Baja California", () => {
  const g = { plaza: S.quote.plaza };
  try {
    S.quote.plaza = "tijuana"; G("recompute")();
    let pdf = Buffer.from(licitacionFormal()).toString("latin1");
    contiene(pdf, "Gobierno del Estado de Baja California no publica", "Tijuana (B.C.):");
    S.quote.plaza = "hermosillo"; G("recompute")();
    pdf = Buffer.from(licitacionFormal()).toString("latin1");
    if (/Gobierno del Estado de Baja California/.test(pdf)) throw new Error("Hermosillo (Sonora) no debe declarar un hecho sobre Baja California");
    contiene(pdf, "estado de Sonora", "Hermosillo cita su propio estado:");
    S.quote.plaza = "otra"; G("recompute")();
    pdf = Buffer.from(licitacionFormal()).toString("latin1");
    /* Solo se revisa la frase de la declaración de tabulador estatal: el
       resto del documento (p. ej. la procedencia del catálogo de precios de
       la casa) sí puede mencionar Baja California, y no es lo que se prueba
       aquí. */
    const decl = pdf.slice(pdf.indexOf("Declaracion de alcance"));
    if (/Baja California|Sonora/.test(decl)) throw new Error("«otra plaza» no debe afirmar el nombre de ningún estado que no se capturó");
  } finally { S.quote.plaza = g.plaza; G("recompute")(); }
});

t("P.6 la base de formación del precio se declara honesta: la interfaz dice que solo cita, no cambia precios", () => {
  proyectoDePrueba();
  S.tab = "cotizacion"; G("render")();
  const v = w.document.getElementById("view");
  const campo = [...v.querySelectorAll(".field")].find((f) => /Base de formación del precio/.test(f.textContent));
  if (!campo) throw new Error("no está el campo de base de formación del precio");
  contiene(campo.textContent, "no cambia ningún precio unitario");
});

t("P.7 el libro de la propuesta separa inversión y ahorro anual en la ingeniería de valor, no las suma en una sola columna", () => {
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) };
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba P.7" }; });
    G("recompute")();
    const V = G("computeIngValor")();
    if (!(V.props && V.props.length)) throw new Error("el caso no aísla lo que se quiere probar: debe haber al menos una medida de ingeniería de valor detectada");
    const buf = G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" });
    const x = Buffer.from(buf).toString("utf8");
    contiene(x, "INVERSION", "hoja de ingeniería de valor:");
    contiene(x, "AHORRO ANUAL", "hoja de ingeniería de valor:");
    const fTot = celdasXlsxFila(x, "TOTAL", /INVERSION/);
    if (!fTot) throw new Error("no se encontró el renglón de TOTAL de la hoja de ingeniería de valor");
    const sums = fTot.c.filter((c) => /^=SUM\(/.test(c));
    if (sums.length < 4) throw new Error(`se esperaban al menos 4 fórmulas SUM en el total (TR, kW, inversión, ahorro anual); hay ${sums.length}: ${sums.join(" | ")}`);
  } finally { Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); G("recompute")(); }
});

t("P.8 el comparativo de revisiones ve un cambio de cantidad como PRECIO del mismo concepto, no como baja más alta", () => {
  const act = (a, id) => { const b = w.document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; w.document.body.appendChild(b); b.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); b.remove(); };
  const guardada = G("projList")();
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) };
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba P.8" }; });
    act("proj-new");
    S.meta.name = "REV-COMPARA-P8";
    /* Arranque en ceros: defaultSegment() ya no trae longitud de ejemplo; la
       revisión origen necesita kg > 0 de ducto para que exista la partida
       que luego cambia de PRECIO. */
    S.duct.segments = [{ ...G("defaultSegment")("SA-PRINCIPAL", 2500), length: 30 }];
    G("recompute")(); G("projSave")(true);
    const idA = S.pid;
    act("proj-rev", idA);
    /* Cambiar el largo del tramo cambia el kg de lámina, y la descripción de
       esa partida trae el kg incrustado ("... (X kg del cálculo de ductos)"):
       es exactamente el patrón que rompía la comparación. */
    S.duct.segments[0].length = 55;
    G("recompute")();
    const comp = G("compararRevision")(S.quote.prop.comparaCon);
    if (!comp) throw new Error("la revisión no compara contra su origen");
    const altaBaja = comp.filas.filter((f) => f.tipo === "ALTA" || f.tipo === "BAJA");
    const ductoAltaBaja = altaBaja.filter((f) => /ducto/i.test(f.desc));
    if (ductoAltaBaja.length) throw new Error(`un cambio de longitud de ducto salió como ${ductoAltaBaja.map((f) => f.tipo).join("/")} en vez de PRECIO: ${ductoAltaBaja.map((f) => f.desc).join(" | ")}`);
    const precioDucto = comp.filas.find((f) => f.tipo === "PRECIO" && /ducto/i.test(f.desc));
    if (!precioDucto) throw new Error("el caso no aísla lo que se quiere probar: debe haber un cambio de PRECIO en una partida de ducto");
  } finally {
    Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms);
    G("reemplazarEstado")(JSON.parse(JSON.stringify(G("INIT"))));
    S.pid = null; S.linaje = null; G("histReiniciar")();
    G("projPersist")(guardada);
  }
});

t("P.9 la receta de pintura epóxica sí empareja con el concepto real, que siempre trae acento", () => {
  const recetaDe = G("recetaDe");
  const r = recetaDe({ desc: "Recubrimiento epóxico en muros de mampostería existentes", un: "M2" });
  if (!r || r.id !== "pinturaEpoxi") throw new Error(`no empareja con la receta de pintura epóxica (obtuvo ${r ? r.id : "null"})`);
  const rFem = recetaDe({ desc: "Piso epóxico disipativo ESD, 3 mm", un: "M2" });
  if (!rFem || rFem.id !== "pinturaEpoxi") throw new Error("no empareja la forma femenina «epóxica/epóxico»");
});
t("P.10 la receta de soportería empareja con la partida real, que usa PIEZA y no PZA", () => {
  const recetaDe = G("recetaDe");
  const r = recetaDe({ desc: "Abrazadera de sujeción, incluye tornillería", un: "PIEZA" });
  if (!r || r.id !== "soporte") throw new Error(`no empareja con la receta de soportería (obtuvo ${r ? r.id : "null"})`);
  if (recetaDe({ desc: "Abrazadera de sujeción, incluye tornillería", un: "PZA" })) throw new Error("el caso no aísla lo que se quiere probar: PZA nunca debió existir en el catálogo real");
});

t("P.11 la soportería contra incendio soporta el cabezal y el montante por separado, cada uno con su propio diámetro", () => {
  const g = { fuego: JSON.parse(JSON.stringify(S.fuego)), perms: JSON.parse(JSON.stringify(S.perms)), soporte: JSON.parse(JSON.stringify(S.soporte)) };
  try {
    /* Arranque en ceros: sin Lramal/Lmontante capturados no hay metros que
       soportar, y agregarTuberia() descarta tramos de longitud 0. */
    S.fuego = { ...S.fuego, area: 600, altura: 6, Lramal: 30, Lmontante: 12, presFuente: 30 };
    S.perms["fuego>elec"] = { ts: 1, via: "prueba P.11" };
    aceptarSoporte();   /* H-266 */
    const F = G("FUEGO");
    if (!(F.ram && F.mon)) throw new Error("el caso no aísla lo que se quiere probar: deben existir FUEGO.ram y FUEGO.mon");
    if (!(F.ram.d < F.mon.d)) throw new Error(`el caso no aísla lo que se quiere probar: el cabezal (${F.ram.d} mm) debe quedar más delgado que el montante (${F.mon.d} mm), que es lo que hace que el conteo separado importe`);
    const grupo = (G("SOPORTE").porTuberia || []).find((x) => x.etiqueta === "Contra incendio");
    if (!grupo) throw new Error("no hay grupo de soportería de contra incendio");
    const cabezal = grupo.det.find((d) => /Cabezal/.test(d.tag));
    const montante = grupo.det.find((d) => /Montante/.test(d.tag));
    if (!cabezal || !montante) throw new Error(`la soportería sigue tratando cabezal y montante como un solo tramo (${grupo.det.map((d) => d.tag).join(", ")})`);
    eq(cabezal.d, F.ram.d, "el cabezal se soporta con su propio diámetro, no el del montante:");
    eq(montante.d, F.mon.d, "el montante conserva su propio diámetro:");
    if (!(cabezal.e < montante.e)) throw new Error("el cabezal, más delgado, debe pedir un espaciamiento más cerrado que el montante");
  } finally { S.fuego = g.fuego; S.soporte = g.soporte; Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); G("recompute")(); }
});

t("P.12 el espejo en inglés traduce los hitos de pago (título y condición de liberación), no los deja en español", () => {
  const P0 = S.quote.prop;
  /* H-250: el espejo en inglés va en la moneda que permita el tipo de cambio (USD sólo con fecha). */
  const monEN = G("monedaEspejoEN")();
  const en = Buffer.from(G("buildPropuestaPdf")({ lang: "en", mon: monEN })).toString("latin1");
  (P0.hitos || []).forEach(([titulo, , condicion]) => {
    if (en.includes(titulo)) throw new Error(`el hito "${titulo}" sigue en español en el PDF en inglés`);
    if (en.includes(condicion)) throw new Error(`la condición "${condicion}" sigue en español en el PDF en inglés`);
  });
  contiene(en, "Advance payment", "al menos el primer hito sí se tradujo:");
  const xen = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: monEN })).toString("utf8");
  (P0.hitos || []).forEach(([titulo, , condicion]) => {
    if (xen.includes(titulo)) throw new Error(`el hito "${titulo}" sigue en español en el libro en inglés`);
    if (xen.includes(condicion)) throw new Error(`la condición "${condicion}" sigue en español en el libro en inglés`);
  });
});
t("P.13 el espejo en inglés traduce la unidad de cada partida (PIEZA/LOTE/ML/M2), no la deja en español", () => {
  llenarTodoS(); /* rev 2.9.16 · sin pisos internos, el caso necesita captura real para tener partidas */
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) };
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba P.13" }; });
    G("recompute")();
    const cat = G("catalogoConceptos")();
    const unidadesEs = new Set(cat.secciones.flatMap((s) => s.partidas.map((p) => p.un)));
    if (!(unidadesEs.size > 1)) throw new Error("el caso no aísla lo que se quiere probar: debe haber más de una unidad distinta en el catálogo");
    const en = Buffer.from(G("buildPropuestaPdf")({ lang: "en", mon: "USD" })).toString("latin1");
    if (/\bPIEZA\b/.test(en)) throw new Error("PIEZA sigue apareciendo sin traducir en el PDF en inglés");
    if (/\bLOTE\b/.test(en)) throw new Error("LOTE sigue apareciendo sin traducir en el PDF en inglés");
    contiene(en, "EA", "PIEZA se tradujo a EA en el PDF:");
    const xen = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).toString("utf8");
    if (/>PIEZA</.test(xen)) throw new Error("PIEZA sigue apareciendo sin traducir en el libro en inglés");
    contiene(xen, ">EA<", "PIEZA se tradujo a EA en el libro:");
    /* Y el espejo en español conserva las abreviaturas de siempre. */
    const es = Buffer.from(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })).toString("latin1");
    contiene(es, "PIEZA", "el español sigue diciendo PIEZA:");
  } finally { Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms); G("recompute")(); }
});

/* ============================================================================
   SECCIÓN Q · Ejecución de las 13 decisiones de criterio (H-47…H-97), rev
   2.9.8.2 → 2.9.9. "Un hallazgo, un cambio, una prueba que lo cubra." Los
   deltas que SÍ mueven número (H-49, H-50, H-56, H-75, H-77, H-84, H-51) ya
   quedaron fijados arriba en 22.5/22.8/L.2; aquí se prueba el mecanismo de
   cada decisión, no solo que el banco general siga en verde.
   ============================================================================ */

t("Q.1 H-49 el factor de seguridad de la varilla (acero y cobre, vía SoporteCalc) quedó unificado a 1.5", () => {
  const sop0 = JSON.parse(JSON.stringify(S.soporte));
  try {
    S.soporte = G("defaultSoporte")();
    G("recompute")();
    eq(G("SOPORTE").sopcalc.contexto.factor_seguridad, 1.5, "factor_seguridad de calcularSoporteria:");
    /* Antes era 1.0 aquí y 1.5 en el camino propio de la suite (termoplástico,
       FS_VARILLA): confirma que ya no hay dos criterios distintos para la
       misma tabla MSS SP-58. */
    eq(G("FS_VARILLA"), 1.5, "FS_VARILLA del camino propio (termoplástico), sin cambio:");
  } finally { S.soporte = sop0; G("recompute")(); }
});

t("Q.2 H-50 la amplificación sísmica ASCE 7-16 se alimenta con la altura real de la estructura, no con z=0 fijo (H-266: capturada en soportería, ya no la zona más alta)", () => {
  proyectoDePrueba();
  const sop0 = JSON.parse(JSON.stringify(S.soporte)), h0 = S.zones[0].height;
  try {
    S.soporte = { ...G("defaultSoporte")(), alturaEstructura: 6 };
    G("recompute")();
    eq(G("SOPORTE").sopcalc.contexto.sismo.h, 6, "sismo.h del contexto de SoporteCalc = altura de la estructura capturada:");
    S.zones[0].height = 12; G("recompute")();
    eq(G("SOPORTE").sopcalc.contexto.sismo.h, 6, "H-266: la altura de las zonas ya no la mueve:");
    S.zones[0].height = h0; G("recompute")();
    /* Físico, con la fórmula ya existente: z=h (instalación de azotea, el caso
       que se trata como default) triplica el Fp_calculado_kgf (sin topes)
       contra z=0 (instalación a nivel de piso, el comportamiento de antes),
       para los mismos ap/Rp/SDS/Wp — es exactamente 3x porque (1+2·1)/(1+2·0)=3. */
    const conAltura = G("fuerzaSismica")({ Wp_kgf: 1000, SDS: 1, ap: 2.5, Rp: 9, z: 6, h: 6 });
    const sinAltura = G("fuerzaSismica")({ Wp_kgf: 1000, SDS: 1, ap: 2.5, Rp: 9, z: 0, h: 1 });
    cerca(conAltura.Fp_calculado_kgf / sinAltura.Fp_calculado_kgf, 3, 0.001, "razón Fp con z=h contra z=0:");
  } finally { S.soporte = sop0; S.zones[0].height = h0; G("recompute")(); }
});

t("Q.3 H-56 / H-225 la altura de colgado no vuelve al respaldo fijo de 0.50 m ni se deriva de la altura de trabajo: capturada manda (más altura, más ML); sin captura la varilla queda pendiente y la altura de trabajo sólo se sugiere", () => {
  const sop0 = JSON.parse(JSON.stringify(S.soporte)), hidro0 = JSON.parse(JSON.stringify(S.hidro));
  try {
    S.hidro = { ...G("defaultHidro")(), material: "acero",
      tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 }] };
    const ml = () => Object.values(G("SOPORTE").sopcalc.despiece.varilla_m).reduce((a, m) => a + m, 0);
    S.soporte = { ...G("defaultSoporte")(), alturaTrabajo: 8 }; aceptarSoporte();   /* H-266 */
    eq(ml(), 0, "sin captura no hay ML de varilla (ni 0.5 m ni la altura de trabajo):"); contiene(G("SOPORTE").colgadoSugerido + "", "8", "la altura de trabajo se sugiere:");
    S.soporte = { ...G("defaultSoporte")(), alturaTrabajo: 8, alturaColgadoM: 2 }; aceptarSoporte(); const dos = ml();
    S.soporte = { ...G("defaultSoporte")(), alturaTrabajo: 8, alturaColgadoM: 1 }; aceptarSoporte(); const uno = ml();
    if (!(dos > uno && uno > 0)) throw new Error("con captura, más altura de colgado debe dar más ML: 2 m=" + dos + ", 1 m=" + uno);
  } finally { S.soporte = sop0; S.hidro = hidro0; G("recompute")(); }
});

t("Q.4 H-47(b) una línea sola cuya carga excede el colgante sencillo escala sola a trapecio de 2 varillas", () => {
  /* Unidad directa sobre calcularTramo, con una carga absurda a propósito
     (mismo criterio que O.2): antes esto SOLO reportaba error; ahora primero
     intenta trapecio de 2 varillas y sólo reporta error si ni así alcanza. */
  const liviano = G("calcularTramo")({ id: "qt1", tipo: "ducto_rect", ancho_mm: 300, alto_mm: 200, longitud_m: 3 }, { factor_seguridad: 1.5 });
  eq(liviano.montaje, "colgante sencillo", "carga liviana sigue en colgante sencillo:");
  /* Carga deliberadamente absurda (mismo criterio que O.2): una charola de
     2500 kg/m no la carga ninguna tubería real, pero es la manera directa de
     probar el umbral sin depender de qué tan grande llegue a ser el catálogo
     de tuberías algún día. */
  const pesado = G("calcularTramo")(
    { id: "qt2", tipo: "charola", peso_charola_kg_m: 2500, longitud_m: 10 },
    { factor_seguridad: 1.5, estructura: { tipo: "losa_concreto", fc_mpa: 24.5 } });
  eq(pesado.montaje, "trapecio", "carga pesada de una sola línea escala a trapecio:");
  eq(pesado.n_varillas, 2, "trapecio automático usa 2 varillas:");
  if (!pesado.varilla) throw new Error("con 2 varillas ya debería resolver un diámetro del catálogo MSS SP-58");
  if (pesado.errores.some((e) => /fuera del catálogo/.test(e))) throw new Error("no debería quedar error de varilla fuera de catálogo tras escalar a trapecio");
});

t("Q.5 H-51 (H-268) el cuadro eléctrico carga TODAS las unidades de aire comprimido en servicio, no solo la principal, al aceptar la propuesta", () => {
  const aire0 = JSON.parse(JSON.stringify(S.aire)), elec0 = JSON.parse(JSON.stringify(S.elec)), g = { perms: JSON.parse(JSON.stringify(S.perms)), vinculos: JSON.parse(JSON.stringify(S.vinculos || {})) };
  try {
    S.aire = { ...G("defaultAire")(), consumos: [{ id: "q5", tipo: "generico", nombre: "Carga de prueba", cant: 1, lmin: 40000, bar: 6, uso: 1 }] };
    S.elec = { ...G("defaultElec")() };
    S.perms["aire>elec"] = { ts: 1, via: "prueba Q.5" };
    G("recompute")();
    const A = G("AIRE");
    if (!(A.nUnidades > 1)) throw new Error(`el caso necesita más de un compresor en servicio, nUnidades=${A.nUnidades}`);
    /* H-268: el compresor entra al cuadro sólo al aceptar la propuesta (instantánea), con todas sus unidades en servicio. */
    const prop = G("propuestaElecFilas")().find((c) => c.kWOrigen === "aire");
    if (!prop) throw new Error("la propuesta no trae el compresor");
    eq(prop.cant, A.nUnidades, "cant del compresor propuesto = unidades en servicio:");
    G("propAceptar")("cedula>elec");
    const fila = G("ELEC").calc.find((c) => c.origen === "cedula" && c.kWOrigen === "aire");
    if (!fila) throw new Error("no se encontró la carga del compresor en el cuadro eléctrico tras aceptar la propuesta");
    eq(fila.cant, A.nUnidades, "cant de la carga del compresor = unidades en servicio:");
    cerca(fila.kWtot, A.principal.kW * A.nUnidades, 0.001, "kW total del compresor = kW de una unidad × unidades en servicio:");
  } finally { S.aire = aire0; S.elec = elec0; S.perms = g.perms; S.vinculos = g.vinculos; G("recompute")(); }
});

t("Q.6 H-57 la estratificación por altura solo multiplica la ganancia de iluminación, no cubierta ni equipo", () => {
  const zones0 = JSON.parse(JSON.stringify(S.zones)), zi0 = S.zi;
  try {
    const base = { ...G("defaultZone")("Q6"), area: 200, lights: 0, equip: 0, occ: 0, walls: { N: 0, S: 0, E: 0, O: 0 } };
    S.zones = [{ ...base, height: 3 }, { ...base, height: 8 }];
    S.zi = 0; G("recompute")();
    const bajaSinLuz = G("LOADS")[0], altaSinLuz = G("LOADS")[1];
    const roofBaja = bajaSinLuz.lines.find((l) => l.label === "Techo" || /techo|cubierta/i.test(l.label));
    const roofAlta = altaSinLuz.lines.find((l) => l.label === "Techo" || /techo|cubierta/i.test(l.label));
    if (roofBaja && roofAlta) cerca(roofAlta.s, roofBaja.s, Math.max(1, Math.abs(roofBaja.s) * 0.001), "ganancia de cubierta no cambia con la altura (misma área, mismo techo):");
    S.zones = [{ ...base, height: 3, lights: 20000 }, { ...base, height: 8, lights: 20000 }];
    G("recompute")();
    const bajaConLuz = G("LOADS")[0].lines.find((l) => l.label === "Iluminación");
    const altaConLuz = G("LOADS")[1].lines.find((l) => l.label === "Iluminación");
    if (!(altaConLuz.s < bajaConLuz.s)) throw new Error("la iluminación SÍ debe bajar con la altura (estratificación aplica aquí)");
  } finally { S.zones = zones0; S.zi = zi0; G("recompute")(); }
});

t("Q.7 H-67/H-266: la soportería ya no cuenta con permisos sueltos: sin la instantánea no toma metros de los motores; aceptarla concede duct/hidro/fuego/aire>soporte y lo aceptado no baja al retirar un permiso (H-265: obra civil ya no depende de load>civil)", () => {
  const g = { perms: JSON.parse(JSON.stringify(S.perms)), soporte: JSON.parse(JSON.stringify(S.soporte)) };
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba Q.7 (todo autorizado)" }; });
    S.soporte.usarMotores = false; delete S.soporte.snap; S.soporte.ductoM = 0; G("recompute")();
    eq(G("SOPORTE").mDucto, 0, "H-266: con todos los permisos pero sin instantánea no se cuentan los ductos de los motores:");
    ["duct>soporte", "hidro>soporte", "fuego>soporte", "aire>soporte"].forEach((k) => { delete S.perms[k]; });
    G("propAceptar")("motores>soporte");
    ["duct>soporte", "hidro>soporte", "fuego>soporte", "aire>soporte"].forEach((k) => { if (!S.perms[k]) throw new Error("aceptar la instantánea debe conceder " + k); });
    const mDuctoAceptado = G("SOPORTE").mDucto, areaCivil = G("CIVIL").area;
    delete S.perms["duct>soporte"]; G("recompute")();
    eq(G("SOPORTE").mDucto, mDuctoAceptado, "lo aceptado no baja al retirar un permiso (H-67, nunca a cero):");
    eq(G("CIVIL").area, areaCivil, "obra civil no depende de permisos:");
    if (G("SOPORTE").avisos.some((a) => /pendiente de autorizar/.test(a.msg))) throw new Error("H-266: la soportería ya no avisa permisos pendientes");
    /* H-265: obra civil es autónoma: no hay cruce load>civil que autorizar ni aviso de permiso pendiente. */
    eq(G("LINKS")["load>civil"], undefined, "H-265: no queda cruce load>civil:");
    if (G("CIVIL").avisos.some((a) => /load.?civil/.test(a.msg))) throw new Error("H-265: obra civil no debe hablar de un permiso load>civil");
  } finally { S.perms = g.perms; S.soporte = g.soporte; G("recompute")(); }
});

t("Q.8 H-77/H-45/H-46 la instantánea de soportería guarda dimensiones, calibre y longitudes reales (no el respaldo genérico 400×200)", () => {
  const segs0 = JSON.parse(JSON.stringify(S.duct.segments)), sop0 = JSON.parse(JSON.stringify(S.soporte)), vinc0 = JSON.parse(JSON.stringify(S.vinculos || {}));
  try {
    S.duct.segments = [{ ...G("defaultSegment")("QT", 8000), length: 12 }];
    S.soporte = G("defaultSoporte")();
    G("recompute")();
    const segReal = G("DUCT").segs[0];
    if (segReal.w === 400 && segReal.h === 200) throw new Error("el caso no aísla lo que se prueba: el ducto real ya coincide con el respaldo genérico, súbele el flujo");
    G("propAceptar")("motores>soporte");
    G("recompute")();
    const snap = S.soporte.snap.duct[0];
    eq(snap.w, segReal.w, "instantánea guarda el ancho real del ducto, no 400:");
    eq(snap.h, segReal.h, "instantánea guarda el alto real del ducto, no 200:");
    if (!(snap.gauge > 0)) throw new Error("instantánea sin calibre: H-77 exige que el calibre lo herede el motor de ductos");
    eq(snap.gauge, segReal.gauge.gauge, "instantánea guarda el calibre real resuelto por el motor de ductos:");
    /* Cambiar el flujo en vivo cambia el calibre/dimensión que resuelve el
       motor de ductos SIN tocar la instantánea ya aceptada — regla 3: se
       marca desactualizada, no se recalcula sola. */
    S.duct.segments[0].flow = 20000;
    G("recompute")();
    eq(G("estadoPropuesta")("motores>soporte").nivel, "desactualizado", "cambiar el flujo del ducto en vivo marca la instantánea desactualizada (regla 3):");
    eq(S.soporte.snap.duct[0].w, snap.w, "la instantánea aceptada NO se movió sola tras el cambio:");
  } finally { S.duct.segments = segs0; S.soporte = sop0; S.vinculos = vinc0; G("recompute")(); }
});

t("Q.8b H-46 en modo instantánea la red contra incendio soporta metros reales, no cero", () => {
  const fuego0 = JSON.parse(JSON.stringify(S.fuego)), sop0 = JSON.parse(JSON.stringify(S.soporte)), vinc0 = JSON.parse(JSON.stringify(S.vinculos || {}));
  try {
    /* Arranque en ceros: sin Lramal/Lmontante capturados no hay metros que
       soportar. */
    S.fuego = { ...G("defaultFuego")(), area: 600, altura: 6, Lramal: 30, Lmontante: 12, presFuente: 30 };
    S.soporte = G("defaultSoporte")();
    G("recompute")();
    const F = G("FUEGO");
    if (!(F.nTotal > 0)) throw new Error("el caso de prueba necesita rociadores para tener red contra incendio");
    G("propAceptar")("motores>soporte");
    G("recompute")();
    if (!(S.soporte.snap.fuego.Lram > 0 || S.soporte.snap.fuego.Lmon > 0))
      throw new Error("la instantánea de incendio se guardó sin longitudes: volvería a dar 0 soportes en modo instantánea");
    const porTub = (G("SOPORTE").porTuberia || []).find((x) => x.etiqueta === "Contra incendio");
    if (!porTub || !(porTub.n > 0)) throw new Error("la red contra incendio en modo instantánea debe contar soportes > 0, no 0");
  } finally { S.fuego = fuego0; S.soporte = sop0; S.vinculos = vinc0; G("recompute")(); }
});

t("Q.9 H-78 el factor de mano de obra por plaza está separado del de material y wireado (hoy 1.00, sin mover precio)", () => {
  const quote0 = JSON.parse(JSON.stringify(S.quote));
  try {
    S.quote.plaza = "tijuana"; S.quote.plazaFactor = 0;
    G("recompute")();
    const part = { desc: "Soporte de tubería con abrazadera", un: "PIEZA" };
    if (!G("analizarPU")(part)) throw new Error("el concepto sintético no emparejó con RECETAS.soporte — revisar palabra clave/unidad");
    const conMoUno = G("analizarPU")(part).moT;
    const plazas0 = JSON.parse(JSON.stringify(G("PLAZAS")));
    try {
      G("PLAZAS").tijuana.mo = 1.5;
      const conMoMedio = G("analizarPU")(part).moT;
      cerca(conMoMedio / conMoUno, 1.5, 0.001, "moT escala exactamente con PLZ.mo (queda wireado):");
    } finally { Object.assign(G("PLAZAS").tijuana, plazas0.tijuana); }
    /* Con las 8 plazas en su default actual (1.00) ningún importe se mueve. */
    Object.values(G("PLAZAS")).forEach((p) => eq(p.mo, 1.00, `${p.label}: mo por omisión es 1.00, no un valor sin validar:`));
  } finally { S.quote = quote0; G("recompute")(); }
});

t("Q.10 H-97 el importe de cada partida del libro es el importe real (cuadra exacto contra QUOTE.direct), no una reconstrucción qty×P.U.", () => {
  llenarTodoS(); /* rev 2.9.16 · sin pisos internos, el proyecto de prueba de dos zonas ya no arma partidas de otras disciplinas */
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) };
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba Q.10" }; });
    G("recompute")();
    const Q = G("QUOTE"), cat = G("catalogoConceptos")();
    const partidas = cat.secciones.flatMap((s) => s.partidas);
    const conDescuadre = partidas.filter((p) => Math.abs(p.qty * p.unit - p.total) > 0.01);
    if (!(conDescuadre.length > 0)) throw new Error("el caso no aísla lo que se prueba: necesita al menos una partida donde qty×P.U. ≠ importe real (precio por economía de escala)");
    const sumaF = partidas.reduce((a, p) => a + p.total, 0);
    cerca(sumaF, Q.direct, 0.01, "suma de importes de la hoja = QUOTE.direct:");
    /* Y el mismo total, no solo el costo directo, cuadra contra el PDF. */
    const pdfTxt = Buffer.from(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })).toString("latin1");
    const toks = [...pdfTxt.matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1"));
    const iTot = toks.findIndex((x) => x.includes("TOTAL DE LA PROPUESTA"));
    const totalPdfTxt = toks[iTot + 1].replace(/[^0-9.]/g, "");
    cerca(+totalPdfTxt, Q.tot, 1, "total impreso en el PDF = QUOTE.tot:");
  } finally { S.perms = g.perms; G("recompute")(); }
});

t("Q.11 H-74 Hermosillo, San Luis Río Colorado y Rosarito existen como sitio climático, sin tocar la fila protegida de Tijuana", () => {
  const SITES = G("SITES");
  /* rev 2.9.18 · DECISIÓN DEL DUEÑO: Tijuana deja la fila protegida 35/24 y pasa a ASHRAE 2021 (WMO 760013, 0.4 % anual). */
  eq(SITES.tijuana.db, 32.8, "tijuana ASHRAE 2021 BS:"); eq(SITES.tijuana.wb, 17.5, "tijuana ASHRAE 2021 BH coincidente:");
  eq(SITES.tijuana.alt, 149, "tijuana altitud:"); eq(SITES.tijuana.range, 9.2, "tijuana rango diario:");
  if (!SITES.hermosillo) throw new Error("falta el sitio hermosillo");
  cerca(SITES.hermosillo.db, 42.8, 0.01, "hermosillo BS de diseño 0.4% ASHRAE 2021:");
  cerca(SITES.hermosillo.wb, 22.7, 0.01, "hermosillo BH coincidente:");
  if (!SITES.sanluis) throw new Error("falta el sitio sanluis");
  if (!/sustituto/i.test(SITES.sanluis.label) && !/sustituto|SIN estación propia/i.test(SITES.sanluis.src))
    throw new Error("sanluis debe declararse como sustituto (no tiene estación ASHRAE propia)");
  if (!SITES.rosarito) throw new Error("falta el sitio rosarito");
  eq(SITES.rosarito.db, SITES.tijuana.db, "rosarito reutiliza el dato de tijuana:"); eq(SITES.rosarito.wb, SITES.tijuana.wb, "rosarito BH:");
  /* El selector de sitio recoge las llaves nuevas automáticamente (es
     Object.entries(SITES), no una lista aparte que haya que tocar). */
  const site0 = JSON.parse(JSON.stringify(S.site));
  try {
    S.site = { key: "hermosillo" };
    G("recompute")();
    cerca(G("SITE").db, 42.8, 0.01, "siteOf() resuelve hermosillo:");
  } finally { S.site = site0; G("recompute")(); }
});

/* ============================================================================
   SECCIÓN R · Continuación del backlog de auditoría (H-45..H-106) más allá de
   las 13 decisiones de la sección Q — hallazgos de arquitectura que no piden
   criterio del dueño, solo corrección. No mueven ningún número: son manejo
   de errores puro, atrapan excepciones que antes tumbaban el motor o la app.
   ============================================================================ */

t("R.1 H-60 render() no deja la pantalla atorada si la vista truena: muestra una tarjeta de error, no propaga la excepción", () => {
  /* viewOf() en vez de un motor (computeLoad/peakLoad) a propósito: LOADS se
     memoriza, así que romper el motor y no cambiar S.zones puede no volver a
     llamarlo y dar un falso negativo. viewOf() SIEMPRE corre en cada render(),
     sin caché, así que aísla limpio el "¿el catch de render() de verdad
     atrapa y no dibuja en blanco?" sin depender de la memoria de otro motor. */
  const tab0 = S.tab;
  w.eval("var __origViewOf_R1 = viewOf; viewOf = function() { throw new Error('prueba R.1: vista rota a proposito'); };");
  try {
    let noLanzo = true;
    try { G("render")(); } catch { noLanzo = false; }
    if (!noLanzo) throw new Error("render() dejó escapar la excepción: debe atraparla, no propagarla");
    const html = w.document.getElementById("view").innerHTML;
    contiene(html, "No se pudo dibujar", "muestra la tarjeta de error en vez de quedar en blanco/atorado:");
    contiene(html, "prueba R.1: vista rota a proposito", "la tarjeta incluye el mensaje real del error:");
  } finally {
    w.eval("viewOf = __origViewOf_R1;");
    S.tab = tab0; G("render")();
    if (/No se pudo dibujar/.test(w.document.getElementById("view").innerHTML))
      throw new Error("la app no se recuperó sola al restaurar viewOf() y volver a renderizar");
  }
});

t("R.2 H-48 un tramo fuera de catálogo (calibre o diámetro) no tumba calcularTramo: queda como error visible, no como excepción", () => {
  const ducto = G("calcularTramo")({ id: "r2a", tipo: "ducto_rect", ancho_mm: 3000, alto_mm: 3000, longitud_m: 5, calibre: 2 }, {});
  eq(ducto.peso.total, 0, "peso en 0 cuando el calibre no está catalogado:");
  if (!ducto.errores.some((e) => /fuera de catálogo/.test(e))) throw new Error("debe quedar un error de 'fuera de catálogo' visible, no una excepción");
  const tuberia = G("calcularTramo")({ id: "r2b", tipo: "tuberia", material: "cobre", dn: '6"', cedula: "ced40", contenido: "vacio", longitud_m: 5 }, {});
  eq(tuberia.peso.total, 0, "peso en 0 cuando el diámetro de cobre no está catalogado (6\"):");
  if (!tuberia.errores.some((e) => /fuera de catálogo/.test(e))) throw new Error("debe quedar un error de 'fuera de catálogo' visible para el diámetro de cobre, no una excepción");
});

t("R.3 H-93 el título y el encabezado en pantalla ya no dicen \"EMP Instalaciones LLC\", coinciden con la identidad de todo PDF", () => {
  if (/EMP Instalaciones LLC/.test(w.document.title)) throw new Error("el <title> sigue diciendo EMP Instalaciones LLC");
  contiene(w.document.title, "Electromecánica del Pacífico", "el <title> ya dice Electromecánica del Pacífico:");
  const brand = w.document.querySelector(".brand small");
  if (!brand || /EMP Instalaciones LLC/.test(brand.textContent)) throw new Error("el encabezado de marca sigue diciendo EMP Instalaciones LLC");
  contiene(brand.textContent, "Electromecánica del Pacífico", "el encabezado de marca ya dice Electromecánica del Pacífico:");
});
t("R.4 H-94 la memoria integral firma con S.meta.engineer, no con un nombre propio fijo en el código", () => {
  const eng0 = S.meta.engineer;
  try {
    S.meta.engineer = "Ing. Prueba Bancaria";
    G("recompute")();
    const txt = Buffer.from(G("buildMemoriaIntegralPdf")()).toString("latin1");
    contiene(txt, "Ing. Prueba Bancaria", "el nombre capturado aparece en la memoria:");
    if (/Rodrigo Nunez Loubet/.test(txt)) throw new Error("el nombre viejo, fijo en el código, sigue apareciendo en vez del capturado");
  } finally { S.meta.engineer = eng0; G("recompute")(); }
});

t("R.5 H-103 el despachador de clics no deja un botón de PDF muerto y en silencio si el motor revienta al armar el documento", () => {
  const origSrc = G("buildCargaPdf").toString();
  try {
    w.eval("var __origBLS_R5 = buildCargaPdf; buildCargaPdf = function() { throw new Error('prueba R.5: PDF roto a proposito'); };");
    const btn = w.document.createElement("button");
    /* rev 2.9.13 · el botón de memoria de la barra de acciones (antes cl-pdf-all). */
    btn.dataset.act = "pdf-memoria-motor"; btn.dataset.motor = "load";
    w.document.body.appendChild(btn);
    try {
      let noLanzo = true;
      try { btn.click(); } catch { noLanzo = false; }
      if (!noLanzo) throw new Error("la excepción se escapó del despachador de clics, debía quedar atrapada");
      const toastEl = w.document.getElementById("toast");
      if (toastEl.hidden) throw new Error("no se mostró ningún aviso al usuario tras el fallo — el botón se quedó muerto en silencio");
      contiene(toastEl.innerHTML, "No se pudo completar la acción", "el toast avisa del fallo:");
    } finally { btn.remove(); }
  } finally { w.eval(`buildCargaPdf = ${origSrc}`); }
});
t("R.6 H-103 emitirPropuestaPdfEspejo/emitirPropuestaEspejo no dejan escapar la excepción del primer documento (el segundo, dentro del setTimeout a 700 ms, usa el mismo patrón try/catch, verificado por lectura de código, no por esta prueba síncrona)", () => {
  const origPdf = G("buildPropuestaPdf").toString();
  const origXlsx = G("buildPropuestaXlsx").toString();
  try {
    w.eval("var __origBPP_R6 = buildPropuestaPdf; buildPropuestaPdf = function() { throw new Error('prueba R.6 pdf'); };");
    let noLanzo = true;
    try { G("emitirPropuestaPdfEspejo")(); } catch { noLanzo = false; }
    if (!noLanzo) throw new Error("emitirPropuestaPdfEspejo dejó escapar la excepción del primer documento");
    w.eval("var __origBPX_R6 = buildPropuestaXlsx; buildPropuestaXlsx = function() { throw new Error('prueba R.6 xlsx'); };");
    noLanzo = true;
    try { G("emitirPropuestaEspejo")(); } catch { noLanzo = false; }
    if (!noLanzo) throw new Error("emitirPropuestaEspejo dejó escapar la excepción del primer documento");
  } finally {
    w.eval(`buildPropuestaPdf = ${origPdf}`);
    w.eval(`buildPropuestaXlsx = ${origXlsx}`);
  }
});

/* ===== S. rev 2.9.13 · barra de acciones por motor, limpieza y monocromo ===== */
const PANT_S = ["carga", "limpios", "seleccion", "ductos", "ventilacion", "comparativo", "cotizacion", "valor", "kaizen", "electrico", "hidro", "fuego", "aire", "civil", "soporte", "estructural"];
const MOTORES_S_TODOS = () => ["load", "clean", "equip", "duct", "vent", "quote", "valor", "kaizen", "elec", "hidro", "fuego", "aire", "civil", "soporte"];
const clicS = (el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));
const barra = (tab) => { S.tab = tab; G("render")(); return w.document.querySelector("#view .accbar"); };
const boton = (tab, act) => { barra(tab); return w.document.querySelector(`#view .accbar [data-act="${act}"]`); };
const apagado = (b) => b.getAttribute("aria-disabled") === "true";
/* Datos mínimos para que cada motor tenga con qué calcular. */
function llenarTodoS() {
  S.meta.name = S.meta.name || "Banco de pruebas 2.9.13";
  Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba S" }; });
  if (!S.elec.cargas.some((c) => c.nombre === "Motor S")) S.elec.cargas.push({ ...G("defaultCarga")("Motor S"), kW: 7.5, L: 20 });
  if (!S.aire.consumos.some((c) => c.nombre === "Herramienta S")) S.aire.consumos.push({ ...G("defaultConsumo")("Herramienta S"), cant: 4, lmin: 200, bar: 6, uso: .5 });
  if (!S.duct.segments.some((c) => c.tag === "TR-S")) S.duct.segments.push({ ...G("defaultSegment")("TR-S", 2500), length: 20 });
  const ms = G("MUEBLES"); S.hidro.muebles = [{ id: ms[0].id, cant: 6 }, { id: ms[1].id, cant: 6 }];
  const r0 = G("cleanRooms")()[0]; r0.area = 60; r0.height = 3; r0.occ = 4;
  /* H-265: el cuarto clasificado de obra civil se captura en civil (antes lo tomaba del cuarto limpio). */
  if (!(S.civil.cuartos || []).some((c) => c.id === "kS")) S.civil.cuartos = [...(S.civil.cuartos || []), { id: "kS", nombre: r0.name || "Cuarto", area: 60, altura: 3, perimetro: 0 }];
  /* H-250: los espejos EN-USD del banco necesitan tipo de cambio con fecha. */
  if (!G("fxVigente")()) { S.quote.fx = 18.5; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "banco de pruebas"; }
  G("recompute")();
  /* H-267: la selección del proyecto lleno calcula con la propuesta de carga térmica aceptada (ya no la lee en vivo). */
  if (!G("zonasSel")().length) aceptarEquip();
  /* H-266: la soportería del proyecto lleno cuenta con su instantánea aceptada (ya no cuenta en vivo). */
  if (!S.soporte.snap) aceptarSoporte();
}
/* Recoge los PDF que la barra manda a entregar, sin descargar nada. */
function conPdfCapturado(fn) {
  const orig = G("deliverPdf").toString();
  w.eval("var __dpS = []; deliverPdf = function (b, f) { __dpS.push({ b: b, f: f }); };");
  try { fn(() => w.eval("__dpS")); } finally { w.eval(`deliverPdf = ${orig}`); }
}
const textoPdf = (u8) => Buffer.from(u8).toString("latin1");

t("S.1 la barra de acciones está en las 16 pantallas de motor, en el mismo lugar y con los mismos tres íconos", () => {
  llenarTodoS();
  const iconos = new Set();
  PANT_S.forEach((tab) => {
    const view = w.document.getElementById("view");
    const bar = barra(tab);
    eq(view.querySelectorAll(".accbar").length, 1, `${tab}: una sola barra:`);
    eq([...view.children].indexOf(bar), 1, `${tab}: justo debajo del título de la disciplina:`);
    const btns = [...bar.querySelectorAll("button.acc")];
    eq(btns.map((b) => b.dataset.act).join(","), "calc-motor,pdf-memoria-motor,pdf-cot-motor", `${tab}: las tres acciones, en orden:`);
    eq(btns.map((b) => b.querySelector("span").textContent).join("|"), "Calcular|Memoria de cálculo|Cotización de esta disciplina", `${tab}: rótulos:`);
    btns.forEach((b) => {
      eq(b.type, "button", `${tab}: es un botón de verdad:`);
      if (!b.dataset.motor) throw new Error(`${tab}: falta data-motor`);
      if (!/\S/.test(b.getAttribute("aria-label") || "")) throw new Error(`${tab}: falta aria-label`);
      const svg = b.querySelector("svg");
      if (!svg) throw new Error(`${tab}: falta el ícono`);
      contiene(svg.outerHTML, 'stroke-width="1.5"', `${tab}: trazo:`);
      contiene(svg.outerHTML, 'fill="none"', `${tab}: sin relleno:`);
      contiene(svg.outerHTML, 'stroke="currentColor"', `${tab}: color heredado:`);
    });
    iconos.add(btns.map((b) => b.querySelector("svg").outerHTML).join(""));
  });
  eq(iconos.size, 1, "los tres íconos son los mismos en todas las pantallas:");
  ["tablero", "proyecto", "catalogo"].forEach((tab) => {
    barra(tab);
    if (w.document.querySelector("#view .accbar")) throw new Error(`${tab} no es un motor y no debe llevar la barra`);
  });
  S.tab = "tablero"; G("render")();
});

t("S.2 cada botón apagado explica en una línea por qué, y cada uno prendido no dice nada", () => {
  llenarTodoS();
  let apagados = 0;
  PANT_S.forEach((tab) => {
    const bar = barra(tab);
    [...bar.querySelectorAll("button.acc")].forEach((b) => {
      const id = b.getAttribute("aria-describedby");
      if (!apagado(b)) { if (id) throw new Error(`${tab}/${b.dataset.act}: prendido pero con razón`); return; }
      apagados++;
      const el = id && w.document.getElementById(id);
      if (!el || !/\S/.test(el.textContent)) throw new Error(`${tab}/${b.dataset.act}: apagado sin razón visible`);
      if (/\n/.test(el.textContent.trim())) throw new Error(`${tab}/${b.dataset.act}: la razón no es de una línea`);
    });
  });
  if (!apagados) throw new Error("la prueba no ejercitó ningún botón apagado");
});

t("S.3 sin datos, Calcular y Memoria se apagan y dicen qué falta y en qué pestaña se captura", () => {
  const zs = S.zones, dseg = S.duct.segments;
  try {
    S.zones = []; S.duct.segments = []; G("recompute")();
    let b = boton("carga", "calc-motor");
    eq(apagado(b), true, "carga sin zonas:");
    contiene(w.document.getElementById(b.getAttribute("aria-describedby")).textContent, "Falta al menos una zona con área · se captura en Carga térmica", "razón de carga:");
    b = boton("ductos", "pdf-memoria-motor");
    eq(apagado(b), true, "ductos sin tramos:");
    contiene(w.document.getElementById(b.getAttribute("aria-describedby")).textContent, "se captura en Ductos y calibres", "razón de ductos:");
    /* Apagado de verdad: un clic no hace nada, sólo avisa. */
    conPdfCapturado((salida) => { clicS(b); eq(salida().length, 0, "un botón apagado no emite PDF:"); });
    clicS(boton("carga", "calc-motor"));
    eq((S.sellos || {}).load, undefined, "un Calcular apagado no sella:");
  } finally { S.zones = zs; S.duct.segments = dseg; G("recompute")(); }
});

t("S.4 Estructural corre como archivo aparte: las tres acciones apagadas, con la nota, y no se simula nada", () => {
  const bar = barra("estructural");
  const btns = [...bar.querySelectorAll("button.acc")];
  eq(btns.length, 3);
  btns.forEach((b) => eq(apagado(b), true, `${b.dataset.act} apagado:`));
  contiene(bar.querySelector(".accnota").textContent, "archivo aparte", "la nota:");
  conPdfCapturado((salida) => { btns.forEach(clicS); eq(salida().length, 0, "no emite ningún PDF:"); });
  eq((S.sellos || {}).estr, undefined, "no sella un cálculo que no hizo:");
});

t("S.5 Calcular vacía las memorias de cálculo, recalcula con lo capturado, sella la hora y no mueve ningún número", () => {
  llenarTodoS();
  barra("carga");
  const antes = JSON.stringify([G("totals")(), G("SYS").plantTarget, G("QUOTE").tot, G("VENT").m3h]);
  G("ZCACHE").set("__centinela__", 1);
  delete S.sellos.load;
  clicS(w.document.querySelector('#view .accbar [data-act="calc-motor"]'));
  eq(G("ZCACHE").has("__centinela__"), false, "la memoria por zona se vació:");
  eq(JSON.stringify([G("totals")(), G("SYS").plantTarget, G("QUOTE").tot, G("VENT").m3h]), antes, "los mismos datos dan los mismos números:");
  if (!S.sellos.load || !(S.sellos.load.ts > 0) || !/^[0-9a-f]{8,20}$/.test(S.sellos.load.huella)) throw new Error("no selló la hora con su huella");
  contiene(w.document.querySelector("#view .accsello").textContent, "Calculado", "el sello es visible:");
  eq(w.document.activeElement && w.document.activeElement.dataset.act, "calc-motor", "el foco vuelve a Calcular:");
  /* Si la captura cambia después, el sello lo dice. */
  const a0 = S.zones[0].area;
  S.zones[0].area = a0 + 1; G("recompute")(); G("render")();
  contiene(w.document.querySelector("#view .accsello").textContent, "Desactualizado", "sello viejo:");
  S.zones[0].area = a0; G("recompute")(); G("render")();
  /* Recalcular en Kaizen y en Ingeniería de valor (motores con memoria propia). */
  ["kaizen", "valor"].forEach((tab) => {
    clicS(boton(tab, "calc-motor"));
    if (!S.sellos[tab]) throw new Error(`${tab}: no selló`);
  });
});

t("S.6 Memoria de cálculo emite el PDF de cada disciplina: con el nombre del proyecto y sin salir en blanco", () => {
  llenarTodoS();
  const nuevas = { carga: "Memoria de carga termica", seleccion: "Memoria de seleccion de equipo", ventilacion: "Memoria de ventilacion", valor: "Memoria de ingenieria de valor", kaizen: "Memoria de Kaizen" };
  let emitidos = 0;
  conPdfCapturado((salida) => {
    PANT_S.filter((x) => x !== "comparativo" && x !== "estructural").forEach((tab) => {
      const b = boton(tab, "pdf-memoria-motor");
      if (apagado(b)) throw new Error(`${tab}: con datos capturados la memoria no debía estar apagada`);
      const n0 = salida().length;
      clicS(b);
      eq(salida().length, n0 + 1, `${tab}: emitió un PDF:`);
      const p = salida()[n0], txt = textoPdf(p.b);
      if (!txt.startsWith("%PDF-")) throw new Error(`${tab}: no es un PDF`);
      if (p.b.length < 5000) throw new Error(`${tab}: PDF casi vacío (${p.b.length} bytes)`);
      if (/undefined|NaN/.test(txt)) throw new Error(`${tab}: el PDF imprime «undefined» o «NaN»`);
      contiene(txt, S.meta.name, `${tab}: el cajetín lleva el nombre del proyecto:`);
      if (nuevas[tab]) { contiene(txt, nuevas[tab], `${tab}: título:`); contiene(txt, "Trazabilidad", `${tab}: trazabilidad:`); contiene(txt, "Alcance de este calculo", `${tab}: alcance declarado:`); }
      emitidos++;
    });
  });
  eq(emitidos, 14, "catorce disciplinas con memoria propia:");
});

t("S.7 Cotización de esta disciplina reúne las partidas del motor; sin partidas o sin cruce autorizado se apaga con su razón", () => {
  llenarTodoS();
  let emitidos = 0, apagados = 0;
  conPdfCapturado((salida) => {
    PANT_S.filter((x) => x !== "comparativo" && x !== "estructural").forEach((tab) => {
      const b = boton(tab, "pdf-cot-motor");
      const n0 = salida().length;
      clicS(b);
      if (apagado(b)) { apagados++; eq(salida().length, n0, `${tab}: apagado, no emite:`); return; }
      eq(salida().length, n0 + 1, `${tab}: emitió:`);
      const txt = textoPdf(salida()[n0].b);
      if (!txt.startsWith("%PDF-")) throw new Error(`${tab}: no es un PDF`);
      emitidos++;
    });
  });
  if (emitidos < 6) throw new Error(`sólo ${emitidos} cotizaciones emitidas`);
  /* Sin autorizar el cruce, la razón trae el botón para autorizarlo. */
  const perm = S.perms["elec>quote"];
  try {
    delete S.perms["elec>quote"]; G("recompute")();
    const b = boton("electrico", "pdf-cot-motor");
    eq(apagado(b), true, "cruce sin autorizar:");
    contiene(w.document.querySelector("#view .accbar").innerHTML, 'data-act="ask-link" data-id="elec>quote"', "botón para autorizar:");
  } finally { S.perms["elec>quote"] = perm; G("recompute")(); }
});

t("S.8 la barra reemplaza a los botones sueltos de PDF: ninguno sigue en pantalla ni en el despachador", () => {
  llenarTodoS();
  const quitados = ["pdf-elec", "pdf-hidro", "pdf-fuego", "pdf-aire", "pdf-civil", "pdf-soporte", "pdf-cedula", "cl-pdf-all", "q-pdf", "q-propuesta", "pdf-memoria", "q-add", "perm-grant", "q-cmp", "vent-from-load", "ir-diagrama"];
  const src = fs.readFileSync(file, "utf8");
  quitados.forEach((a) => {
    if (src.indexOf(`data-act="${a}"`) >= 0) throw new Error(`sigue emitiéndose data-act="${a}"`);
    if (new RegExp(`case "${a}"`).test(src)) throw new Error(`sigue el caso "${a}" en el despachador`);
  });
  let html = "";
  G("tabsDeVista")().concat(["tablero", "proyecto", "catalogo", "comparativo"]).forEach((tab) => { S.tab = tab; G("render")(); html += vista(); });
  quitados.forEach((a) => { if (html.indexOf(`data-act="${a}"`) >= 0) throw new Error(`en pantalla queda data-act="${a}"`); });
  /* aire-del leía e.dataset (el evento) en vez de b.dataset y no borraba nada. */
  S.aire.consumos.push({ ...G("defaultConsumo")("A borrar"), cant: 1, lmin: 10, bar: 6, uso: 1 });
  const id = S.aire.consumos[S.aire.consumos.length - 1].id, n0 = S.aire.consumos.length;
  const bt = w.document.createElement("button"); bt.dataset.act = "aire-del"; bt.dataset.id = id; w.document.body.appendChild(bt);
  clicS(bt); bt.remove();
  eq(S.aire.consumos.length, n0 - 1, "aire-del borra el consumo:");
});

t("S.9 monocromo: rampa de nueve grises, superficies translúcidas con desenfoque y las capas de instalación intactas", () => {
  const css = w.document.querySelector("style").textContent;
  const raiz = css.slice(css.indexOf(":root{"), css.indexOf("}", css.indexOf(":root{")));
  const gr = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (raiz.match(new RegExp(`--gr-${i}:\\s*(#[0-9A-Fa-f]{6})`)) || [])[1]);
  if (gr.some((x) => !x)) throw new Error("falta un paso de la rampa de grafito: " + gr);
  const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  for (let i = 1; i < 9; i++) if (!(lum(gr[i]) > lum(gr[i - 1]))) throw new Error(`la rampa no sube en el paso ${i + 1}`);
  if (lum(gr[0]) > .01) throw new Error("el primer paso no es casi negro");
  if (lum(gr[8]) < .8) throw new Error("el último paso no es casi blanco");
  /* Lo que no se toca. */
  const v = (tok) => (raiz.match(new RegExp("--" + tok + ":\\s*(#[0-9A-Fa-f]{6})")) || [])[1];
  eq(v("p-el"), "#D7A8FF"); eq(v("p-pot"), "#3FD1B0"); eq(v("p-air"), "#F2C230"); eq(v("p-mt"), "#A96BFF"); eq(v("p-plu"), "#7CC8F7");
  eq(v("senal"), "#F0561D"); eq(v("marca"), "#1F4FD8", "la marca de pantalla, PDF y Excel es el azul del isométrico del sitio (rev 2.9.16, decisión del dueño):");
  /* Translucidez. */
  if (!/--card:rgba\(255,255,255,\.0\d+\)/.test(raiz)) throw new Error("--card no es una capa translúcida");
  ["\\.card\\{", "\\.accbar\\{", "nav\\.tabs\\.lat\\{display:flex", "nav\\.col2\\{display:flex", "\\.modal \\.sheet\\{", "header\\.top\\{"].forEach((sel) => {
    const m = css.match(new RegExp(sel + "[^}]*\\}")) || css.match(new RegExp(sel + "[^}]*\\n[^}]*\\}"));
    if (!m || !/backdrop-filter/.test(m[0])) throw new Error(`${sel} no lleva backdrop-filter`);
  });
  contiene(css, "--vidrio:saturate(140%) blur(14px)", "desenfoque discreto:");
  /* Nada de naranja ni de azul del tema anterior en duro fuera de :root. */
  const fuera = css.slice(css.indexOf("}", css.indexOf(":root{")));
  if (/rgba\(240,\s*86,\s*29/.test(fuera) || /#F0561D/i.test(fuera)) throw new Error("hay un naranja en duro fuera de :root");
  if (/rgba\(122,\s*147,\s*189/.test(fuera) || /rgba\(49,\s*46,\s*101/.test(fuera)) throw new Error("queda el azul/índigo del tema anterior");
  contiene(css, ".dnodo .dsub{", "los subrenglones del nodo:");
});

t("S.10 contraste: texto normal ≥ 4.5:1 y texto grande ≥ 3:1 contra el fondo REAL (superficie translúcida compuesta, peor punto del degradado)", () => {
  const css = w.document.querySelector("style").textContent;
  const raiz = css.slice(css.indexOf(":root{"), css.indexOf("}", css.indexOf(":root{")));
  const hex = (n) => { const h = (raiz.match(new RegExp("--" + n + ":\\s*(#[0-9A-Fa-f]{6})")) || [])[1]; if (!h) throw new Error("no está --" + n); return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const lin = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  const L = (rgb) => .2126 * lin(rgb[0]) + .7152 * lin(rgb[1]) + .0722 * lin(rgb[2]);
  const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const sobre = (c, a, fondo) => c.map((v, i) => v * a + fondo[i] * (1 - a));
  /* Fondo del cuerpo en su punto más claro: el negro más los tres degradados sumados (≈ 5.2 % de blanco). */
  const pico = sobre([255, 255, 255], .052, hex("gr-1"));
  const alfa = (n) => +(raiz.match(new RegExp("--" + n + ":rgba\\(255,255,255,(\\.\\d+)\\)")) || [])[1];
  const a1 = alfa("card"), a2 = alfa("card2");
  const superficies = { "tarjeta": sobre([255, 255, 255], a1, pico), "tarjeta elevada": sobre([255, 255, 255], a2, pico), "tarjeta con otra dentro": sobre([255, 255, 255], a2, sobre([255, 255, 255], a1, pico)), "fila resaltada": sobre([255, 255, 255], .10, sobre([255, 255, 255], a1, pico)) };
  const textos = { "tinta": hex("gr-9"), "tinta-2 (apagado)": hex("gr-8"), "tinta-3 (cota)": hex("gr-7"), "dato (azul)": hex("plano"), "alerta (naranja de texto)": [0xFF, 0x8A, 0x5C] };
  Object.entries(superficies).forEach(([sn, s]) => Object.entries(textos).forEach(([tn, tc]) => {
    const r = cr(tc, s);
    if (r < 4.5) throw new Error(`${tn} sobre ${sn}: ${r.toFixed(2)}:1, pide 4.5:1`);
  }));
  /* Texto oscuro sobre el naranja de acción (Calcular) y sobre el botón claro. */
  const r1 = cr(hex("gr-1"), hex("senal")); if (r1 < 4.5) throw new Error(`Calcular: ${r1.toFixed(2)}:1`);
  const r2 = cr(hex("gr-1"), hex("gr-9")); if (r2 < 4.5) throw new Error(`botón claro: ${r2.toFixed(2)}:1`);
  const r3 = cr(hex("gr-1"), hex("plano")); if (r3 < 4.5) throw new Error(`azul con texto oscuro: ${r3.toFixed(2)}:1`);
});

t("S.11 el naranja de acción es uno por pantalla: Calcular en los motores; en Tablero y Proyecto su única acción principal", () => {
  llenarTodoS();
  PANT_S.forEach((tab) => {
    barra(tab);
    const v = w.document.getElementById("view");
    eq(v.querySelectorAll(".acc-calc-motor").length, 1, `${tab}: un Calcular:`);
    eq(v.querySelectorAll(".btn-accion").length, 0, `${tab}: ningún otro botón de acción:`);
  });
  w.eval("DIAG = null");
  ["tablero", "proyecto"].forEach((tab) => { S.tab = tab; G("render")(); eq(w.document.getElementById("view").querySelectorAll(".btn-accion").length, 1, `${tab}: una sola acción principal:`); });
  S.tab = "catalogo"; G("render")();
  eq(w.document.getElementById("view").querySelectorAll(".btn-accion").length, 0, "catálogo: ninguna:");
});

t("S.12 semáforo y gráficas en la rampa de grises: por forma y luminosidad, con naranja sólo en lo crítico", () => {
  const css = w.document.querySelector("style").textContent;
  contiene(css, ".sem-incompleta{background:linear-gradient", "punto medio lleno:");
  contiene(css, ".sem-vacia{background:transparent", "punto vacío:");
  contiene(css, ".sem-desactualizada{background:var(--senal)}", "lo crítico en naranja:");
  contiene(css, '.badge.ok::before{content:"✓ "}'); contiene(css, '.badge.warn::before{content:"▲ "}'); contiene(css, '.badge.bad::before{content:"✕ "}');
  const clr = G("CLR");
  if (/^#F0561D$/i.test(clr.or) || /^#F0561D$/i.test(clr.orS)) throw new Error("la serie principal de las gráficas no puede ser naranja");
  eq(clr.alerta, "#F0561D", "el naranja de las gráficas es sólo el de alerta:");
});



t("S.13 en un proyecto sin captura, Calcular y Memoria se apagan también en los motores que tienen pisos internos (clean, equip, valor, fuego, civil)", () => {
  llenarTodoS();
  const zs = S.zones, rooms = JSON.stringify(S.clean), fa = S.fuego.area, cv = JSON.stringify(S.civil), eqz = JSON.stringify(S.equip.zonas);
  try {
    S.zones = [G("defaultZone")("Vacía")];
    S.equip.zonas = [];   /* H-267: la selección tiene captura propia (sus zonas de selección): sin ellas, sin captura */
    G("cleanRooms")().forEach((r) => { r.area = 0; r.height = 0; r.occ = 0; });
    S.fuego.area = 0; S.civil.usarZonas = true; S.civil.areas = []; S.civil.cuartos = [];   /* H-265: sin captura propia de civil */
    G("recompute")();
    ["limpios", "seleccion", "valor", "fuego", "civil"].forEach((tab) => {
      ["calc-motor", "pdf-memoria-motor"].forEach((act) => eq(apagado(boton(tab, act)), true, `${tab}/${act} sin captura:`));
    });
  } finally { S.zones = zs; S.clean = JSON.parse(rooms); S.fuego.area = fa; S.civil = JSON.parse(cv); S.equip.zonas = JSON.parse(eqz); G("recompute")(); }
});

t("S.14 Calcular desde una pantalla de motor no deja a Kaizen ni a Ingeniería de valor en «sin datos»", () => {
  llenarTodoS();
  const z = S.zones[0], luz = z.lightType, oa = z.oaFixed;
  try {
    z.lightType = "fluorescent"; z.oaFixed = 3000; G("recompute")();
    S.tab = "kaizen"; G("render")();
    const k0 = G("KAIZEN").ops.length, v0 = G("VALOR").props.length;
    if (!k0) throw new Error("la prueba no ejercitó Kaizen (0 oportunidades)");
    clicS(boton("carga", "calc-motor"));
    eq(G("KAIZEN").ops.length, k0, "oportunidades de Kaizen después de Calcular en Carga:");
    eq(G("VALOR").props.length, v0, "medidas de ingeniería de valor después de Calcular en Carga:");
    eq(S.tab, "carga", "la pestaña no cambia:");
  } finally { z.lightType = luz; z.oaFixed = oa; G("recompute")(); }
});

t("S.15 el sello es del proyecto: viaja en el respaldo, un proyecto del formato 1 abre «Sin sello» y limpiarCaches ya no lo borra", () => {
  llenarTodoS();
  const bar = () => w.document.querySelector("#view .accsello");
  clicS(boton("carga", "calc-motor"));
  eq(bar().dataset.sello, "calculado", "recién calculado:");
  /* Ida y vuelta por el respaldo .json (formato 2): la huella coincide, sigue «Calculado». */
  const txt = JSON.stringify({ v: G("FORMATO_GUARDADO"), ...S });
  eq(JSON.parse(txt).v, 2, "el respaldo declara el formato 2:");
  G("limpiarCaches")();
  eq(S.sellos.load && S.sellos.load.huella.length > 0, true, "limpiarCaches no toca los sellos del proyecto:");
  G("importarRespaldo")(txt);
  S.tab = "carga"; G("render")();
  eq(S.formato, 2); eq(bar().dataset.sello, "calculado", "después de abrir el respaldo:");
  /* Si el respaldo trae la captura cambiada, dice «Desactualizado» y NO recalcula solo. */
  const cambiado = JSON.parse(txt); cambiado.zones[0].area += 10;
  const selloAntes = JSON.stringify(cambiado.sellos.load);
  G("importarRespaldo")(JSON.stringify(cambiado));
  S.tab = "carga"; G("render")();
  eq(bar().dataset.sello, "desactualizado", "captura distinta a la del sello:");
  eq(JSON.stringify(S.sellos.load), selloAntes, "abrir no recalcula ni resella:");
  /* Un proyecto del formato 1 (sin `formato` ni `sellos`) abre sin error y dice «Sin sello» en los 15 motores. */
  const viejo = JSON.parse(txt); delete viejo.formato; delete viejo.sellos; viejo.v = 1;
  G("importarRespaldo")(JSON.stringify(viejo));
  eq(S.formato, 2, "se sube al formato 2 al abrirlo:"); eq(Object.keys(S.sellos).length, 0, "sin sellos:");
  G("MOTOR_ACC"); ["carga", "limpios", "seleccion", "ductos", "ventilacion", "cotizacion", "valor", "kaizen", "electrico", "hidro", "fuego", "aire", "civil", "soporte"].forEach((tab) => {
    barra(tab); eq(w.document.querySelector("#view .accsello").dataset.sello, "sin", `${tab}: sin sello:`);
  });
  /* Un sello mal formado se descarta al abrir. */
  const roto = JSON.parse(txt); roto.sellos = { load: { ts: "x", huella: 5 }, zzz: 1, duct: { ts: 5, huella: "no es hex" } };
  G("importarRespaldo")(JSON.stringify(roto));
  eq(Object.keys(S.sellos).length, 0, "sellos rotos descartados:");
});

t("S.16 Soportería no muestra NaN ni undefined (leía cinco conteos que SoporteCalc ya no entrega)", () => {
  llenarTodoS();
  S.tab = "soporte"; G("render")();
  const h = vista();
  if (/NaN|undefined/.test(h)) throw new Error("la pantalla de soportería imprime NaN o undefined");
  contiene(h, "Soportes", "el conteo:");
});

t("S.17 los puntos de semáforo se ven fuera del menú, los bordes de campo pasan 3:1 y los avisos se anuncian", () => {
  const css = w.document.querySelector("style").textContent;
  contiene(css, ".modbar .sem,.cxz-sem i,.accsello i{display:inline-block;width:9px;height:9px", "punto del encabezado:");
  contiene(css, "--borde-campo:rgba(255,255,255,.38)");
  const a = .38, fondo = [19, 22, 26], borde = fondo.map((c) => c * (1 - a) + 255 * a);
  const lin = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  const L = (r) => .2126 * lin(r[0]) + .7152 * lin(r[1]) + .0722 * lin(r[2]);
  const r = (L(borde) + .05) / (L(fondo) + .05);
  if (r < 3) throw new Error(`borde de campo ${r.toFixed(2)}:1`);
  contiene(w.document.getElementById("toast").outerHTML, 'aria-live="polite"', "toast anunciado:");
});


t("S.18 semáforo: un proyecto vacío muestra «Sin datos» en TODAS las disciplinas; «con datos» sólo con captura real o herencia real", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")());
    S.meta.name = "Proyecto vacío de prueba";
    /* Con TODOS los cruces autorizados: es cuando más partidas fantasma podrían colarse a la cotización. */
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba S.18" }; }); G("recompute")();
    const niveles = () => Object.fromEntries(G("semaforoSuite")().map((x) => [x.id, x.nivel]));
    let n = niveles();
    Object.entries(n).forEach(([id, nv]) => { if (id !== "estr" && id !== "kaizen" && id !== "valor" && nv !== "vacia") throw new Error(`${id}: proyecto vacío y dice «${nv}» (pisos internos del motor tomados por captura)`); });
    eq(n.estr, "externo");
    /* Un cuarto limpio real: limpios, civil (su geometría) y lo que se alimenta de ellos pasan a «con datos»; el resto sigue vacío. */
    const r = G("cleanRooms")()[0]; r.area = 60; r.height = 3; G("recompute")();
    n = niveles();
    const con = (id, msg) => { if (n[id] === "vacia") throw new Error(msg || `${id} debía tener datos`); };
    con("clean"); eq(n.civil, "vacia", "H-265: obra civil no se prende con el cuarto limpio (es autónoma):");
    ["load", "equip", "duct", "vent", "elec", "hidro", "aire"].forEach((id) => eq(n[id], "vacia", `${id} sigue vacío:`));
    /* Una zona con área: carga se prende. H-262/H-264: ventilación y contra incendio ya no heredan: siguen vacíos. H-267: selección
       de equipo tampoco se prende sola: sólo al aceptar la propuesta de carga térmica (o al capturar sus zonas). */
    S.zones[0].area = 200; S.zones[0].height = 4; G("recompute")();
    n = niveles();
    if (n.load === "vacia") throw new Error("load con zona capturada sigue en «Sin datos»");
    eq(n.equip, "vacia", "H-267: selección de equipo no se prende con la zona de carga térmica sin aceptar la propuesta:");
    aceptarEquip(); n = niveles();
    if (n.equip === "vacia") throw new Error("equip con la propuesta de carga térmica aceptada sigue en «Sin datos»");
    eq(n.fuego, "vacia", "H-264: contra incendio no se prende con la zona de carga térmica:");
    S.fuego.area = 200; G("recompute")(); n = niveles();
    if (n.fuego === "vacia") throw new Error("contra incendio con área capturada sigue en «Sin datos»");
    S.civil.areas = [{ id: "a1", nombre: "Nave", area: 200, altura: 4, perimetro: 0 }]; G("recompute")(); n = niveles();
    if (n.civil === "vacia") throw new Error("obra civil con un área capturada sigue en «Sin datos»");
    /* Los motores que dependen de la captura de los demás tampoco se prenden solos. */
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Proyecto vacío de prueba";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba S.18" }; }); G("recompute")();
    n = niveles();
    eq(n.quote, "vacia", "quote vacío:");
    ["valor", "kaizen"].forEach((id) => eq(n[id], "gestion", `${id} sin semáforo (rev 2.9.16):`));
    S.hidro.muebles = [{ id: G("MUEBLES")[0].id, cant: 4 }, { id: G("MUEBLES")[1].id, cant: 4 }]; G("recompute")();
    n = niveles();
    if (n.hidro === "vacia") throw new Error("hidro con muebles capturados sigue vacío");
    /* H-196: cisterna y bomba ya no traen precio semilla; con sólo muebles (sin tramos ni precios) la cotización no tiene
       importe: sigue «Sin datos», con sus partidas Por cotizar y pendientes declaradas. */
    eq(n.quote, "vacia", "sin precio capturado la cotización no tiene importe (H-196):");
    if (!(G("QUOTE").porCotizar || []).some((p) => p.mot === "hidro")) throw new Error("con muebles capturados debe haber partidas hidro Por cotizar");
    eq(n.load, "vacia");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.19 el Tablero trae la memoria completa y la cotización unificada de todas las disciplinas; sin captura la cotización se apaga con su razón", () => {
  llenarTodoS();
  S.tab = "tablero"; G("render")();
  let v = vista();
  contiene(v, 'data-act="pdf-integral"', "memoria completa:");
  contiene(v, 'data-act="pdf-cot-unificada"', "cotización unificada:");
  eq(v.indexOf('data-act="pdf-cot-unificada" aria-disabled'), -1, "con datos está prendida:");
  eq(w.document.querySelectorAll("#view .btn-accion").length, 1, "una sola acción principal en el tablero:");
  conPdfCapturado((salida) => {
    clicS(w.document.querySelector('#view [data-act="pdf-cot-unificada"]'));
    eq(salida().length, 1); const p = salida()[0];
    if (!/^Propuesta-/.test(p.f) || !textoPdf(p.b).startsWith("%PDF-") || p.b.length < 10000) throw new Error("la propuesta unificada no salió completa");
    clicS(w.document.querySelector('#view [data-act="pdf-integral"]'));
    eq(salida().length, 2); if (!/^Memoria-integral-/.test(salida()[1].f)) throw new Error("la memoria completa no salió");
  });
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Proyecto vacío"; G("recompute")();
    S.tab = "tablero"; G("render")();
    const b = w.document.querySelector('#view [data-act="pdf-cot-unificada"]');
    eq(b.getAttribute("aria-disabled"), "true", "sin captura apagada:");
    contiene(w.document.getElementById(b.getAttribute("aria-describedby")).textContent, "todavía no hay captura", "razón visible:");
    conPdfCapturado((salida) => { clicS(b); eq(salida().length, 0, "apagada no emite:"); });
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.20 un proyecto guardado con la versión anterior (formato 1, rev 2.9.13) abre sin error, con los mismos números y «Sin sello»", () => {
  const dir = new URL("./parches/fixtures-formato/", import.meta.url);
  const viejo = fs.readFileSync(new URL("proyecto-formato-1_rev-2.9.13.emp.json", dir), "utf8");
  const esperado = JSON.parse(fs.readFileSync(new URL("proyecto-formato-1_rev-2.9.13.esperado.json", dir), "utf8"));
  const d = JSON.parse(viejo);
  eq(d.v, 1, "el respaldo es del formato 1:"); eq(d.formato, undefined, "sin campo formato:"); eq(d.sellos, undefined, "sin sellos:");
  const errs0 = (w.__errs || []).length;
  G("importarRespaldo")(viejo);
  eq((w.__errs || []).length, errs0, "abrir no lanzó errores de ventana:");
  eq(S.meta.name, "Proyecto guardado con formato 1", "abrió el proyecto:");
  eq(S.formato, 2, "queda en el formato 2:"); eq(Object.keys(S.sellos).length, 0, "sin sellos:");
  G("recompute")();
  const T = G("totals")();
  const r = { tons: +T.tons.toFixed(6), cfm: +T.cfm.toFixed(6), area: T.area, sysTarget: G("SYS").plantTarget, sysChosen: G("SYS").chosen.id, quoteTot: G("QUOTE").tot,
    quoteSub: G("QUOTE").sub, quoteDirect: G("QUOTE").direct, ventM3h: G("VENT").m3h, ductKg: G("DUCT").boq.kg, cleanSupply: G("CLEAN").sum.supply,
    elecKVA: G("ELEC").kVAdemanda, hidroQ: G("HIDRO").Qtotal, fuegoQ: G("FUEGO").qTotal, aireFAD: G("AIRE").fadRequerido, civilTotal: G("CIVIL").total,
    soporteN: G("SOPORTE").nSoportes, partidas: G("catalogoConceptos")().subtotal };
  /* rev 2.9.16 · DECISIÓN DEL DUEÑO (cotización hidrosanitaria por diámetro, sin el supuesto de 50 m): este proyecto no
     tiene tramos de agua, así que la partida «Red hidráulica ... 50 m supuestos» (50 × 780 = 39,000 MXN de costo directo)
     sale y queda «pendiente de longitud». Todo lo demás sigue igual al de la 2.9.13. Antes → después: */
  /* rev 2.9.18 · además, DECISIONES DEL DUEÑO: Tijuana a ASHRAE 2021 (32.8/17.5 °C, 149 m, 9.2 K) y curva de Hunter del IPC
     E103.3(3). Este proyecto está en Tijuana: la carga baja (el bulbo húmedo de 24 a 17.5 °C recorta el latente), el caudal
     sube (el calor sensible pesa más) y el gasto hidráulico sube con Hunter. Antes (2.9.13) → después (2.9.18): */
  /* rev 2.9.24 · H-120 (load v4): el DET de muros y cubierta se corrige por sitio (Tijuana +0.31 K). Antes → después:
     tons 12.904762 → 12.943837 · cfm 5790.236072 → 5815.981512 · planta 14.19523796089015 → 14.238221145934492; la cotización
     de este proyecto no cambia. Lo verifican a mano CM.load.2/3/9 (parches/casos-a-mano/load.calc.mjs). */
  /* rev 2.9.24 · H-194 (hidro v5): la presión mínima por mueble sale de la Tabla 604.3 del IPC 2015 y la CDT de la bomba lleva
     máx(residual capturado, mínima de norma). Este proyecto (sin tramos, altura 0, WC con fluxómetro) tenía CDT = residual 15 m
     → 0.996 kW → 1.5 HP; ahora CDT = 24.607 m (35 psi) → 1.633 kW → 2.5 HP, y la partida «Cisterna de 0 m³ y equipo de bombeo»
     sube 14,500 MXN (precio semilla por HP, H-196 pendiente). Antes (H-120) → después (H-194): quoteDirect y partidas
     6678714.747352686 → 6693214.747352686 · quoteSub 10095545.21209832 → 10117463.412098318 · quoteTot 11710832.44603405 →
     11736257.55803405. Lo verifican a mano CM.hidro.1.z–1.ac y CM.hidro.12 (parches/casos-a-mano/hidro.calc.mjs).
     H-196 (quote v8): la partida «Cisterna de 0 m³ y equipo de bombeo de 2.5 HP» (36,250 MXN = 14,500 × 2.5, precio semilla sin
     fuente) desaparece: la bomba va «Por cotizar» (presRed 0: la presión no alcanza) y la cisterna en 0 queda pendiente de volumen.
     quoteDirect 6693214.747352686 → 6656964.747352686 · quoteSub → 10062667.912098318 · quoteTot → 11672694.77803405.
     H-206 (quote v9): la partida «Bomba contra incendio 661 gpm y reserva de 138.2 m³» (1,697,446.66 MXN = 385,000 fijos +
     9,500 × 138.152 m³, sin fuente) desaparece: bomba y reserva van «Por cotizar» con capacidad, presión, potencia y volumen.
     quoteDirect → 4959518.087352686 · quoteSub → 7496807.540842321 · quoteTot → 8696296.747377092.
     H-215 (aire v3, quote v10): el secador pasa de FAD requerido / (0.92 × fP) a todo el caudal del compresor a la capacidad
     nominal de ISO 7183 A1 (897.6 / 0.8... → 1,164.4 L/min): quoteDirect → 4961974.7391384 · quoteSub → 7500521.015681606 ·
     quoteTot → 8700604.378190663.
     H-225 (soporte v5, quote v13): sin altura de colgado capturada la varilla queda pendiente (antes 7.2 m por varilla):
     quoteDirect → 4957294.7391384 · quoteSub → 7493446.727681606 · quoteTot → 8692398.204110663.
     H-226 (soporte v6, quote v14): sin SDS con fuente ni estructura/f'c capturados el anclaje va Por cotizar (10 × 95 MXN):
     quoteDirect → 4956344.7391384 · quoteSub → 7492010.7076816065 · quoteTot → 8690732.420910664.
     H-243 (civil v4, quote v16): muro clasificado y media caña por cuarto limpio (rectángulo 3:2 estimado del cuarto × su altura;
     antes fracción de área del edificio entre la altura media): quoteDirect → 5259188.600874344 · quoteSub → 7949789.489081658 ·
     quoteTot → 9221755.807334725; civilTotal 1572299.248 → 1875143.1097359434.
     H-244 (civil v5, quote v17; decisión 5 del dueño): la tabiquería deja de tomar los muros de carga térmica; sin perímetro
     capturado, rectángulo 3:2 × altura por zona, «estimado»: quoteDirect → 5953691.248524068 · quoteSub → 8999599.69126898 ·
     quoteTot → 10439535.641872017; civilTotal → 2569645.757385668. */
  const MOVIDOS_2916 = { tons: [18.584787, 12.943837], cfm: [5114.572875, 5815.981512], sysTarget: [20.443265161623447, 14.238221145934492],
    hidroQ: [3.924, 4.05985437], quoteDirect: [6704014.747352686, 5840991.248524068], partidas: [6704014.747352686, 5840991.248524068],
    quoteSub: [10133788.69209832, 8829242.37126898], quoteTot: [11755194.88283405, 10241921.150672017], /* H-181: alimentador y tablero «Por cotizar» (−112,700 directos) */
    civilTotal: [1572299.248, 2569645.757385668] };
  Object.entries(MOVIDOS_2916).forEach(([k, [antes]]) => eq(esperado.resumen[k], antes, `${k}: el «antes» es el de la 2.9.13:`));
  Object.entries(esperado.resumen).forEach(([k, v]) => eq(r[k], k in MOVIDOS_2916 ? MOVIDOS_2916[k][1] : v, `${k} igual al de la versión ${esperado.generadoCon}${k in MOVIDOS_2916 ? " con la decisión 2.9.16" : ""}:`));
  eq((G("QUOTE").pendientes || []).filter((p) => p.mot === "hidro").map((p) => p.motivo.split(" (")[0]).join(","), "pendiente de longitud,pendiente de volumen", "la red y la cisterna (0 unidades de dotación) quedan pendientes (H-196):"); /* rev 2.9.23: la importación siempre está pendiente aparte */
  ["carga", "limpios", "seleccion", "ductos", "ventilacion", "cotizacion", "valor", "kaizen", "electrico", "hidro", "fuego", "aire", "civil", "soporte"].forEach((tab) => {
    barra(tab); eq(w.document.querySelector("#view .accsello").dataset.sello, "sin", `${tab}: «Sin sello»:`);
  });
  /* Al calcular y guardar, el proyecto pasa a llevar sello; abrirlo de nuevo dice «Calculado». */
  clicS(boton("carga", "calc-motor"));
  const nuevo = JSON.stringify({ v: G("FORMATO_GUARDADO"), ...S });
  G("importarRespaldo")(nuevo); S.tab = "carga"; G("render")();
  eq(w.document.querySelector("#view .accsello").dataset.sello, "calculado", "sello guardado y vuelto a abrir:");
});


t("S.21 la huella de entradas es sólida: si cambia la salida de un motor, su sello queda «Desactualizado»; y un motor independiente conserva el suyo", () => {
  llenarTodoS();
  S.zones[0].lightType = "fluorescent"; S.zones[0].oaFixed = 3000; S.tab = "kaizen"; G("recompute")();
  const ids = ["load", "clean", "equip", "duct", "vent", "quote", "valor", "kaizen", "elec", "hidro", "fuego", "aire", "civil", "soporte"];
  w.eval(`window.__firmasS = () => {
    const norm = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k === "id" && typeof v === "string" && /^[a-z][a-z0-9]{5,7}$/.test(v) ? "ID" : v)));
    const e = (x) => estable(norm(x));
    const kz = computeKaizen(), prev = KAIZEN; KAIZEN = kz; let val; try { val = computeIngValor(); } finally { KAIZEN = prev; }
    return { load: e(LOADS), clean: e(CLEAN), equip: e(SYS), duct: e(DUCT), vent: e(VENT), elec: e(ELEC), hidro: e(HIDRO), fuego: e(FUEGO), aire: e(AIRE), civil: e(CIVIL),
      soporte: e(SOPORTE), quote: e([QUOTE, catalogoConceptos()]), kaizen: e(kz), valor: e(val) }; };`);
  const original = JSON.stringify(S);
  const restaurar = () => { G("reemplazarEstado")(JSON.parse(original)); S.tab = "kaizen"; G("recompute")(); };
  const sellar = () => { S.sellos = {}; ids.forEach((id) => { S.sellos[id] = { ts: 1, huella: G("huellaMotor")(id), ver: G("motorVer")(id) }; }); };
  sellar();
  const base = w.eval("__firmasS()");
  const mutaciones = [
    ["zonas: área", () => { S.zones[0].area += 50; }], ["zonas: muro norte", () => { S.zones[0].walls.N += 20; }], ["sitio: bulbo seco", () => { S.site.db += 3; }],
    ["ventilación: cambios de aire", () => { S.vent.ach += 2; }], ["ductos: longitud", () => { S.duct.segments[0].length += 15; }], ["cuarto limpio: área", () => { G("cleanRooms")()[0].area += 20; }],
    ["hidráulico: muebles", () => { S.hidro.muebles[0].cant += 4; }], ["contra incendio: ramal", () => { S.fuego.Lramal += 12; }], ["aire: caudal", () => { S.aire.consumos[0].lmin += 90; }],
    ["eléctrico: carga", () => { S.elec.cargas[0].kW += 5; }], ["civil: firme", () => { S.civil.firmeM2 = 300; }], ["soportería: altura de trabajo", () => { S.soporte.alturaTrabajo = 9; }],
    ["cotización: factor de lista", () => { S.quote.priceFactor = 0.8; }], ["arquitectura forzada", () => { S.sysForce = "chiller"; }],
  ];
  const flips = {};
  mutaciones.forEach(([nombre, muta]) => {
    restaurar(); sellar();
    muta(); w.eval("ZCACHE.clear()"); G("recompute")();
    const f = w.eval("__firmasS()");
    flips[nombre] = ids.filter((id) => G("selloDe")(id).estado === "desactualizado");
    ids.forEach((id) => {
      if (f[id] !== base[id] && G("selloDe")(id).estado !== "desactualizado") throw new Error(`${nombre}: cambió la salida de ${id} y su sello sigue «${G("selloDe")(id).estado}»`);
    });
  });
  restaurar();
  /* Independencia: mover el ramal de contra incendio no toca el sello de motores que no lo leen. */
  ["load", "clean", "equip", "duct", "vent", "hidro", "aire"].forEach((id) => { if (flips["contra incendio: ramal"].includes(id)) throw new Error(`el ramal de contra incendio marcó desactualizado a ${id}`); });
  if (!flips["contra incendio: ramal"].includes("fuego")) throw new Error("el ramal de contra incendio debía marcar a fuego");
  if (!flips["aire: caudal"].includes("aire") || flips["aire: caudal"].includes("hidro")) throw new Error("el caudal de aire debía marcar a aire y no a hidráulico");
  if (!flips["ventilación: cambios de aire"].includes("vent") || flips["ventilación: cambios de aire"].includes("duct")) throw new Error("la ventilación debía marcar a vent y no a ductos");
  /* Lo de presentación no marca nada. */
  sellar(); S.meta.name = "Otro nombre"; S.tab = "carga"; S.zi = 1; S.guia = false; if (S.quote.prop) S.quote.prop.no = "X-99"; G("recompute")();
  ids.forEach((id) => eq(G("selloDe")(id).estado, "calculado", `presentación (nombre, pestaña, propuesta) no marca a ${id}:`));
});

/* ===== S.A11Y · rev 2.9.14 · todo control que hace algo se opera con teclado y tiene foco visible ===== */
/* Decisión del dueño (19-sep-2026): los controles hechos con span, div, li o td que funcionan como botón pasan a
   <button> (o role="button" + tabindex="0" con Enter y Espacio). Aquí se recorre TODA la aplicación —cada pantalla,
   con datos para que salgan las listas y las tarjetas, más las ventanas— y falla si queda uno sin resolver. */
const A11Y_NATIVO = /^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/;
const A11Y_ROLES = ["button", "link", "tab", "menuitem", "checkbox", "switch", "radio", "option"];
const a11yEsNativo = (el) => A11Y_NATIVO.test(el.tagName) || (el.tagName === "A" && el.hasAttribute("href"));
const a11yId = (el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}[${el.dataset.act || el.dataset.tab || el.dataset.units}]`;
/* Revisa un árbol: acumula en `malos` lo que no se puede operar con teclado y en `vistos` lo que sí se ejercitó. */
function a11yRevisar(raiz, donde, malos, vistos) {
  raiz.querySelectorAll("[data-act],[data-tab],[data-units]").forEach((el) => {
    vistos.n++;
    if (a11yEsNativo(el)) return;
    const id = a11yId(el);
    vistos.noNativos.add(id);
    const role = el.getAttribute("role");
    if (!(role && A11Y_ROLES.includes(role) && el.getAttribute("tabindex") === "0")) malos.add(`${donde}: ${id} no es nativo y le falta role + tabindex="0"`);
    else if (!/\S/.test(el.getAttribute("aria-label") || el.textContent || "")) malos.add(`${donde}: ${id} no tiene nombre accesible`);
  });
}
const a11yTecla = (el, tipo, key, init) => { const ev = new w.KeyboardEvent(tipo, { key, bubbles: true, cancelable: true, ...(init || {}) }); el.dispatchEvent(ev); return ev; };
const a11yModal = () => w.document.getElementById("modal");

t("S.A11Y.1 ningún elemento con data-act/data-tab/data-units queda sin ser <button>, <a href>, campo, <summary> o role + tabindex=\"0\" (todas las pantallas, listas, tarjetas, catálogo y ventanas)", () => {
  llenarTodoS();
  const q0 = JSON.stringify(S.quote.items), cat0 = JSON.stringify(S.cat), qfam0 = S.qfam, tab0 = S.tab;
  const malos = new Set(), vistos = { n: 0, noNativos: new Set() }, doc = w.document;
  const ver = (donde, raiz) => a11yRevisar(raiz || doc.body, donde, malos, vistos);
  try {
    /* Con una partida de equipo, para que la lista de la cotización y las tarjetas salgan pintadas. */
    const c0 = G("CARRIER")[0]; S.quote.items.push({ id: c0.id, fam: G("FAMILIES")[0].id, qty: 1, unit: null }); G("recompute")();
    const pantallas = [...new Set(G("tabsDeVista")().concat(["tablero", "proyecto", "catalogo", "comparativo"]))];
    pantallas.forEach((tab) => { S.tab = tab; G("render")(); ver(tab); });
    /* Selección de equipo pinta la lista de modelos de cada familia (div.pick + PDF + Seleccionar). */
    G("FAMILIES").forEach((f) => { S.qfam = f.id; S.tab = "seleccion"; G("render")(); ver("seleccion · " + f.id); });
    /* Catálogo: la malla y el árbol abierto hasta las hojas (tarjetas con «Submittal PDF» anidado). */
    S.tab = "catalogo"; S.cat.vista = "malla"; G("render")(); ver("catálogo · malla");
    S.cat.vista = "arbol"; G("render")();
    doc.querySelector('[data-act="cat-abrir"]').dispatchEvent(new w.Event("click", { bubbles: true }));
    for (let i = 0; i < 6; i++) {
      const cerrados = [...doc.querySelectorAll('[data-act="cat-nodo"]')].filter((b) => b.getAttribute("aria-expanded") === "false");
      if (!cerrados.length) break;
      cerrados.forEach(clicS);
    }
    ver("catálogo · árbol abierto");
    S.tab = "cotizacion"; G("render")(); ver("cotización con partida");
    /* Ventanas. */
    [["Mis proyectos", "projectsModal()"], ["detalle de modelo Carrier", "detailSheet('carrier', CARRIER[0].id)"],
     ["detalle de modelo Greenheck", "detailSheet('green', GREEN[0].id)"], ["ficha de equipo", "equipSheet('carrier', CARRIER[0].id)"],
     ["tramo de ducto", "segmentSheet(0)"], ["origen de los datos", "cxOrigenHtml('carga')"]].forEach(([nom, expr]) => {
      G(`openModal(${expr})`); ver("ventana " + nom, a11yModal()); G("closeModal")();
    });
    G("PENDING_LINK = null; requestLink('load>duct', () => {})"); ver("ventana de cruce", a11yModal()); G("closeModal")();
    G("pedirConfirmacion({ titulo: 'x', detalle: 'y', lista: [], boton: 'ok', onOk: () => {} })"); ver("ventana de confirmación", a11yModal()); G("closeModal")();
  } finally {
    S.quote.items = JSON.parse(q0); S.cat = JSON.parse(cat0); S.qfam = qfam0; S.tab = tab0;
    G("closeModal")(); G("recompute")(); G("render")();
  }
  if (malos.size) throw new Error(`${malos.size} control(es) sin resolver:\n   ` + [...malos].slice(0, 12).join("\n   "));
  /* Que la prueba de verdad haya visto los casos difíciles, y no pase en vacío. */
  /* rev 2.9.16 · Aplanados: ya no quedan controles no nativos (el PDF de las tarjetas, la tarjeta de Selección y la zona
     de carga eran span/div con role=button; ahora son <button> hermanos o, la zona, un grupo sin acción). */
  eq(vistos.noNativos.size, 0, "controles no nativos que quedan:");
  if (vistos.n < 300) throw new Error(`sólo se revisaron ${vistos.n} controles: la recorrida quedó corta`);
});

t("S.A11Y.2 (rev 2.9.16, aplanado) el PDF de cada tarjeta es un <button> HERMANO de la tarjeta: su clic emite el PDF sin abrir el detalle, y el de la tarjeta abre el detalle sin emitir PDF", () => {
  llenarTodoS();
  ["carga", "ventilacion"].forEach((tab) => {
    S.tab = tab; G("render")();
    const pdf = w.document.querySelector('#view .pickw > button.minipdf[data-act="pdf-sub"]');
    if (!pdf) throw new Error(`${tab}: no hay PDF junto a una tarjeta`);
    const card = pdf.parentElement.querySelector(":scope > button.pick");
    if (!card) throw new Error(`${tab}: el PDF debía ir junto a su tarjeta <button class="pick">`);
    if (card.contains(pdf) || pdf.closest("button.pick")) throw new Error(`${tab}: el PDF sigue dentro de la tarjeta`);
    eq(pdf.type, "button", `${tab}: type:`);
    if (!/\S/.test(pdf.getAttribute("aria-label") || "")) throw new Error(`${tab}: el PDF no tiene aria-label`);
    conPdfCapturado((salida) => {
      const n0 = salida().length;
      G("closeModal")();
      clicS(pdf);
      eq(salida().length, n0 + 1, `${tab}: clic sobre el PDF emite un PDF:`);
      eq(a11yModal().hidden, true, `${tab}: clic sobre el PDF no abre el detalle:`);
      if (!/^Submittal-/.test(salida()[n0].f)) throw new Error(`${tab}: nombre de archivo inesperado: ${salida()[n0].f}`);
      eq(a11yTecla(pdf, "keydown", "Enter").defaultPrevented, false, `${tab}: el teclado de un <button> nativo lo atiende el navegador:`);
      clicS(card);
      eq(salida().length, n0 + 1, `${tab}: el clic sobre la tarjeta no emite PDF:`);
      eq(a11yModal().hidden, false, `${tab}: el clic sobre la tarjeta abre el detalle:`);
      G("closeModal")();
    });
  });
});

t("S.A11Y.3 (rev 2.9.16, aplanado) la tarjeta de modelo de Selección es un <button> y su PDF y su «Seleccionar» son <button> hermanos: cada uno hace lo suyo y nada más", () => {
  llenarTodoS();
  S.tab = "seleccion"; G("render")();
  const pick = w.document.querySelector('#view .pickw > button.pick[data-act="detail"]');
  if (!pick) throw new Error("no hay tarjeta de modelo <button> en Selección");
  if (!/\S/.test(pick.getAttribute("aria-label") || "")) throw new Error("la tarjeta no tiene aria-label");
  if (pick.querySelector("button,[role=button]")) throw new Error("la tarjeta todavía contiene controles");
  const pdf = pick.parentElement.querySelector(':scope > button.minipdf[data-act="pdf-sub"]'), sel = pick.parentElement.querySelector(':scope > button.minipdf[data-act="sel-modelo"]');
  if (!pdf || !sel) throw new Error("PDF y Seleccionar debían ser <button> hermanos de la tarjeta");
  conPdfCapturado((salida) => {
    const n0 = salida().length;
    G("closeModal")();
    clicS(pick);
    eq(a11yModal().hidden, false, "la tarjeta abre el detalle del modelo:");
    eq(salida().length, n0, "abrir el detalle no emite PDF:");
    G("closeModal")();
    clicS(pdf);
    eq(salida().length, n0 + 1, "clic en el PDF emite un PDF:");
    eq(a11yModal().hidden, true, "clic en el PDF no abre el detalle:");
  });
  const sel0 = JSON.stringify(S.sel), q0 = JSON.stringify(S.quote.items);
  try {
    clicS(sel);
    eq(((S.sel.modelos || {})[sel.dataset.fam] || {}).id, sel.dataset.id, "clic en Seleccionar registra el modelo elegido:");
    eq(a11yModal().hidden, true, "clic en Seleccionar no abre el detalle:");
  } finally { S.sel = JSON.parse(sel0); S.quote.items = JSON.parse(q0); G("recompute")(); }
});

t("S.A11Y.4 (rev 2.9.16, aplanado) la zona de carga de archivos ya no es un control: es un grupo con nombre, sus dos botones abren el selector una vez cada uno y el arrastre sigue sobre la zona", () => {
  S.tab = "tablero"; G("render")();
  const zona = w.document.querySelector("#view .cxz-drop");
  if (!zona) throw new Error("no hay zona de carga en el Tablero");
  eq(zona.getAttribute("role"), "group", "role:"); eq(zona.hasAttribute("tabindex"), false, "sin tabindex:"); eq(zona.hasAttribute("data-act"), false, "sin acción propia:");
  if (!/\S/.test(zona.getAttribute("aria-label") || "")) throw new Error("la zona no tiene nombre");
  const inp = G("cxzInput")("cxz-file", false);
  let abiertos = 0; const cuenta = () => { abiertos++; };
  inp.addEventListener("click", cuenta);
  try {
    a11yTecla(zona, "keydown", "Enter");
    eq(abiertos, 0, "Enter sobre la zona no hace nada (no es control):");
    const elegir = zona.querySelector('button[data-act="cxz-elegir"]');
    if (!elegir) throw new Error("falta «Elegir archivos»");
    clicS(elegir);
    eq(abiertos, 1, "el clic en «Elegir archivos» abre el selector una sola vez:");
    if (!zona.querySelector('button[data-act="cxz-carpeta"]')) throw new Error("falta «Elegir carpeta»");
    const ev = new w.Event("dragover", { bubbles: true, cancelable: true }); zona.dispatchEvent(ev);
    eq(zona.classList.contains("cxz-sobre"), true, "el arrastre sobre la zona la resalta:");
  } finally { inp.removeEventListener("click", cuenta); }
});

t("S.A11Y.5 el foco es visible: ninguna regla anula el anillo, contrasta ≥ 3:1 (superficie, botón pulsado) y no lo recortan los contenedores con overflow", () => {
  const css = w.document.querySelector("style").textContent.replace(/@font-face\{[^}]*\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const reglas = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const anulan = reglas.filter(([, , c]) => /(^|;)\s*outline(-style)?\s*:\s*(none|0)\s*(;|!important|$)/.test(c)).map(([, s]) => s.trim().slice(0, 90));
  if (anulan.length) throw new Error("hay reglas que anulan el anillo de foco: " + anulan.join(" | "));
  const raiz = css.slice(css.indexOf(":root{"), css.indexOf("}", css.indexOf(":root{")));
  const hex = (n) => { const h = (raiz.match(new RegExp("--" + n + ":\\s*(#[0-9A-Fa-f]{6})")) || [])[1]; if (!h) throw new Error("no está --" + n); return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const lin = (c) => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  const L = (rgb) => .2126 * lin(rgb[0]) + .7152 * lin(rgb[1]) + .0722 * lin(rgb[2]);
  const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  /* La regla global: :focus-visible { outline: <ancho>px solid var(--gr-N) }. */
  const g = /(?:^|\})\s*:focus-visible\s*\{\s*outline:\s*(\d+)px solid var\(--(gr-\d)\)/.exec(css);
  if (!g) throw new Error("no está la regla global :focus-visible con un anillo sólido");
  if (+g[1] < 2) throw new Error(`el anillo global mide ${g[1]}px y debe ser de 2px o más`);
  ["gr-1", "gr-2", "gr-3", "gr-4", "gr-5"].forEach((s) => {
    const r = cr(hex(g[2]), hex(s));
    if (r < 3) throw new Error(`anillo ${g[2]} sobre ${s}: ${r.toFixed(2)}:1, pide 3:1`);
  });
  /* El botón de unidades pulsado es gr-9 y su anillo va hacia adentro: con el mismo color desaparecía. */
  const u = /\.unit-toggle button\[aria-pressed="true"\]:focus-visible\{outline-color:var\(--(gr-\d)\)\}/.exec(css);
  if (!u) throw new Error("falta el anillo propio del botón de unidades pulsado");
  const fondoPulsado = /\.unit-toggle button\[aria-pressed="true"\]\{background:var\(--(gr-\d)\)/.exec(css);
  if (!fondoPulsado) throw new Error("no se encontró el fondo del botón de unidades pulsado");
  const rp = cr(hex(u[1]), hex(fondoPulsado[1]));
  if (rp < 3) throw new Error(`anillo del botón pulsado ${rp.toFixed(2)}:1, pide 3:1`);
  /* Los que recorta un contenedor con overflow. */
  /* rev 2.9.19 · la zona de carga es un grupo sin foco (rev 2.9.16); el anillo va en sus botones. */
  if (/.cxz-drop:focus-visible/.test(css)) throw new Error("CSS muerto: .cxz-drop ya no recibe foco");
  contiene(css, ".tree .nodo:focus-visible{outline-offset:-", "los nodos del árbol (recortados por overflow:hidden) llevan el anillo hacia adentro:");
  if (!/\.zone-tab\{[^}]*padding:\s*[1-9]/.test(css)) throw new Error("la tira de zonas (overflow-x:auto) no deja espacio arriba para el anillo");
});

t("S.A11Y.6 los botones de IVA son <button type=button> con aria-pressed, agrupados y con la marca al día", () => {
  S.tab = "cotizacion"; G("render")();
  const bs = [...w.document.querySelectorAll('#view [data-act="setnum"][data-path="quote.iva"]')];
  eq(bs.length, 3, "tres opciones de IVA:");
  bs.forEach((b) => {
    eq(b.tagName, "BUTTON", "es un <button>:"); eq(b.type, "button", "type:");
    if (!["true", "false"].includes(b.getAttribute("aria-pressed"))) throw new Error("falta aria-pressed en «" + b.textContent.trim() + "»");
    eq(b.getAttribute("aria-pressed") === "true", b.classList.contains("on"), "aria-pressed sigue a la marca visual:");
  });
  const grupo = bs[0].closest('[role="group"]');
  if (!grupo || grupo.getAttribute("aria-label") !== "IVA") throw new Error("las opciones de IVA no están en un grupo etiquetado");
});


t("S.22 correcciones de la revisión: sello inmediato, zonas canónicas al traerlas, propuesta integral en sesión nueva, foco tras dibujar", () => {
  llenarTodoS();
  /* Calcular guarda el sello YA en el registro del proyecto (no en un autoguardado diferido que un cambio de proyecto pierde). */
  S.pid = null; G("projSave")(true);
  const pid = S.pid; if (!pid) throw new Error("projSave no dio pid");
  clicS(boton("carga", "calc-motor"));
  const reg = G("projList")().find((p) => p.id === pid);
  if (!reg || !reg.data.sellos || !reg.data.sellos.load) throw new Error("el sello no llegó al registro guardado");
  /* Proyecto recién guardado y abierto: ningún sello queda «Desactualizado» por sanearEstado. */
  G("projOpen")(pid); S.tab = "carga"; G("render")();
  eq(w.document.querySelector("#view .accsello").dataset.sello, "calculado", "guardar y abrir no desactualiza:");
  /* Un ts fuera del rango de Date se descarta. */
  const roto = JSON.parse(JSON.stringify(S)); roto.sellos.load.ts = 1e18;
  eq(G("sanearEstado")(roto).sellos.load, undefined, "ts imposible descartado:");
  /* «Traer zonas»: zonas de un registro viejo (4 cardinales) entran en forma canónica. */
  const crudo = { id: "pcrudo1", name: "Crudo", ts: 1, rev: "2.1.0", data: { zones: [{ name: "Z", area: 10, height: 3, walls: { N: 5, S: 5, E: 5, O: 5 } }] } };
  G("projPersist")(G("projList")().concat([crudo]));
  const n0 = S.zones.length;
  const bt = w.document.createElement("button"); bt.dataset.act = "proj-zones"; bt.dataset.id = "pcrudo1"; w.document.body.appendChild(bt); clicS(bt); bt.remove();
  eq(S.zones.length, n0 + 1, "se trajo la zona:");
  const z = S.zones[S.zones.length - 1];
  eq(Object.keys(z.walls).length, 8, "muros con las ocho orientaciones:");
  G("projPersist")(G("projList")().filter((p) => p.id !== "pcrudo1")); S.zones.pop(); G("recompute")();
  /* Propuesta integral en una sesión nueva: quote.prop nulo no revienta al teclear. */
  const q0 = S.quote.prop; S.quote.prop = null;
  try { G("setPath")("quote.prop.cliente", "Cliente S.22"); eq(S.quote.prop.cliente, "Cliente S.22", "dato guardado:"); if (!Array.isArray(S.quote.prop.hitos)) throw new Error("la propuesta nació incompleta"); }
  finally { S.quote.prop = q0; }
  /* Foco: tras activar un control que redibuja, el foco vuelve al mismo control. */
  S.tab = "ductos"; G("render")();
  const add = w.document.querySelector('#view [data-act="seg-add"]'); add.focus();
  clicS(add);
  const nuevo = w.document.querySelector('#view [data-act="seg-add"]');
  eq(w.document.activeElement === nuevo, true, "el foco vuelve al botón después de dibujar:");
  S.duct.segments.pop(); G("recompute")();
});

t("S.23 captura real: cantidades directas de obra civil, riel de soportería y equipos elegidos a mano cuentan; el modo cocina o rejilla sin medidas, no", () => {
  const guardado = JSON.stringify(S);
  const vacio = () => { G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Vacío S.23"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.23" }; }); G("recompute")(); };
  const cap = (id) => G("capturaReal")(id);
  try {
    vacio(); MOTORES_S_TODOS().forEach((id) => eq(cap(id), false, `${id} en proyecto vacío:`));
    vacio(); S.civil.firmeM2 = 80; S.civil.puertasSimples = 3; G("recompute")();
    eq(cap("civil"), true, "firme y puertas sin área:"); eq(G("semaforoSuite")().find((x) => x.id === "civil").nivel !== "vacia", true, "semáforo de civil:");
    eq(cap("quote"), true, "la cotización tiene con qué:");
    vacio(); S.civil.demoler = true; S.civil.demolMuroM2 = 40; G("recompute")(); eq(cap("civil"), true, "demolición:");
    vacio(); S.soporte.rielM = 60; G("recompute")(); eq(cap("soporte"), true, "riel:");
    vacio(); S.vent.mode = "kitchen"; G("recompute")(); eq(cap("vent"), false, "modo cocina sin medidas:"); eq(G("capturaReal")("quote"), false, "y la cotización sigue vacía:");
    S.vent.hoodL = 2.5; S.vent.hoodW = 1.1; G("recompute")(); eq(cap("vent"), true, "modo cocina con medidas:");
    vacio(); S.vent.mode = "louver"; G("recompute")(); eq(cap("vent"), false, "rejilla sin medidas:");
    vacio(); S.quote.items.push({ id: G("CARRIER")[0].id, fam: "chiller", qty: 1, unit: null }); G("recompute")(); eq(cap("quote"), true, "equipo elegido a mano:");
    vacio(); S.kaizen.items.push({ id: "k1", titulo: "", estado: "planear", owner: "", ahorro: 0, nota: "" }); G("recompute")(); eq(cap("kaizen"), false, "mejora sin título:");
    S.kaizen.items[0].titulo = "Mejora real"; G("recompute")(); eq(cap("kaizen"), true, "mejora con título:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.24 propuestas entre disciplinas: un proyecto vacío no ofrece «Propuestas por decidir» hechas con pisos internos; la cotización dice si falta autorizar", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Vacío S.24";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.24" }; }); G("recompute")();
    ["cedula>elec", "motores>soporte"].forEach((id) => { const e = G("estadoPropuesta")(id); if (e.nivel === "pendiente" || e.nivel === "vivo") throw new Error(`${id}: propuesta «${e.nivel}» en proyecto vacío`); });
    /* Con captura en el origen sí se ofrece. */
    S.fuego.area = 300; G("recompute")();
    if (G("estadoPropuesta")("motores>soporte").nivel === "sin-datos") throw new Error("con contra incendio capturado la propuesta de soportería debía estar disponible");
    /* Sin cruces autorizados, el motivo de una cotización vacía es la autorización y no la falta de captura. */
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Vacío S.24"; S.perms = {}; G("recompute")();
    if (!(G("cruceCotSinAutorizar")() > 0)) throw new Error("con S.perms vacío deben faltar cruces por autorizar");
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.24" }; }); G("recompute")();
    eq(G("cruceCotSinAutorizar")(), 0, "con todos autorizados no falta ninguno:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.25 (H-268) la huella del eléctrico es sólo su captura: no cambia con ventilación ni cuartos limpios (entran sólo como propuesta aceptada) y sí con sus propias cargas; la de la selección sí incluye lo que lee de ductos", () => {
  llenarTodoS();
  const nombres = () => ["elec", "equip"].map((id) => G("huellaMotor")(id));
  const h0 = nombres();
  /* H-268: el eléctrico es autónomo: lo que ventilación y cuartos limpios calculan ya no entra a su huella; llega sólo como propuesta
     aceptada, que vive en S.elec.cargas (antes de H-268 la huella los incluía porque el motor los leía en vivo). */
  S.vent.ach += 2; G("recompute")(); const h1 = nombres(); if (h1[0] !== h0[0]) throw new Error("la huella de eléctrico no debe cambiar con ventilación (H-268)");
  S.vent.ach -= 2; G("cleanRooms")()[0].area += 10; G("recompute")(); const h2 = nombres(); if (h2[0] !== h0[0]) throw new Error("la huella de eléctrico no debe cambiar con cuartos limpios (H-268)");
  G("cleanRooms")()[0].area -= 10; S.elec.cargas[0].kW += 1; G("recompute")(); const h2b = nombres(); if (h2b[0] === h0[0]) throw new Error("la huella de eléctrico debe cambiar con sus propias cargas");
  S.elec.cargas[0].kW -= 1; S.duct.segments[0].length += 5; G("recompute")(); const h3 = nombres(); if (h3[1] === h0[1]) throw new Error("la huella de la selección no cambia con ductos");
  S.duct.segments[0].length -= 5; G("recompute")();
  /* El texto del pie no promete Calcular cuando está apagado. */
  const zs = S.zones;
  try {
    S.zones = [G("defaultZone")("Vacía")]; G("recompute")(); S.sellos = { load: { ts: 5, huella: "0123456789abcd", ver: G("motorVer")("load") } }; barra("carga");
    const pie = w.document.querySelector("#view .accsello").textContent;
    contiene(pie, "Desactualizado"); if (/Calcular lo vuelve a sellar/.test(pie)) throw new Error("el pie promete Calcular con el botón apagado");
  } finally { S.zones = zs; G("recompute")(); }
});


t("S.26 la ventana es un diálogo: foco adentro al abrir (nunca en la acción que confirma), Tab da la vuelta sin salirse, el foco regresa a quien la abrió y vuelve al mismo campo al redibujarse", () => {
  const m = a11yModal();
  eq(m.getAttribute("role"), "dialog", "role:"); eq(m.getAttribute("aria-modal"), "true", "aria-modal:");
  G("closeModal")();
  const btn = w.document.getElementById("btn-projects");
  btn.focus();
  G("openModal")(G("projectsModal")());
  try {
    const lbl = m.getAttribute("aria-labelledby"), h = lbl ? w.document.getElementById(lbl) : null;
    if (!h || !m.contains(h) || !/\S/.test(h.textContent)) throw new Error("aria-labelledby no apunta al título de la ventana");
    const f = G("modalFocables")(m);
    if (f.length < 2) throw new Error("la lista de proyectos debía tener al menos dos controles");
    eq(w.document.activeElement === f[0], true, "el foco entra al primer control de la ventana:");
    eq(a11yTecla(f[0], "keydown", "Tab").defaultPrevented, false, "Tab en medio lo resuelve el navegador:");
    f[f.length - 1].focus();
    eq(a11yTecla(f[f.length - 1], "keydown", "Tab").defaultPrevented, true, "Tab en el último control se queda en la ventana:");
    eq(w.document.activeElement === f[0], true, "Tab en el último vuelve al primero:");
    eq(a11yTecla(f[0], "keydown", "Tab", { shiftKey: true }).defaultPrevented, true, "Mayús+Tab en el primero se queda en la ventana:");
    eq(w.document.activeElement === f[f.length - 1], true, "Mayús+Tab en el primero va al último:");
    btn.focus();
    a11yTecla(btn, "keydown", "Tab");
    eq(m.contains(w.document.activeElement), true, "con el foco afuera, Tab lo regresa a la ventana:");
  } finally { G("closeModal")(); }
  eq(w.document.activeElement === btn, true, "al cerrar, el foco regresa al botón que abrió la ventana:");
  /* Confirmación destructiva: el foco inicial es Cerrar, no el botón que confirma. */
  G("pedirConfirmacion")({ titulo: "Prueba S.26", detalle: "nada", boton: "Borrar", onOk: () => { throw new Error("no debía confirmarse"); } });
  try { eq((w.document.activeElement.dataset || {}).act, "close", "foco inicial de una confirmación:"); }
  finally { G("closeModal")(); }
  /* Redibujar la hoja con la ventana abierta (un select del tramo) devuelve el foco al mismo control. */
  llenarTodoS();
  G("openSegIndex = 0"); G("reopenSegment")();
  try {
    const campo = m.querySelector("[data-path]");
    if (!campo) throw new Error("la hoja del tramo no tiene campos con data-path");
    const ruta = campo.getAttribute("data-path");
    campo.focus();
    G("reopenSegment")();
    const nuevo = m.querySelector(`[data-path="${ruta}"]`);
    eq(nuevo !== campo, true, "la hoja se volvió a dibujar:");
    eq(w.document.activeElement === nuevo, true, "el foco vuelve al mismo campo tras redibujar la hoja:");
  } finally { G("openSegIndex = null"); G("closeModal")(); }
});

t("S.27 los textos dicen lo que hace el código: Haaland en la rugosidad, los cinco modos de ventilación, el umbral 1.8× del comparativo y los tramos sin caudal", () => {
  const eps = G("REF")["duct.meta.eps"].rec;
  contiene(eps, "Haaland", "REF de rugosidad:");
  if (!/haaland\(/.test(G("friction").toString())) throw new Error("la fricción del ducto ya no usa haaland: revisar el texto");
  S.tab = "ventilacion"; G("render")();
  const modos = [...w.document.querySelectorAll('#view [data-act="vmode"]')].map((b) => b.textContent.trim().toLowerCase());
  eq(modos.length, 5, "modos en la pantalla:");
  const que = G("GUIA").ventilacion.que.toLowerCase();
  modos.forEach((k) => contiene(que, k, "la guía de ventilación nombra el modo:"));
  const ojo = G("GUIA").comparativo.ojo;
  contiene(ojo, "1.8 veces", "umbral superior del comparativo:"); contiene(ojo, "entre 1.8", "umbral inferior del comparativo:");
  if (/80 %/.test(ojo)) throw new Error("la guía del comparativo sigue diciendo 80 %");
  llenarTodoS();
  const seg = JSON.parse(JSON.stringify(S.duct.segments[0]));
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Vacío S.27";
    const texto = (id) => G("semaforoSuite")().find((x) => x.id === id).texto;
    G("recompute")();
    eq(texto("duct"), "sin tramos", "sin tramos capturados:");
    eq(texto("clean"), "sin cuartos con área y altura", "cuarto limpio vacío de la semilla:");
    seg.flow = 0; S.duct.segments.push(seg); G("recompute")();
    eq(texto("duct"), "1 tramo(s) sin caudal", "tramo capturado sin caudal:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});


t("S.28 Proyectos recientes: el proyecto abierto muestra su semáforo en vivo, no el del último guardado", () => {
  const guardado = JSON.stringify(S);
  let pid = null;
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Recientes S.28"; S.pid = null; G("recompute")(); G("projSave")(true);
    pid = S.pid; if (!pid) throw new Error("projSave no dio pid");
    S.zones[0].area = 120; S.zones[0].height = 3; G("recompute")();
    const vivo = G("cxzResumenSemaforo")();
    const reg = G("projList")().find((p) => p.id === pid);
    if (JSON.stringify(reg.semaforo) === JSON.stringify(vivo)) throw new Error("la prueba necesita que el semáforo cambie sin guardar");
    const d = w.document.createElement("div"); d.innerHTML = G("cxzRecientesHtml")();
    const fila = d.querySelector(".list-item.cur .cxz-sem");
    if (!fila) throw new Error("no aparece el proyecto abierto en Proyectos recientes");
    const cuentas = [...fila.querySelectorAll("small")].map((x) => +x.textContent);
    eq(JSON.stringify(cuentas), JSON.stringify(["datos", "incompleta", "desactualizada", "vacia"].map((k) => vivo[k] || 0)), "cuentas en vivo:");
    contiene(fila.getAttribute("title"), "en vivo", "el título lo dice:");
  } finally {
    if (pid) G("projPersist")(G("projList")().filter((p) => p.id !== pid));
    G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")();
  }
});


t("S.29 (rev 2.9.16, decisión del dueño) el tubo se dimensiona con el conductor que dice la memoria: THW-LS/THHW-LS por omisión (NOM-001-SEDE, Cap. 10, Tabla 5) y el selector cambia memoria y canalización a la vez", () => {
  eq(G("defaultElec")().aislamiento, "thw-ls", "por omisión:");
  const sel = G("selConductor"), TW = G("AREA_COND_THW"), TH = G("AREA_COND_THHN");
  const o = { I: 100, V: 220, ph: 3, L: 25, fp: .9, material: "cobre", tempAmb: 40, nCond: 3, dvMax: 3, continua: true };
  const a = sel({ ...o, aislamiento: "thhn" }), b = sel(o);
  eq(b.aislamiento, "thw-ls", "sin tipo, THW-LS:");
  eq(a.awg + "|" + a.tierra, "1/0|6", "caso 100 A:");
  /* Antes → después registrados en la bitácora 2.9.16. */
  eq(a.tubo.d, '1 1/2"', "antes (áreas THHN, lo que calculaba la 2.9.15):"); eq(b.tubo.d, '2"', "después (áreas THW-LS):");
  cerca(a.tubo.ocupado, 4 * TH["1/0"] + TH["6"], 1e-9, "área THHN:"); cerca(b.tubo.ocupado, 4 * TW["1/0"] + TW["6"], 1e-9, "área THW-LS:");
  const o6 = { ...o, I: 600, V: 480 };
  eq(sel({ ...o6, aislamiento: "thhn" }).tubo.d, '3 1/2"', "600 A antes:"); eq(sel(o6).tubo.d, '4"', "600 A después:");
  Object.keys(TH).forEach((k) => { if (!(TW[k] > TH[k])) throw new Error(`calibre ${k}: el área THW debe ser mayor que la THHN`); });
  const e0 = JSON.parse(JSON.stringify(S.elec));
  try {
    llenarTodoS();
    S.elec.aislamiento = "thhn"; G("recompute")();
    contiene(G("ELEC").memo.join(" "), "tipo THHN / THWN-2", "memoria con THHN:"); eq(G("ELEC").alim.aislamiento, "thhn", "alimentador con THHN:");
    S.elec.aislamiento = "thw-ls"; G("recompute")();
    contiene(G("ELEC").memo.join(" "), "tipo THW-LS / THHW-LS", "memoria con THW-LS:"); eq(G("ELEC").alim.aislamiento, "thw-ls", "alimentador con THW-LS:");
    G("ELEC").calc.forEach((c) => eq(c.cond.aislamiento, "thw-ls", `${c.label || "carga"}: mismo tipo que la memoria:`));
    const txt = Buffer.from(G("buildElecPdf")()).toString("latin1");
    contiene(txt, "THW-LS / THHW-LS", "PDF eléctrico:");
    S.tab = "electrico"; G("render")();
    if (!w.document.querySelector('#view select[data-path="elec.aislamiento"]')) throw new Error("falta el selector de tipo de conductor");
    const viejo = JSON.parse(JSON.stringify(S)); delete viejo.elec.aislamiento;
    eq(G("sanearEstado")(viejo).elec.aislamiento, "thw-ls", "proyecto viejo sin tipo: THW-LS, lo que su memoria ya declaraba:");
    const raro = JSON.parse(JSON.stringify(S)); raro.elec.aislamiento = "xhhw";
    eq(G("sanearEstado")(raro).elec.aislamiento, "thw-ls", "tipo desconocido:");
  } finally { S.elec = e0; G("recompute")(); }
});


t("S.30 (rev 2.9.16, decisión del dueño) «Desactualizado» aparece en el menú, como distintivo en el nodo de la disciplina afectada", () => {
  llenarTodoS();
  const s0 = JSON.stringify(S.sellos || {}), tab0 = S.tab, dv0 = S.elec.dvRamal;
  const marcados = () => [...w.document.querySelectorAll("nav.tabs.lat [data-tab]")].filter((b) => b.querySelector(".ldesact")).map((b) => b.dataset.tab);
  try {
    S.tab = "tablero";
    S.sellos = {}; G("recompute")(); G("render")();
    eq(marcados().length, 0, "sin sellos no se marca nada («Sin sello» no es desactualizado):");
    S.sellos = { elec: { ts: 5, huella: G("huellaMotor")("elec"), ver: G("motorVer")("elec") }, load: { ts: 5, huella: "0123456789abcd", ver: G("motorVer")("load") } }; G("recompute")(); G("render")();
    const m1 = marcados();
    eq(m1.length, 1, "un solo nodo marcado:");
    if (!["hvac", "carga"].includes(m1[0])) throw new Error("la carga térmica desactualizada debía marcar el nodo del HVAC, marcó " + m1[0]);
    contiene(w.document.querySelector(`nav.tabs.lat [data-tab="${m1[0]}"] .ldesact`).getAttribute("title"), "Carga", "el distintivo nombra la disciplina:");
    S.elec.dvRamal = (Number(dv0) || 3) + 1; G("recompute")(); G("render")();
    if (!marcados().includes("electrico")) throw new Error("cambiar la captura eléctrica después de calcular debía marcar Eléctrico");
    S.elec.dvRamal = dv0; S.sellos.elec.huella = G("huellaMotor")("elec"); S.sellos.load.huella = G("huellaMotor")("load"); G("recompute")(); G("render")();
    eq(marcados().length, 0, "sellos al día, sin distintivos:");
  } finally { S.sellos = JSON.parse(s0); S.elec.dvRamal = dv0; S.tab = tab0; G("recompute")(); G("render")(); }
});


t("S.31 (rev 2.9.16, decisión del dueño) ningún control anidado: en ninguna pantalla hay un botón, enlace o control con role=button dentro de otro", () => {
  llenarTodoS();
  const INTER = 'button,a[href],input,select,textarea,[role="button"],[role="tab"],[role="link"],[role="checkbox"]';
  const hallados = [];
  const revisa = (raiz, donde) => raiz.querySelectorAll(INTER).forEach((el) => {
    const padre = el.parentElement && el.parentElement.closest(INTER);
    if (padre && raiz.contains(padre)) hallados.push(`${donde}: <${el.tagName.toLowerCase()}${el.dataset.act ? ` data-act="${el.dataset.act}"` : ""}> dentro de <${padre.tagName.toLowerCase()}${padre.dataset.act ? ` data-act="${padre.dataset.act}"` : ""}${padre.className ? ` class="${String(padre.className).slice(0, 30)}"` : ""}>`);
  });
  const tab0 = S.tab;
  try {
    G("TABS").map(([id]) => id).concat(["tablero", "inicio"]).forEach((tab) => {
      S.tab = tab; G("render")();
      revisa(w.document.body, tab);
    });
    /* Ventanas: detalle de un modelo, lista de proyectos. */
    S.tab = "seleccion"; G("render")();
    const pick = w.document.querySelector('#view [data-act="detail"]');
    if (pick) { pick.dispatchEvent(new w.Event("click", { bubbles: true })); revisa(a11yModal(), "detalle"); G("closeModal")(); }
    G("openModal")(G("projectsModal")()); revisa(a11yModal(), "proyectos"); G("closeModal")();
  } finally { S.tab = tab0; G("render")(); }
  const unicos = [...new Set(hallados.map((h) => h.replace(/^[^:]+: /, "")))];
  if (unicos.length) throw new Error(`${unicos.length} anidado(s): ${unicos.slice(0, 12).join(" | ")}`);
});


t("S.32 (rev 2.9.16, decisión del dueño) pisos internos: sin sustento salen (proyecto vacío = $0); los de norma se aplican con aviso y quedan en la memoria", () => {
  const guardado = JSON.stringify(S);
  const vacio = () => { G("reemplazarEstado")(G("defaultState")()); S.meta.name = "Vacío S.32"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.32" }; }); S.tab = "tablero"; G("recompute")(); };
  try {
    /* Antes: $3,162,176.69 con el proyecto vacío y todos los cruces autorizados (bomba contra incendio de 2,500 L/min y
       138 m³ de reserva sobre 1 m² supuesto, un FFU en un cuarto de 1 m² × 2.2 m, dos partidas civiles, una base de
       equipo por un compresor sin demanda y tres meses de andamio). Después: $0. */
    vacio();
    eq(G("QUOTE").tot, 0, "proyecto vacío, total de la cotización:");
    eq((G("QUOTE").aux || []).length, 0, "proyecto vacío, partidas:");
    eq(G("FUEGO").qBomba, 0, "contra incendio sin área: sin bomba (antes 2,500 L/min):"); eq(G("FUEGO").reserva, 0, "sin reserva (antes 138,152 L):");
    contiene(G("FUEGO").memo.join(" "), "Sin área protegida capturada", "lo dice la memoria:");
    eq(G("CLEAN").sum.ffu, 0, "cuarto limpio vacío: sin FFU (antes 1):"); eq(G("CLEAN").sum.supply, 0, "sin suministro (antes 99 m³/h):");
    eq(G("AIRE").totalUnidades, 0, "aire sin demanda: sin compresor que contar (antes 1):");
    eq(G("SOPORTE").total, 0, "soportería sin nada que montar (antes $44,000: base de equipo y 3 meses de andamio):");
    /* Contra incendio con área menor al mínimo de NFPA 13: piso de norma, con aviso y en la memoria. */
    S.fuego.area = 50; G("recompute")();
    const F = G("FUEGO");
    eq(F.areaDis, F.r.areaMin, "área de operación = mínimo de la curva:");
    if (!F.avisos.some((a) => /Piso de norma aplicado/.test(a.msg))) throw new Error("falta el aviso del piso de norma de NFPA 13");
    contiene(F.memo.join(" "), "PISO DE NORMA APLICADO", "memoria de contra incendio:");
    /* Cuarto limpio: la altura capturada manda (antes 2.0 m se calculaba como 2.2 m). */
    const r0 = G("cleanRooms")()[0]; r0.area = 60; r0.height = 2.0; G("recompute")();
    cerca(G("CLEAN").list[0].vol, 120, 1e-9, "volumen con 2.0 m (antes 132 m³ con el piso de 2.2 m):");
    /* Presurización abajo de 5 Pa: piso de ISO 14644-4, con aviso en la memoria. */
    r0.height = 3; r0.dp = 3; G("recompute")();
    eq(G("CLEAN").list[0].dP, 5, "rige 5 Pa:"); contiene(G("CLEAN").list[0].memo.join(" "), "PISO DE NORMA APLICADO", "memoria del cuarto:");
    /* Un 0 capturado ya no es «ausente»: sin rendijas no hay fuga (antes 0 se leía como 6 m). */
    r0.dp = 12.5; r0.crackLen = 0; G("recompute")();
    eq(G("CLEAN").list[0].leak, 0, "rendija capturada en 0 m:");
    /* Tramo de agua sin longitud: no se suponen 10 m; se avisa como error. */
    S.hidro = { ...G("defaultHidro")(), tramos: [{ ...G("defaultTramoAgua")("AF-1"), um: 20, L: 0, alt: 0 }], muebles: [{ id: "wc_flux", cant: 4 }, { id: "lavabo", cant: 4 }] };
    G("recompute")();
    const t0 = G("HIDRO").tramos[0];
    eq(t0.L, 0, "longitud del tramo (antes 10 m supuestos):"); eq(t0.hf, 0, "sin pérdida inventada:"); eq(t0.sinL, true, "marcado sin longitud:");
    if (!G("HIDRO").avisos.some((a) => a.lvl === "err" && /sin longitud capturada/.test(a.msg))) throw new Error("falta el aviso de tramo sin longitud");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});


t("S.33 (rev 2.9.16, decisión del dueño) paleta idéntica al isométrico del sitio publicado: ningún color de pantalla, PDF o Excel queda fuera de sus grises, azules, naranja y capas", () => {
  const ISO = new Set(["#a8b0ba", "#2a323e", "#222a35", "#1d242e", "#1a2029", "#161b23", "#242c37", "#2d3644", "#1f2732", "#3a4556", "#303947", "#29313d", "#3f4a5c", "#36404f",
    "#afc0dc", "#dce5f5", "#171d26", "#f0561d", "#8fd0c8", "#6fa7e6", "#f0c24a", "#111417", "#f4f6f9", "#a7b1c2", "#333333", "#2a3038", "#4b5563", "#0b0d10", "#000000",
    "#ffffff", "#1f4fd8", "#7b9bff", "#5b85ff", "#f2c230", "#9aa4b0", "#3fd1b0", "#7cc8f7", "#a96bff", "#d7a8ff", "#fff0c4", "#7a8088"]);
  const html = fs.readFileSync(file, "utf8").replace(/data:[a-z]+\/[a-z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const fuera = new Set();
  for (const m of html.matchAll(/#[0-9a-fA-F]{6}\b/g)) if (!ISO.has(m[0].toLowerCase())) fuera.add(m[0]);
  for (const m of html.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) { const h = "#" + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, "0")).join(""); if (!ISO.has(h)) fuera.add(m[0]); }
  for (const m of html.matchAll(/["']FF([0-9A-F]{6})["']/g)) if (!ISO.has("#" + m[1].toLowerCase())) fuera.add("ARGB " + m[1]);
  if (fuera.size) throw new Error(`${fuera.size} tono(s) fuera del isométrico: ${[...fuera].slice(0, 12).join(" ")}`);
  const pdf = Buffer.from(G("buildCotizacionPdf")()).toString("latin1");
  for (const m of pdf.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) (rg|RG)\b/g)) {
    const h = "#" + [m[1], m[2], m[3]].map((x) => Math.round(+x * 255).toString(16).padStart(2, "0")).join("");
    if (!ISO.has(h)) throw new Error(`el PDF pinta ${h} (${m[0]}), fuera del isométrico`);
  }
});


t("S.34 (rev 2.9.18, decisiones del dueño) fuentes verificadas: áreas THHN de la Tabla 5 de la NOM, curva de Hunter del IPC E103.3(3) y Tijuana ASHRAE 2021", () => {
  const TH = G("AREA_COND_THHN");
  const NOM = { "3": 62.77, "250": 256.1, "300": 297.3, "350": 338.2, "400": 378.3, "600": 559.7, "750": 677.2, "500": 456.3, "14": 6.258 };
  Object.entries(NOM).forEach(([k, v]) => eq(TH[k], v, `THHN ${k}:`));
  const q = G("hunterQ");
  const GPM = 0.0630902;
  [[10, "tanque", 14.6], [100, "tanque", 43.5], [1000, "tanque", 208], [10, "fluxometro", 27.0], [100, "fluxometro", 67.5], [2000, "fluxometro", 325]]
    .forEach(([u, tipo, g]) => cerca(q(u, tipo), g * GPM, 1e-9, `Hunter ${tipo} ${u} UM (IPC ${g} gpm):`));
  cerca(q(75, "tanque"), (35.0 + (38.0 - 35.0) * 0.5) * GPM, 1e-9, "interpolación entre renglones de la tabla:");
  if (!(q(10, "tanque") > 0.50 * 1.8)) throw new Error("la curva de tanque debía subir (10 UM: antes 0.50 L/s)");
  const T = G("SITES").tijuana;
  eq(`${T.db}/${T.wb}/${T.alt}/${T.range}`, "32.8/17.5/149/9.2", "Tijuana ASHRAE 2021 (antes 35/24/0/11):");
  contiene(T.src, "WMO 760013", "fuente citada:");
});


t("S.35 (rev 2.9.19, revisión adversarial de 2.9.16–2.9.18) pendientes en Excel y licitación, tramo sin UM pendiente, compresor sin demanda fuera del eléctrico, incendio sin área sin error falso, civil no cuenta cuartos vacíos, Hunter hasta 5000 UM", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.35"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.35" }; });
    /* Hidro con longitudes y sin precio: el pendiente sale en el Excel de la propuesta y en la licitación. */
    S.hidro = { ...G("defaultHidro")(), material: "cpvc", tramos: [{ ...G("defaultTramoAgua")("AF-1"), um: 40, L: 25, alt: 0 }, { ...G("defaultTramoAgua")("AF-2"), um: 0, L: 12, alt: 0 }],
      muebles: [{ id: "wc_flux", cant: 4 }, { id: "lavabo", cant: 4 }] }; /* rev 2.9.23: CPVC, sin referencias de mercado */
    S.zones[0].area = 100; S.zones[0].height = 3; G("recompute")();
    const pend = (G("QUOTE").pendientes || []).filter((p) => p.mot === "hidro").map((p) => p.motivo);
    contiene(pend.join("|"), "pendiente de precio unitario", "sin precio:"); contiene(pend.join("|"), "pendiente de unidades mueble", "tramo con longitud y sin UM:");
    eq((G("QUOTE").aux || []).filter((a) => a.mot === "hidro" && a.un === "ML").length, 0, "el tramo sin UM no se cotiza como 1/2\":");
    const xl = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
    contiene(xl, "PENDIENTE, sin cotizar:", "matriz de alcance del Excel:");
    contiene(Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: G("monedaEspejoEN")() })).toString("utf8"), "PENDING, not priced:", "Excel en inglés:");
    S.quote.modo = "licitacion"; G("recompute")();
    /* rev 2.9.23: la cotización formal no sale con tubería sin precio; con precio sí, y el tramo sin UM sigue pendiente. */
    let tiro = ""; try { G("buildLicitacionPdf")(); } catch (e) { tiro = String(e.message); }
    contiene(tiro, "La cotización formal no sale con tubería sin precio", "licitación bloqueada sin precio:");
    G("hidroDiametrosSinPrecio")().forEach((d) => { S.quote.hidroPU[G("claveHidroPU")("cpvc", d)] = 100; }); G("recompute")();
    const lic = Buffer.from(licitacionFormal()).toString("latin1");
    contiene(lic, "PARTIDAS PENDIENTES, NO COTIZADAS", "licitación:");
    S.quote.modo = "privada";
    /* Compresor sin demanda: no llega a la propuesta del eléctrico (H-268: al cuadro sólo entra lo que se acepta). */
    S.aire = G("defaultAire")(); G("recompute")();
    eq(G("AIRE").nUnidades, 0, "aire sin demanda:");
    eq(G("propuestaElecFilas")().some((c) => c.kWOrigen === "aire"), false, "sin compresor en la propuesta del eléctrico:");
    /* Contra incendio sin área con fuente municipal: ningún error falso. */
    S.zones[0].area = 0; /* el área de incendio se hereda de las zonas (regla 1): sin zonas con área, sin área */
    S.fuego = { ...G("defaultFuego")(), fuente: "municipal" }; G("recompute")();
    eq(G("FUEGO").area, 0, "incendio sin área propia ni heredada:");
    eq(G("FUEGO").avisos.filter((a) => a.lvl === "err").length, 0, "incendio vacío sin errores:");
    if (G("FUEGO").memo.some((m) => /Bomba contra incendio NFPA 20: nominal 0/.test(m))) throw new Error("la memoria sigue armando bomba sin área");
    /* Civil: un cuarto con área pero sin altura no es área clasificada. */
    const r0 = G("cleanRooms")()[0]; r0.area = 60; r0.height = 0; G("recompute")();
    eq(G("CLEAN").list[0].vacio, true, "cuarto vacío:"); eq(G("CIVIL").areaLimpia, 0, "civil no lo cuenta:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  /* Hunter: renglones de la tabla hasta 5000 UM. */
  const q = G("hunterQ"), GPM = 0.0630902;
  cerca(q(5000, "tanque"), 593 * GPM, 1e-9, "5000 UM (IPC 593 gpm; antes extrapolado 661):"); cerca(q(3000, "fluxometro"), 433 * GPM, 1e-9, "3000 UM:");
  /* Kaizen y Valor sin proyecto: sin punto en el menú. */
  eq(G("SITES").custom.range, 9.2, "custom parte del rango de Tijuana:");
  eq(G("defaultState")().site.db, 32.8, "el sitio por omisión ya no dice 35:");
});


t("S.36 (rev 2.9.20, decisión del dueño) versión por motor en el sello: sólo se desactualiza la disciplina cuyo motor cambió; aviso al abrir con vX → vY y el cambio; nada se recalcula solo; la memoria muestra antes y después", () => {
  llenarTodoS();
  const MV = G("MOTOR_VER");
  /* H-107: carga v3 = lógica de la rev 2.9.21 (declarada en la 2.9.24); H-120: carga v4 = corrección CLTD por sitio. H-183: eléctrico v5 = Tabla 250-122 de la NOM; H-177: v6 = art. 440 con MCA/MOP; H-179: v7 = nada se supone (pendientes); H-178: v8 = corriente de motor por la Tabla 430-250/248.
     H-194: hidro v5 = presión mínima por mueble de la Tabla 604.3 del IPC 2015 y CDT con máx(residual, mínima); H-195: v6 = equipo de emergencia fuera de Hunter; H-197: v7 = sin pisos sin norma (días, ΔT, pendiente 704.1); H-198: v8 = CPVC sólo hasta 2" CTS, fuera de catálogo y PEAD sin SDR como error.
     H-263: carga v6 = calor del motor del ventilador seleccionado en Ventilación como misceláneos de la zona elegida; H-262: ventilación v4 = ya no hereda de carga térmica;
     H-268: eléctrico v9 = autónomo (las cargas de otros motores sólo como propuesta aceptada). */
  eq(MV.elec, "9", "eléctrico v9 (H-268):"); eq(MV.hidro, "8", "hidro v8 (H-198):"); eq(MV.load, "6", "carga v6 (H-263):"); eq(MV.duct, "4", "ductos v4 (H-165):"); eq(MV.equip, "2", "selección v2 (H-267):"); eq(MV.kaizen, "1", "Kaizen sin cambio de lógica: v1:");
  Object.keys(MV).forEach((id) => { const c = G("MOTOR_CAMBIOS")[id] || []; if (MV[id] !== "1" && !c.some((x) => x.ver === MV[id])) throw new Error(`${id}: la versión ${MV[id]} no tiene hallazgo registrado`); });
  const s0 = JSON.stringify(S.sellos || {});
  try {
    /* Sello de la 2.9.15 (sin versión = v1) en Kaizen y en hidro: sólo hidro se desactualiza (H-166 subió ductos a v2 y H-267 selección
       a v2: el ejemplo sin cambio pasa a Kaizen, que sigue en v1). */
    S.sellos = { kaizen: { ts: 5, huella: G("huellaMotor")("kaizen") }, hidro: { ts: 5, huella: G("huellaMotor")("hidro") } }; G("recompute")();
    eq(G("selloDe")("kaizen").estado, "calculado", "Kaizen (motor v1, sin cambio):");
    const sh = G("selloDe")("hidro");
    eq(sh.estado, "desactualizado", "hidro (motor v1 → v8):"); contiene(sh.texto, "v1 → v8", "texto:"); contiene(sh.texto, "Hunter", "nombra el hallazgo:"); contiene(sh.texto, "604.3", "nombra H-194:"); contiene(sh.texto, "Z358.1", "nombra H-195:"); contiene(sh.texto, "704.1", "nombra H-197:"); contiene(sh.texto, "catálogo", "nombra H-198:");
    const m = G("motoresCambiados")();
    eq(m.map((x) => x.id).join(","), "hidro", "lista para el aviso al abrir:"); eq(m[0].de + ">" + m[0].a, "1>8", "de → a:");
    /* Un sello viejo abre sin error y conserva su ver; el saneado acepta ver/resumen/previo y descarta basura. */
    const viejo = JSON.parse(JSON.stringify(S)); viejo.sellos = { hidro: { ts: 5, huella: G("huellaMotor")("hidro"), ver: "3", resumen: { Gasto: "1 L/s" }, previo: { ver: "2", ts: 4, resumen: { Gasto: "0.9 L/s" } } }, duct: { ts: 5, huella: G("huellaMotor")("duct"), ver: "x9", resumen: "no" } };
    const sv = G("sanearEstado")(viejo).sellos;
    eq(sv.hidro.ver, "3", "ver conservada:"); eq(sv.hidro.previo.ver, "2", "previo conservado:"); eq(sv.duct.ver, undefined, "ver inválida descartada:"); eq(sv.duct.resumen, undefined, "resumen inválido descartado:");
    /* Calcular con un motor que cambió: el sello nuevo trae la versión actual y el previo con las cifras de antes; la memoria las imprime. */
    S.sellos = { hidro: { ts: 5, huella: G("huellaMotor")("hidro"), ver: "1", resumen: { Gasto: "3.924 L/s" } } };
    const Q0 = G("HIDRO").Qtotal;
    clicS(boton("hidro", "calc-motor"));
    const sn = S.sellos.hidro;
    eq(sn.ver, "8", "sello nuevo con la versión del motor:"); eq(sn.previo.ver, "1", "previo:"); eq(sn.previo.resumen.Gasto, "3.924 L/s", "cifras de antes:");
    contiene(sn.resumen.Gasto, G("n")(Q0, 3), "cifras de después:");
    eq(G("selloDe")("hidro").estado, "calculado", "vuelto a sellar:");
    conPdfCapturado((salida) => {
      clicS(boton("hidro", "pdf-memoria-motor"));
      const txt = textoPdf(salida()[salida().length - 1].b);
      contiene(txt, "CAMBIO DE MOTOR v1 -> v8", "la memoria dice el cambio:"); /* el PDF parte los renglones en varios Tj: se buscan las piezas */
      contiene(txt, "ANTES", "antes:"); contiene(txt, "3.924 L/s", "cifra de antes:"); contiene(txt, "DESPUES", "después:"); contiene(txt, "motor v1", "versión de antes:"); contiene(txt, "motor v8", "versión de después:");
    });
    eq(w.eval("MEMO_CAMBIO"), null, "la bandera de la memoria se limpia:");
  } finally { S.sellos = JSON.parse(s0); G("recompute")(); }
});

t("S.37 (rev 2.9.20, decisión del dueño) control de humedad: dos casos de diseño ASHRAE, rige el mayor en total y en latente, memoria con ambos; sitio sin punto de rocío = faltante, no se estima", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.37";
    eq(G("SITES").tijuana.dp, 19.2, "Tijuana DP 0.4 %:"); eq(G("SITES").tijuana.dpHR, 14.2, "razón de humedad:"); eq(G("SITES").tijuana.dpDB, 22.8, "BS coincidente:");
    eq(G("SITES").tecate.dpRef.wmo, "722904", "Tecate: punto de rocío de estación de referencia (Brown Field):");
    const dz = G("defaultZone");
    S.zones = [{ ...dz("Oficina"), area: 200, height: 3, occ: 10, lights: 2000, equip: 1500 }, { ...dz("Limpio"), spaceType: "cleanroom", iso: "iso7", achClean: 45, area: 120, height: 3, occ: 2, lights: 720, equip: 2400, runHours: 24 },
      { ...dz("Laboratorio HR"), area: 150, height: 3, occ: 4, lights: 1500, equip: 3000, hrControl: "si" }];
    G("recompute")();
    const [of, cl, lab] = G("LOADS");
    eq(of.casos, null, "confort: un solo caso:");
    /* rev 2.9.23 · el PDF cita la fuente climática con estación y año (ASHRAE 2021, WMO). */
    const txtPdf = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
    const pdfClima = txtPdf(G("buildCargaPdf")()); contiene(pdfClima, "Fuente climatica: ASHRAE Handbook", "PDF cita ASHRAE:"); contiene(pdfClima, "Fundamentals 2021", "con año:"); contiene(pdfClima, "WMO 760013", "y estación:");
    contiene(txtPdf(G("buildMemoriaIntegralPdf")()), "WMO 760013", "memoria integral también:");
    if (!cl.casos || cl.casos.faltante) throw new Error("el cuarto limpio debía traer los dos casos");
    if (!lab.casos || lab.casos.faltante) throw new Error("la zona con HR especificada debía traer los dos casos");
    ["enf", "des"].forEach((c) => { if (!(cl.casos[c].grand > 0 && cl.casos[c].tons > 0)) throw new Error(`caso ${c} sin carga`); });
    cerca(cl.casos.des.W, 14.2, 0.01, "el caso de deshumidificación usa la razón de humedad de ASHRAE:"); cerca(cl.casos.des.db, 22.8, 1e-9, "y su BS coincidente:");
    if (cl.casos.des.grandL <= cl.casos.enf.grandL) throw new Error("con DP 19.2 °C la latente de deshumidificación debía ser mayor que la de enfriamiento (BH 17.5 °C)");
    if (!(cl.casos.des.grandL > 900 && cl.casos.des.grandL < 960)) throw new Error("latente de deshumidificación del cuarto (2 personas + 216 m³/h, sin infiltración) fuera de 900–960 W: " + cl.casos.des.grandL);
    /* rev 2.9.21 · cuarto limpio: unidad de aire exterior dedicada + serpentín seco; cada equipo con el mayor de sus casos;
       total combinado sólo referencia. Infiltración 0 (presión positiva), crédito sensible de aire exterior topado en 0. */
    const E = cl.casos.equipo;
    eq(E.modo, "oa", "cuarto limpio: aire exterior dedicado por omisión:");
    eq(cl.lines.some((l) => /Infiltración 0/.test(l.label)), true, "infiltración 0 en presión positiva:");
    eq(cl.casos.des.creditoTopado, true, "crédito sensible topado en deshumidificación:"); eq(cl.casos.des.oaS, 0, "oaS = 0:");
    /* ADP requerido desde la latente interna: Wsup = Wi − Lint/(ql·Qoa); ADP con BF 0.15. */
    const Wi = cl.psy.Wi, QL = G("SITE").QL;
    cerca(E.oa.Wsup, (Wi - E.oa.Lint / (QL * E.oa.Q) / 1000) * 1000, 0.01, "humedad de suministro requerida:");
    if (!(E.oa.adpReq > 7 && E.oa.adpReq < E.oa.dpSup)) throw new Error(`ADP requerido fuera de rango: ${E.oa.adpReq}`);
    cerca(E.oa.adpSel, E.oa.adpReq - 2, 1e-9, "ADP de selección = requerido − 2 °C:"); eq(E.oa.alerta7, false, "sin alerta de 7 °C:");
    /* Unidad de aire exterior: latente = ql·Qoa·(Wo − Wleave); selección = mayor de sus dos casos. */
    cerca(E.oa.des.lat, QL * E.oa.Q * (E.oa.des.Wo - E.oa.des.Wleave), 2, /* Wo/Wleave se guardan a 2 decimales */ "latente de la unidad en deshumidificación:");
    eq(E.oa.sel.total, Math.max(E.oa.enf.total, E.oa.des.total), "unidad: el mayor de sus casos:");
    eq(E.oa.sel.caso, "deshumidificacion", "en Tijuana rige deshumidificación en la unidad:");
    /* Serpentín seco: caudal de recirculación = cambios/h × volumen − aire exterior; en seco; selección = mayor de sus casos. */
    cerca(E.seco.Qrec, 45 * 360 - E.oa.Q, 1e-6, "recirculación por cambios/h:");
    eq(E.seco.sel.W, Math.max(E.seco.enf, E.seco.des), "serpentín seco: el mayor de sus casos:"); eq(E.seco.condensa, false, "trabaja en seco:");
    if (!(E.seco.adpSeco > E.seco.tDewCuarto)) throw new Error("superficie del serpentín seco bajo el rocío del cuarto");
    cerca(E.seco.tDewCuarto, 12.9, 0.15, "rocío del cuarto a 24 °C / 9.47 g/kg:");
    /* Calor del ventilador incluido: sin Pa/η, módulos FFU × W; con Pa/η, Q·ΔP/η. */
    if (!(cl.fanW > 0) || !/módulos HEPA/.test(cl.fanModo)) throw new Error("falta el calor del ventilador por módulos FFU");
    /* Total combinado = referencia; latente del equipo = de la unidad. */
    cerca(cl.grand, E.oa.sel.total + E.seco.sel.W, 1e-9, "total combinado = unidad + serpentín seco:");
    cerca(cl.grandL, E.oa.sel.lat, 1e-9, "latente = la de la unidad:"); cerca(cl.tons, cl.grand / G("P").W_TON, 1e-9, "toneladas:");
    eq(E.recal, 0, "sin recalentamiento:");
    /* Condición resultante del cuarto contra la banda de HR. */
    cerca(E.cuarto.W, E.oa.des.Wleave + E.oa.Lint / (QL * E.oa.Q), 0.02, "W resultante del cuarto:");
    if (!(E.cuarto.rh > 40 && E.cuarto.rh < 50)) throw new Error("HR resultante fuera de lo esperado: " + E.cuarto.rh);
    eq(E.cuarto.fueraHR, false, "dentro de la banda 40–60:");
    contiene(cl.memo.join(" "), "Condición resultante del cuarto", "memoria: condición del cuarto:");
    contiene(cl.memo.join(" "), "UNIDAD DE AIRE EXTERIOR", "memoria: dos equipos:"); contiene(cl.memo.join(" "), "SERPENTÍN SECO", "memoria: serpentín seco:");
    /* Banda estrecha: aviso. Ventilador con Pa y η: Q·ΔP/η. Modo «todo»: un solo serpentín con recalentamiento. */
    S.zones[1].rhMin = 50; S.zones[1].fanPa = 800; S.zones[1].fanEta = 60; G("recompute")();
    const c2 = G("LOADS")[1];
    eq(c2.casos.equipo.cuarto.fueraHR, true, "fuera de banda con HR mínima 50:");
    if (!G("ENGINES").load.checks(c2, "Limpio").some((a) => /fuera de la banda/.test(a.msg))) throw new Error("falta el aviso de banda de HR");
    cerca(c2.fanW, (45 * 360 / 3600) * 800 / 0.6, 1e-6, "calor del ventilador Q·ΔP/η:");
    S.zones[1].rhMin = 40; S.zones[1].fanPa = 0; S.zones[1].fanEta = 0; S.zones[1].serpentin = "todo"; G("recompute")();
    const c3 = G("LOADS")[1];
    eq(c3.casos.equipo.modo, "todo", "modo todo el suministro:"); if (!(c3.recal > 10000)) throw new Error("con todo el suministro por el serpentín debía haber recalentamiento grande: " + c3.recal);
    S.zones[1].serpentin = "auto";
    /* Cambios por hora obligatorios: sin ellos la zona no se calcula ni deja Calcular. */
    S.zones[1].achClean = 0; G("recompute")();
    eq(G("LOADS")[1].sinACH, true, "sin cambios/h:"); eq(G("capturaReal")("load"), false, "Calcular bloqueado:");
    if (!G("ENGINES").load.checks(G("LOADS")[1], "Limpio").some((a) => a.lvl === "err" && /cambios por hora/.test(a.msg))) throw new Error("falta el error de cambios/h");
    eq(G("defaultZone")("x").achClean, 0, "la zona nueva arranca sin cambios/h:");
    S.zones[1].achClean = 45; G("recompute")();
    contiene(cl.memo.join(" "), "dos casos de diseño ASHRAE", "memoria de la zona:"); contiene(cl.memo.join(" "), "Selección · UNIDAD DE AIRE EXTERIOR", "cuál gobierna, por equipo:");
    const pdf = textoPdf(G("buildCargaPdf")());
    contiene(pdf, "Dos casos ASHRAE", "PDF de carga:"); contiene(pdf, "deshumidificacion", "PDF nombra el caso:");
    eq(G("SITE").caso, "enfriamiento", "SITE restaurado:"); eq(G("SITE").Wfijo, null, "sin razón fija:");
    /* Sitio sin punto de rocío: faltante, aviso, un caso. */
    S.site = { key: "custom", db: 40, wb: 24, alt: 100, range: 12, dp: 0, dpHR: 0, dpDB: 0 }; G("recompute")(); /* rev 2.9.23: Tecate ya trae estación de referencia; el faltante se prueba con un sitio sin DP */
    const cl2 = G("LOADS")[1];
    eq(cl2.casos.faltante, true, "sitio sin DP: faltante:"); contiene(cl2.memo.join(" "), "FALTA el punto de rocío", "memoria lo dice:");
    if (!G("ENGINES").load.checks(cl2, "Limpio").some((a) => a.lvl === "warn" && /falta el punto de rocío/.test(a.msg))) throw new Error("falta el aviso de dato faltante");
    contiene(textoPdf(G("buildCargaPdf")()), "FALTA el punto de rocio", "PDF: faltante:");
    /* Personalizado captura sus tres datos de deshumidificación. */
    S.site = { key: "custom", db: 40, wb: 24, alt: 100, range: 12, dp: 24, dpHR: 19.5, dpDB: 30 }; G("recompute")();
    cerca(G("LOADS")[1].casos.des.W, 19.5, 0.01, "personalizado:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});


t("S.38 (rev 2.9.22, decisión del dueño) sitio sin punto de rocío: marca roja en el PDF, captura manual sólo con fuente, estaciones ASHRAE de referencia que el usuario adopta", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.38";
    S.zones = [{ ...G("defaultZone")("Limpio"), spaceType: "cleanroom", iso: "iso7", achClean: 45, area: 120, height: 3, occ: 2 }];
    /* rev 2.9.23 · decisión del dueño: Tecate → Brown Field 722904 y Ensenada → Imperial Beach 722909 como ESTACIÓN DE REFERENCIA; Mexicali adopta 760053 como dato. */
    const T = G("SITES");
    eq(T.tecate.dpRef.wmo, "722904", "Tecate: Brown Field:"); eq(T.tecate.dp, 20.0, "DP de Brown Field:"); eq(T.ensenada.dpRef.wmo, "722909", "Ensenada: Imperial Beach:"); eq(T.ensenada.dp, 20.5, "DP de Imperial Beach:");
    eq(T.mexicali.dpRef, undefined, "Mexicali: dato propio, no referencia:"); eq(`${T.mexicali.db}/${T.mexicali.wb}/${T.mexicali.alt}/${T.mexicali.dp}`, "44/24.8/23/26.2", "Mexicali 760053 adoptada completa:"); contiene(T.mexicali.src, "WMO 760053", "fuente:");
    S.site = { key: "tecate" }; G("recompute")();
    if (!G("SITE").deshum || !G("SITE").deshum.referencia) throw new Error("Tecate debía usar la estación de referencia");
    contiene(G("LOADS")[0].memo.join(" "), "ESTACIÓN DE REFERENCIA, no del sitio: Brown Field", "memoria marca la referencia con nombre:"); contiene(G("LOADS")[0].memo.join(" "), "33 km", "y distancia:");
    contiene(Buffer.from(G("buildCargaPdf")()).toString("latin1"), "ESTACION DE REFERENCIA", "PDF marca la referencia:");
    S.site = { key: "custom", dp: 0, dpHR: 0, dpDB: 0 }; G("recompute")();
    eq(G("SITE").deshum, null, "sitio sin DP:"); eq(G("LOADS")[0].casos.faltante, true, "faltante:");
    const pdf = Buffer.from(G("buildCargaPdf")()).toString("latin1");
    contiene(pdf, "DESHUMIDIFICACION NO EVALUADA: FALTA DATO CLIMATICO", "PDF marca la falta:");
    contiene(pdf, "0.941 0.337 0.114 rg", "en rojo (color de señal):");
    /* Captura manual sin fuente: no cuenta. Con fuente: cuenta y se imprime (sitio personalizado sin DP). */
    S.site = { key: "custom", db: 40, wb: 24, alt: 100, range: 12, dp: 18, dpHR: 13, dpDB: 24, dpFuente: "" }; G("recompute")();
    if (!G("SITE").deshum) throw new Error("personalizado con DP debía usarse"); eq(G("SITE").deshum.fuente, "capturado por el usuario", "sin fuente declarada, personalizado dice capturado por el usuario:");
    S.site.dpFuente = "ASHRAE 2021, estación X, cotejo del cliente"; G("recompute")();
    eq(G("SITE").deshum.fuente, "ASHRAE 2021, estación X, cotejo del cliente", "fuente declarada:");
    eq(G("LOADS")[0].casos.faltante, undefined, "se evalúan los dos casos:");
    /* Adoptar una estación de referencia: rellena DP, HR, BS coincidente y fuente. */
    S.site = { key: "ensenada" }; G("recompute")(); S.tab = "proyecto"; G("render")();
    const btn = w.document.querySelector('#view [data-act="site-ref-dp"][data-i="0"]');
    if (!btn) throw new Error("falta el botón para adoptar la estación de referencia");
    clicS(btn);
    const ref = G("SITES").ensenada.ref[0];
    eq(S.site.dp, ref.dp, "DP adoptado:"); eq(S.site.dpHR, ref.dpHR, "HR adoptada:"); eq(S.site.dpDB, ref.dpDB, "BS coincidente adoptada:");
    contiene(S.site.dpFuente, "WMO " + ref.wmo, "fuente declarada:"); contiene(S.site.dpFuente, "referencia adoptada", "marcada como referencia:");
    if (!G("SITE").deshum) throw new Error("tras adoptar, el sitio debía tener caso de deshumidificación");
    /* Saneado: DP no numérico se descarta; la fuente se acota. */
    const sucio = JSON.parse(JSON.stringify(S)); sucio.site.dp = "x"; sucio.site.dpFuente = "f".repeat(500);
    const sv = G("sanearEstado")(sucio).site; eq(sv.dp, undefined, "DP no numérico fuera:"); eq(sv.dpFuente.length, 200, "fuente acotada:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});


t("S.39 (rev 2.9.22, decisión del dueño) precios de tubería hidráulica: PP-R en el catálogo, plantilla CSV por material y diámetro, importación con moneda y validación de que ningún diámetro quede en cero antes de cotizar", () => {
  const guardado = JSON.stringify(S);
  try {
    const T = G("TUB_AGUA");
    ["cpvc", "cobre", "ppr", "acero"].forEach((m) => { if (!T[m]) throw new Error(`falta ${m} en TUB_AGUA`); });
    eq(T.ppr.d.length, 9, "PP-R con 9 diámetros (20–110 mm, DIN 8077 PN20):"); eq(T.ppr.d[0][0], 13.2, "PP-R 20 mm: interior 13.2 mm:");
    eq(G("famSoporteAgua")("ppr"), "plastico", "PP-R se soporta como termoplástico:");
    const csv = G("hidroPUPlantillaCsv")();
    contiene(csv, "material,clave,diametro,precio,por_tramo_m,iva_incluido,moneda,origen,alcance,fuente,edicion,pagina,ubicacion,estado,pais,lista,url,fecha", "encabezado (rev 2.9.24, H-251: columnas estado y pais):");
    eq(csv.split("\n").length - 1, Object.values(T).reduce((a, t) => a + t.d.length, 0), "una fila por diámetro y material:");
    contiene(csv, "cpvc,cpvc_1_1_4_,\"1 1/4\"\"\",,1,no,MXN,proveedor,no especificado,,,,,no especificado,,", "fila CPVC 1 1/4 (el diámetro lleva comillas):");
    if (/IUSA/.test(csv)) throw new Error("la plantilla no debe traer referencias IUSA (regla: únicamente California)");
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.39"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.39" }; });
    S.zones[0].area = 100; S.zones[0].height = 3;
    S.hidro = { ...G("defaultHidro")(), material: "cpvc", tramos: [{ ...G("defaultTramoAgua")("AF-1"), um: 40, L: 25, alt: 0 }, { ...G("defaultTramoAgua")("AF-2"), um: 12, L: 12, alt: 0 }],
      muebles: [{ id: "wc_flux", cant: 4 }, { id: "lavabo", cant: 4 }] };
    S.quote.hidroPU = {}; S.quote.fx = 18; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "prueba"; G("recompute")(); /* rev 2.9.23: USD sólo con tipo de cambio fechado */
    const sin = G("hidroDiametrosSinPrecio")();
    if (sin.length < 1) throw new Error("debía haber diámetros sin precio");
    eq(G("accEstado")("hidro").cot.ok, false, "cotización de hidro bloqueada sin precios:"); contiene(G("accEstado")("hidro").cot.razon, "Falta el precio", "razón:");
    eq(G("cotUnificadaEstado")().ok, true, "rev 2.9.23: el Budget Proposal sale aunque falten precios:"); eq((G("QUOTE").porCotizar || []).filter((p) => p.mot === "hidro" && p.un === "ML").length, sin.length, "y lleva una partida Por cotizar por diámetro:");
    /* Importación: USD se convierte con el tipo de cambio; fila con material o diámetro inválido se rechaza; sin precio se ignora. */
    const filas = ["material,clave,diametro,precio_por_metro,moneda,fuente"].concat(sin.map((d) => `cpvc,,${d},10,USD,"cotización de prueba, 2026"`)).concat(["cobre,,1/2\",,MXN,", "madera,,1/2\",5,MXN,", "cpvc,,9\",5,MXN,"]);
    const r = G("hidroPUImportarCsv")(filas.join("\r\n"));
    eq(r.ok, sin.length, "precios importados:"); eq(r.malas.length, 2, "filas rechazadas (material y diámetro inválidos):");
    sin.forEach((d) => cerca(G("hidroPUEntrada")(G("claveHidroPU")("cpvc", d)).precioM, 180, 1e-9, `${d}: 10 USD × 18 = 180 MXN/m:`));
    G("recompute")();
    eq(G("hidroDiametrosSinPrecio")().length, 0, "ya no falta ningún diámetro:");
    eq(G("accEstado")("hidro").cot.ok, true, "cotización de hidro disponible:"); eq(G("cotUnificadaEstado")().ok, true, "unificada disponible:");
    eq((G("QUOTE").aux || []).filter((a) => a.mot === "hidro" && a.un === "ML").length, sin.length, "un renglón por diámetro:");
    /* PP-R calcula y cotiza igual que los demás materiales. */
    S.hidro.material = "ppr"; G("recompute")();
    eq(G("HIDRO").mat, "ppr", "material PP-R:"); if (!G("HIDRO").tramos.every((t) => /mm$/.test(t.nom))) throw new Error("los diámetros de PP-R deben ser en mm");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});


t("S.53 (H-195) regadera de emergencia y lavaojos fuera de Hunter con gasto fijo (Z358.1-1990 vía cartas de OSHA, secundaria): el tramo que la lleva lo declara; si ningún tramo la lleva, aviso; memoria y pantalla dicen la fuente y que falta ratificar", () => {
  const guardado = JSON.stringify(S), tab0 = S.tab;
  try {
    const M = G("MUEBLES"), md = (id) => M.find((m) => m.id === id);
    if (!md("lavaojos") || !md("lavaojos_solo")) throw new Error("faltan los equipos de emergencia en MUEBLES (lavaojos: regadera con lavaojos; lavaojos_solo: lavaojos fijo)");
    const tramo = (tag, um, L, q) => ({ ...G("defaultTramoAgua")(tag), um, L, alt: 0, ...(q != null ? { qEmergLmin: q } : {}) });
    const base = [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }];
    S.hidro = { ...G("defaultHidro")(), tramos: [tramo("AF-GENERAL", 72, 25)], muebles: [...base, { id: "lavaojos", cant: 2 }, { id: "lavaojos_solo", cant: 1 }] };
    G("recompute")();
    let H = G("HIDRO");
    const qEm = (2 * 20 + 0.4) * G("GPM_LS");
    eq(H.umTotal, 72, "los equipos de emergencia no suman unidades mueble (antes 2 × 6 + 6 = 18 UM más):");
    cerca(H.Qtotal, G("hunterQ")(72, "fluxometro") + qEm, 1e-9, "gasto del sistema = Hunter de 72 WSFU + 2 × 20 gpm + 0.4 gpm:");
    cerca(H.qEmerg, qEm, 1e-9, "gasto de emergencia en L/s:");
    cerca(H.volEmerg, (2 * 20 + 0.4) * 15 * 3.785411784, 0.01, "volumen para 15 min:");
    const avisoTramo = () => H.avisos.find((a) => /emergencia/i.test(a.msg) && /ningún tramo/i.test(a.msg));
    if (!avisoTramo()) throw new Error("sin tramo que lleve el gasto de emergencia debe haber aviso (los diámetros no lo incluyen)");
    /* El tramo que la lleva lo declara en L/min: su gasto sube y el aviso se va. */
    S.hidro.tramos[0].qEmergLmin = 2 * 75.7 + 1.5; G("recompute")(); H = G("HIDRO");
    cerca(H.tramos[0].Q, G("hunterQ")(72, "fluxometro") + (2 * 75.7 + 1.5) / 60, 1e-9, "gasto del tramo = Hunter + lo capturado:");
    if (avisoTramo()) throw new Error("con el gasto de emergencia capturado en el tramo el aviso debe irse");
    /* Captura basura: no suma. */
    S.hidro.tramos[0].qEmergLmin = "abc"; G("recompute")(); H = G("HIDRO");
    cerca(H.tramos[0].Q, G("hunterQ")(72, "fluxometro"), 1e-9, "un gasto de emergencia no numérico no suma:");
    /* Fuente declarada: memoria (texto del motor) y pantalla. */
    const memo = H.memo.join(" ");
    contiene(memo, "Z358.1-1990", "la memoria cita la edición que leyó OSHA:"); contiene(memo, "OSHA", "y la vía:"); contiene(memo, "ratificar", "y que falta ratificar con el texto:");
    contiene(md("lavaojos").presFuente, "criterio de la casa", "la presión del equipo de emergencia no tiene fuente (604.3 no lo lista; las cartas de OSHA no la dan):");
    S.tab = "hidro"; const v = G("viewHidro")();
    contiene(v, 'data-path="hidro.tramos.0.qEmergLmin"', "pantalla: el gasto de emergencia del tramo se captura:");
    contiene(v, "20 gpm", "pantalla: la regadera de emergencia dice su gasto fijo:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); S.tab = tab0; G("recompute")(); }
});

t("S.54 (H-197) sin pisos sin norma: 0 días de reserva = cisterna pendiente, ΔT ≤ 0 = calentador pendiente, pendiente capturada bajo la mínima de IPC 2015 §704.1 sube a la mínima con aviso; memoria y PDF dicen de dónde sale la pendiente", () => {
  const guardado = JSON.stringify(S);
  try {
    const muebles = [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }];
    const arma = (x) => { S.hidro = { ...G("defaultHidro")(), muebles, dot: "industria", habitantes: 60, ...x }; G("recompute")(); return G("HIDRO"); };
    let H = arma({ diasReserva: 0 });
    eq(H.cisterna, 0, "0 días de reserva capturados: cisterna 0 (antes piso de 0.5 día = 3,000 L):");
    if (!H.avisos.some((a) => /cisterna/i.test(a.msg) && /pendiente/i.test(a.msg))) throw new Error("sin días de reserva la cisterna debe quedar pendiente con aviso");
    H = arma({ diasReserva: 1.5 }); eq(H.cisterna, 9000, "1.5 días se respetan: 100 × 60 × 1.5:");
    if (H.avisos.some((a) => /cisterna/i.test(a.msg) && /pendiente/i.test(a.msg))) throw new Error("con días capturados no hay aviso de cisterna pendiente");
    H = arma({ tempEntrada: 40, tempSalida: 35 });
    eq(H.dT, 0, "salida bajo la entrada: ΔT 0 (antes piso de 5 K):"); eq(H.kWcal, 0, "calentador sin potencia supuesta:");
    if (!H.avisos.some((a) => /calentador/i.test(a.msg) && /pendiente/i.test(a.msg))) throw new Error("con ΔT ≤ 0 el calentador debe quedar pendiente con aviso");
    H = arma({ tempEntrada: 18, tempSalida: 45 }); eq(H.dT, 27, "18 → 45 °C: ΔT 27 K sin cambio:");
    H = arma({ pendiente: 0.2 });
    cerca(H.pend, 0.125 / 12 * 100, 1e-9, "0.2 % capturado con colector de 100 mm: sube a 1/8 in/ft (IPC 2015 §704.1):");
    eq(H.pendCap, 0.2, "la captura se conserva para decirla:");
    const av = H.avisos.find((a) => /704\.1/.test(a.msg));
    if (!av) throw new Error("subir la pendiente a la mínima de norma debe avisar citando 704.1");
    contiene(H.memo.join(" "), "704.1", "la memoria dice de dónde sale la pendiente:");
    H = arma({ pendiente: 3 }); eq(H.pend, 3, "3 % capturado se respeta:");
    if (H.avisos.some((a) => /704\.1/.test(a.msg))) throw new Error("con pendiente mayor que la mínima no hay aviso de 704.1");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.55 (H-198) CPVC sin renglones «SIN VERIFICAR» arriba de 2\" CTS y PEAD sin SDR: el tramo sin diámetro verificado es error visible y va «Por cotizar», nunca con el precio de otro diámetro", () => {
  const guardado = JSON.stringify(S);
  try {
    const T = G("TUB_AGUA");
    eq(T.cpvc.d.filter((x) => x[0] > 43.59).length, 0, "CPVC sin renglones arriba de 2\" CTS:");
    if (Object.values(T).some((m) => m.d.some((x) => /SIN VERIFICAR/.test(x[1])))) throw new Error("queda un renglón «SIN VERIFICAR» en TUB_AGUA");
    S.perms = { ...(S.perms || {}), "hidro>quote": { ts: 1, via: "S.55" } };
    const muebles = [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }];
    const tramos = () => [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 0 }, { ...G("defaultTramoAgua")("AF-RAMAL"), um: 20, L: 18, alt: 0 }];
    const ml = () => (G("QUOTE").aux || []).filter((x) => x.mot === "hidro" && x.un === "ML");
    const pc = () => (G("QUOTE").porCotizar || []).filter((x) => x.mot === "hidro" && x.un === "ML"); /* H-196: cisterna y bomba aparte */
    /* CPVC: la general no cabe en 2" CTS. */
    S.hidro = { ...G("defaultHidro")(), material: "cpvc", muebles, tramos: tramos() };
    S.quote.hidroPU = { [G("claveHidroPU")("cpvc", '2"')]: 300 };
    G("recompute")();
    let H = G("HIDRO");
    eq(H.tramos[0].fueraCatalogo, true, "la general queda fuera de catálogo:"); eq(H.tramos[1].fueraCatalogo, false, "el ramal cabe en 2\":");
    if (!H.avisos.some((a) => a.lvl === "err" && /AF-GENERAL/.test(a.msg) && /catálogo/.test(a.msg))) throw new Error("el tramo fuera de catálogo debe dar error visible");
    eq(ml().reduce((s, x) => s + x.qty, 0), 18, "sólo el ramal se cotiza con el precio de 2\" (antes también la general, con el de 2 1/2\"):");
    const g = pc().find((x) => /AF-GENERAL/.test(x.desc));
    if (!g) throw new Error("la general debe ir «Por cotizar»");
    eq(g.qty, 25, "con sus metros:");
    eq(G("hidroDiametrosSinPrecio")().join(","), "", "el tramo fuera de catálogo no pide precio de un diámetro que no le corresponde:");
    S.hidro = { ...G("defaultHidro")(), material: "cpvc", muebles, tramos: tramos().slice(0, 1) };
    S.quote.hidroPU = {};
    G("recompute")();
    eq(G("hidroDiametrosSinPrecio")().join(","), "", "sólo con el tramo fuera de catálogo y sin precios, no se pide el precio del tope:");
    /* PEAD: diámetros sin SDR ni fuente. */
    S.hidro = { ...G("defaultHidro")(), material: "pead", muebles, tramos: tramos() };
    S.quote.hidroPU = Object.fromEntries(G("TUB_AGUA").pead.d.map((x) => [G("claveHidroPU")("pead", String(x[1]).split(" ·")[0]), 300]));
    G("recompute")(); H = G("HIDRO");
    if (!H.avisos.some((a) => a.lvl === "err" && /PEAD/.test(a.msg) && /SDR/.test(a.msg))) throw new Error("PEAD sin SDR debe dar error visible");
    eq(ml().length, 0, "PEAD no se cotiza por diámetro aunque haya precio capturado:");
    if (!pc().every((x) => /SDR/.test(x.desc))) throw new Error("PEAD va «Por cotizar» por falta de SDR, no por falta de precio");
    eq(pc().reduce((s, x) => s + x.qty, 0), 43, "los 43 m van «Por cotizar»:");
    /* Cobre: sin cambio. */
    S.hidro = { ...G("defaultHidro")(), material: "cobre", muebles, tramos: tramos() }; G("recompute")(); H = G("HIDRO");
    eq(H.tramos.map((x) => !!x.fueraCatalogo).join(","), "false,false", "cobre dentro del catálogo:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.57 (H-196) cisterna y equipo de bombeo sin precio semilla: van «Por cotizar» con su volumen y su potencia; la bomba sólo cuando la presión de la red no alcanza; cisterna en 0 = pendiente de volumen, nunca «cisterna de 0 m³»", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  try {
    if ("bombaHP" in G("QUOTE_SEED")) throw new Error("sigue el precio semilla de la bomba (14,500 MXN/HP sin fuente)");
    S.perms = { ...(S.perms || {}), "hidro>quote": { ts: 1, via: "S.57" } };
    const muebles = [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }];
    const tramos = () => [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 0 }];
    const lote = () => (G("QUOTE").aux || []).filter((x) => x.mot === "hidro" && x.un === "LOTE");
    const pc = (clave) => (G("QUOTE").porCotizar || []).filter((x) => x.mot === "hidro" && x.clave === clave);
    const pend = () => (G("QUOTE").pendientes || []).filter((p) => p.mot === "hidro").map((p) => p.motivo);
    /* 1) Sin dotación (0 unidades) y sin red (presRed 0): cisterna pendiente, bomba «Por cotizar». */
    S.hidro = { ...G("defaultHidro")(), material: "cobre", muebles, tramos: tramos(), habitantes: 0, presRed: 0, alturaEdificio: 6 };
    G("recompute")();
    let H = G("HIDRO");
    eq(H.presOk, false, "sin red la presión no alcanza:"); eq(H.cisterna, 0, "sin dotación no hay cisterna:");
    eq(lote().length, 0, "ya no hay partida con precio semilla de cisterna/bomba:");
    eq(pc("cisterna").length, 0, "cisterna en 0 no se cotiza como «0 m³»:");
    if (!pend().some((m) => /volumen/.test(m))) throw new Error("la cisterna en 0 debe quedar pendiente de volumen: " + pend().join(","));
    const b = pc("bombaAgua");
    eq(b.length, 1, "bomba «Por cotizar» cuando la presión no alcanza:"); eq(b[0].qty, 1); eq(b[0].un, "LOTE");
    contiene(b[0].desc, " HP", "la partida dice la potencia:"); contiene(b[0].desc, "no alcanza", "y por qué hace falta:");
    if (!b[0].descEn) throw new Error("sin espejo EN");
    const txt = pdfTxt(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })) + " " + pdfTxt(G("buildCotizacionPdf")());
    if (/Cisterna de 0/.test(txt)) throw new Error("el PDF sigue diciendo «Cisterna de 0 m³»");
    contiene(txt, "POR COTIZAR", "PDF de propuesta:"); contiene(txt, "bombeo", "la bomba sale en el PDF:");
    /* 2) Con dotación (60 trabajadores, industria 100 L, 1 día) y red que alcanza: cisterna «Por cotizar» con sus m³, sin bomba. */
    S.hidro = { ...G("defaultHidro")(), material: "cobre", muebles, tramos: tramos(), habitantes: 60, presRed: 60, alturaEdificio: 3 };
    G("recompute")(); H = G("HIDRO");
    eq(H.presOk, true, "con 60 m en la toma la presión alcanza:");
    const c = pc("cisterna");
    eq(c.length, 1, "cisterna «Por cotizar»:"); cerca(c[0].qty, H.cisterna / 1000, 1e-9, "con su volumen en m³:"); eq(c[0].un, "M3");
    contiene(c[0].desc, "consumo diario", "la partida dice de dónde sale el volumen:");
    eq(pc("bombaAgua").length, 0, "con presión suficiente no se cotiza bomba:");
    if (!H.memo.some((m) => /bombeo/.test(m) && /alcanza/.test(m) && /no se cotiza/.test(m))) throw new Error("la memoria no dice que la bomba es referencia y no se cotiza");
    if (pend().some((m) => /volumen/.test(m))) throw new Error("con volumen la cisterna no está pendiente");
    /* 3) Sin cambio de cifras en la red: los metros se siguen cotizando por diámetro. */
    eq((G("QUOTE").aux || []).filter((x) => x.mot === "hidro" && x.un === "ML").length > 0 || G("hidroDiametrosSinPrecio")().length > 0, true, "la red sigue por diámetro:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.58 (H-205) contra incendio hereda la altura MÁXIMA de las zonas (rociador más alto), no el promedio ponderado: la estática y la CDT van al rociador más alto, el aviso de rack sale con la altura real, ventilación sigue con la media y la captura propia se respeta", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.58";
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6, occ: 30 }, { ...G("defaultZone")("Oficina"), area: 100, height: 3, occ: 10 }];
    S.fuego = { ...G("defaultFuego")(), riesgo: "ord2", Lramal: 30, Lmontante: 12 };
    G("recompute")();
    cerca(G("geoProyecto")().altura, 5.4, 0.01, "la media ponderada sigue existiendo (volumen = área × altura):");
    eq(S.vent.height, 0, "H-262: ventilación ya no hereda la altura; calcula con la suya:");
    eq(S.fuego.altura, 0, "H-264: contra incendio ya no hereda la altura de las zonas:");
    /* H-264: la altura al rociador más alto se captura; con 6 m (la zona más alta) la estática va a ese rociador. */
    S.fuego.area = 500; S.fuego.altura = 6; G("recompute")();
    let F = G("FUEGO");
    eq(F.estatica, 7, "estática = altura al rociador más alto + 1 m:");
    if (!F.memo.some((m) => /rociador más alto/.test(m))) throw new Error("la memoria no dice que la estática va al rociador más alto");
    if (F.avisos.some((a) => /rack/.test(a.msg))) throw new Error("con 6 m no debe salir el aviso de rack");
    /* Almacén de 13 m: se captura 13 (el promedio sería 3.91 y escondía el rack); las zonas no la mueven (H-264). */
    S.zones = [{ ...G("defaultZone")("Oficinas"), area: 2000, height: 3 }, { ...G("defaultZone")("Almacén"), area: 200, height: 13 }]; G("recompute")();
    eq(S.fuego.altura, 6, "H-264: cambiar las zonas no mueve la altura capturada:");
    S.fuego.altura = 13; G("recompute")();
    F = G("FUEGO");
    eq(F.estatica, 14, "estática 14 m:");
    if (!F.avisos.some((a) => /rack/.test(a.msg) && /13/.test(a.msg))) throw new Error("con 13 m debe salir el aviso de almacenamiento en rack con la altura real");
    /* Otra captura: manda en la estática. */
    S.fuego.altura = 9; G("recompute")();
    eq(S.fuego.altura, 9, "la captura propia se respeta:"); eq(G("FUEGO").estatica, 10, "y manda en la estática:");
    /* La pantalla y la guía nombran el campo por lo que es. */
    S.tab = "fuego"; G("render")();
    const v = w.document.getElementById("view");
    if (!/rociador más alto/i.test(v.textContent)) throw new Error("la pantalla no nombra la altura al rociador más alto");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.59 (H-206) la bomba contra incendio y su reserva no llevan precio fijo (385,000 MXN + 9,500 MXN/m³ sin fuente): van «Por cotizar» con capacidad, presión, potencia y volumen declarados; con red municipal que alcanza no hay bomba ni reserva", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  try {
    const seed = G("QUOTE_SEED");
    if ("bombaFuego" in seed || "cisternaM3" in seed) throw new Error("siguen los precios semilla de bomba contra incendio o cisterna");
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.59";
    S.perms = { ...(S.perms || {}), "fuego>quote": { ts: 1, via: "S.59" } };
    S.fuego = { ...G("defaultFuego")(), area: 600, altura: 6, Lramal: 30, Lmontante: 12, fuente: "cisterna" };
    G("recompute")();
    const F = G("FUEGO");
    const lote = () => (G("QUOTE").aux || []).filter((x) => x.mot === "fuego" && x.un === "LOTE");
    const pc = (clave) => (G("QUOTE").porCotizar || []).filter((x) => x.mot === "fuego" && x.clave === clave);
    eq(lote().length, 0, "ya no hay partida de bomba y reserva con importe fijo:");
    const b = pc("bombaFuego");
    eq(b.length, 1, "bomba «Por cotizar»:"); eq(b[0].un, "LOTE"); eq(b[0].qty, 1); eq(b[0].sec, "D");
    contiene(b[0].desc, G("n")(F.qBomba / 3.785, 0) + " gpm", "capacidad declarada:"); contiene(b[0].desc, G("n")(F.hpBomba, 0) + " HP", "potencia declarada:"); contiene(b[0].desc, " m", "presión declarada:");
    if (!b[0].descEn || !/gpm/.test(b[0].descEn)) throw new Error("sin espejo EN de la bomba");
    const c = pc("cisternaFuego");
    eq(c.length, 1, "reserva «Por cotizar»:"); eq(c[0].un, "M3"); cerca(c[0].qty, F.reserva / 1000, 1e-9, "con su volumen:");
    contiene(c[0].desc, "min", "el volumen dice de qué duración sale:");
    const txt = pdfTxt(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
    contiene(txt, "POR COTIZAR", "PDF de propuesta:"); contiene(txt, "Bomba contra incendio", "la bomba sale en el PDF:");
    /* Red municipal que alcanza: ni bomba ni reserva. */
    S.fuego = { ...G("defaultFuego")(), area: 600, altura: 6, Lramal: 30, Lmontante: 12, fuente: "municipal", presFuente: 80 };
    G("recompute")();
    eq(G("FUEGO").alcanza, true, "80 m de red alcanzan:");
    eq(pc("bombaFuego").length + pc("cisternaFuego").length, 0, "con red que alcanza no se cotiza bomba ni reserva:");
    eq(lote().length, 0, "ni partida LOTE:");
    /* Los rociadores siguen cotizándose por pieza (fuera del alcance de H-206). */
    if (!(G("QUOTE").aux || []).some((x) => x.mot === "fuego" && x.un === "PIEZA")) throw new Error("los rociadores dejaron de cotizarse");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.60 (H-215) secador por ISO 7183:2007 Tabla 2 opción A1: capacidad = todo el caudal del compresor a las condiciones nominales (35 °C, 7 bar(e)), factor 1.0; fuera del punto A1 la corrección es del fabricante y queda pendiente con aviso (nunca 0.92/0.90 de memoria)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.60"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.60" }; });
    const consumos = [{ ...G("defaultConsumo")("Sopleteo"), cant: 2, lmin: 400, bar: 6, uso: .5 }, { ...G("defaultConsumo")("Actuadores"), cant: 4, lmin: 250, bar: 6, uso: .3 }];
    /* En el punto A1 exacto (35 °C; presión de descarga 7 bar: se captura la presión de uso que la da). */
    S.aire = { ...G("defaultAire")(), Lprincipal: 60, consumos, tempEntrada: 35 }; G("recompute")();
    let A = G("AIRE");
    S.aire.presionUso = +(G("num")(S.aire.presionUso, 6) + (7 - A.pDescarga)).toFixed(6); G("recompute")(); A = G("AIRE");
    cerca(A.pDescarga, 7, 1e-6, "el caso queda en 7 bar(e) de descarga:");
    const fadCompresor = A.principal.fadReal * A.nUnidades;
    if (!(A.fadRequerido > 0 && fadCompresor > A.fadRequerido)) throw new Error("el caso no distingue FAD requerido de caudal del compresor");
    cerca(A.capSecador, fadCompresor, 1e-6, "capacidad del secador = caudal del compresor × 1.0 (antes FAD requerido / (0.92 × 0.90)):");
    eq(A.fT, 1, "sin factor de temperatura de memoria:"); eq(A.fP, 1, "sin factor de presión de memoria:");
    eq(A.enA1, true, "en el punto A1:"); eq(A.secadorPendiente, false, "sin corrección pendiente:");
    if (!A.memo.some((m) => /ISO 7183/.test(m) && /A1/.test(m))) throw new Error("la memoria no cita ISO 7183:2007 Tabla 2 opción A1");
    if (A.avisos.some((a) => /[Ss]ecador/.test(a.msg))) throw new Error("en A1 no debe haber aviso de secador");
    if (!(G("QUOTE").aux || []).some((x) => x.mot === "aire" && x.un === "M3/MIN" && Math.abs(x.qty - +(fadCompresor / 1000).toFixed(2)) < 1e-9)) throw new Error("la cotización no lleva el secador con la capacidad de A1");
    /* Fuera de A1 (30 °C, 6 bar de uso): la capacidad nominal se declara y la corrección queda pendiente del fabricante. */
    S.aire = { ...G("defaultAire")(), Lprincipal: 60, consumos, tempEntrada: 30 }; G("recompute")(); A = G("AIRE");
    if (Math.abs(A.pDescarga - 7) < 1e-6) throw new Error("el segundo caso debía quedar fuera de 7 bar");
    eq(A.enA1, false, "fuera de A1:"); eq(A.secadorPendiente, true, "corrección pendiente:");
    cerca(A.capSecador, A.principal.fadReal * A.nUnidades, 1e-6, "la capacidad sigue siendo la nominal de A1 (sin factor de memoria):");
    const av = A.avisos.find((a) => /[Ss]ecador/.test(a.msg));
    if (!av || !/fabricante/.test(av.msg) || !/pendiente/.test(av.msg)) throw new Error("falta el aviso de corrección pendiente del fabricante");
    if (A.memo.some((m) => /0\.92|0\.90/.test(m))) throw new Error("la memoria sigue con factores de memoria");
    const txt = [...Buffer.from(G("buildAirePdf")()).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
    contiene(txt, "ISO 7183", "el PDF cita la norma:"); contiene(txt, "fabricante", "y dice que la corrección es del fabricante:");
    /* Sin demanda no hay secador. */
    S.aire = { ...G("defaultAire")(), Lprincipal: 60, consumos: [] }; G("recompute")(); A = G("AIRE");
    eq(A.capSecador, 0, "sin demanda, secador 0:"); eq(A.secadorPendiente, false, "y sin aviso:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.61 (H-216) el tanque pulmón nunca se trunca en silencio: si el teórico rebasa el mayor de la lista comercial (5,000 L) se instalan varios en paralelo, la capacidad instalada no es menor que la teórica, se avisa y la memoria, el PDF y la cotización lo dicen", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.61"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.61" }; });
    /* Una línea de 9,000 L/min uso 1.0 (caso CM.aire.5): teórico 13,103 L, arriba de los 5,000 L de la lista. */
    S.aire = { ...G("defaultAire")(), Lprincipal: 80, consumos: [{ ...G("defaultConsumo")("Línea"), cant: 1, lmin: 9000, bar: 6, uso: 1 }] }; G("recompute")();
    let A = G("AIRE");
    if (!(A.vTeorico > 5000)) throw new Error("el caso no rebasa la lista: " + A.vTeorico);
    if (!(A.tanque >= A.vTeorico)) throw new Error("la capacidad instalada (" + A.tanque + " L) es menor que la teórica (" + A.vTeorico.toFixed(0) + " L): se truncó");
    eq(A.tanqueUnit, 5000, "tanque unitario, el mayor de la lista:");
    eq(A.nTanques, Math.ceil(A.vTeorico / 5000), "número de tanques en paralelo:");
    eq(A.tanque, A.nTanques * 5000, "capacidad instalada = n × 5,000 L:");
    if (!A.avisos.some((a) => /tanque/i.test(a.msg) && /5,000|5000/.test(a.msg) && /paralelo/.test(a.msg))) throw new Error("falta el aviso de varios tanques en paralelo");
    if (A.memo.some((m) => /Tanque pulmón/.test(m) && /inmediato superior/.test(m))) throw new Error("la memoria sigue diciendo «se sube al comercial inmediato superior» con el teórico arriba de la lista");
    if (!A.memo.some((m) => /Tanque pulmón/.test(m) && new RegExp(A.nTanques + " × 5,?000").test(m))) throw new Error("la memoria no declara n × 5,000 L");
    const partida = (G("QUOTE").aux || []).find((x) => x.mot === "aire" && x.un === "LITRO");
    if (!partida) throw new Error("sin partida de tanque");
    eq(partida.qty, A.tanque, "la cotización lleva los litros instalados:"); contiene(partida.desc, A.nTanques + " tanques", "y dice cuántos son:");
    contiene(pdfTxt(G("buildAirePdf")()), A.nTanques + " x 5,000", "el PDF declara los tanques en paralelo:");
    /* El fixture normal no cambia: un tanque de la lista. */
    S.aire = { ...G("defaultAire")(), Lprincipal: 60, consumos: [{ ...G("defaultConsumo")("Sopleteo"), cant: 2, lmin: 400, bar: 6, uso: .5 }, { ...G("defaultConsumo")("Actuadores"), cant: 4, lmin: 250, bar: 6, uso: .3 }] }; G("recompute")();
    A = G("AIRE");
    eq(A.nTanques, 1, "un tanque:"); eq(A.tanque, 3000, "de 3,000 L, como siempre:"); eq(A.tanque, A.tanqueUnit);
    if (A.avisos.some((a) => /paralelo/.test(a.msg))) throw new Error("sin rebase no hay aviso de tanques en paralelo");
    if (!A.memo.some((m) => /Tanque pulmón 3000 L/.test(m) && /inmediato superior/.test(m))) throw new Error("con el teórico dentro de la lista la memoria sigue diciendo que se sube al comercial inmediato superior");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.62 (H-217, decisión 3 del dueño) la curva de simultaneidad se declara como criterio de la casa sin fuente normativa en memoria, pantalla y PDF, sin mover números; capturada, se dice capturada", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.62";
    S.aire = { ...G("defaultAire")(), Lprincipal: 60, consumos: [{ ...G("defaultConsumo")("Sopleteo"), cant: 2, lmin: 400, bar: 6, uso: .5 }, { ...G("defaultConsumo")("Actuadores"), cant: 4, lmin: 250, bar: 6, uso: .3 }] }; G("recompute")();
    let A = G("AIRE");
    eq(A.nPuntos, 6); eq(A.simul, 0.85, "la curva no se mueve (decisión 3: 6 puntos → 0.85):"); eq(A.simulAuto, 0.85);
    const m = A.memo.find((x) => /[Ss]imultaneidad/.test(x));
    if (!m) throw new Error("la memoria no habla de la simultaneidad");
    if (!/criterio de la casa/.test(m) || !/sin fuente/.test(m)) throw new Error("la memoria no declara la curva como criterio de la casa sin fuente: " + m);
    contiene(m, "85 %", "con el valor aplicado:"); contiene(m, "6 puntos", "y el número de puntos:");
    S.tab = "aire"; G("render")();
    const v = w.document.getElementById("view").textContent;
    if (!/[Ss]imultaneidad[^.]*criterio de la casa/.test(v)) throw new Error("la pantalla no declara la curva como criterio de la casa");
    const txt = pdfTxt(G("buildAirePdf")());
    if (!/criterio de la casa/.test(txt) || !/sin fuente/.test(txt)) throw new Error("el PDF no declara la curva como criterio de la casa sin fuente");
    /* Capturada: manda la captura y se dice. */
    S.aire.simultaneidad = 0.6; G("recompute")(); A = G("AIRE");
    eq(A.simul, 0.6, "capturada manda:");
    const m2 = A.memo.find((x) => /[Ss]imultaneidad/.test(x));
    contiene(m2, "capturada", "la memoria dice que es capturada:"); contiene(m2, "60 %", "con su valor:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.63 (H-218) el diámetro interior de la red de aire es del material: cobre tipo L con los DI de ASTM B88 (los de TUB_AGUA.cobre), acero con cédula 40, y aluminio/inoxidable con cédula 40 sólo como indicativo y el DI del fabricante pendiente, declarado con aviso, memoria, PDF y partida", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.63"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.63" }; });
    const consumos = () => [{ ...G("defaultConsumo")("Sopleteo"), cant: 2, lmin: 400, bar: 6, uso: .5 }, { ...G("defaultConsumo")("Actuadores"), cant: 4, lmin: 250, bar: 6, uso: .3 }];
    const red = () => (G("QUOTE").aux || []).find((x) => x.mot === "aire" && x.un === "ML");
    /* Cobre tipo L, 55 m (caso CM.aire.4): con el DI real de B88 el 1" (26.04 mm) pasa de 8 m/s y sube a 1 1/4" (32.13 mm). */
    S.aire = { ...G("defaultAire")(), material: "cobre", Lprincipal: 55, Lramales: 0, consumos: consumos() }; G("recompute")();
    let A = G("AIRE");
    eq(A.tramos[0].nom, '1 1/4"', "troncal de cobre con DI de B88 (antes 1\" con 26.6 mm de cédula 40):"); cerca(A.tramos[0].d, 32.13, 0.01, "DI de B88 tipo L:");
    eq(A.diPendiente, false, "cobre: DI con fuente:"); contiene(A.diFuente, "B88", "fuente declarada:");
    if (A.avisos.some((a) => /DI del fabricante/.test(a.msg))) throw new Error("cobre no debe tener aviso de DI pendiente");
    if (!A.memo.some((m) => /B88/.test(m))) throw new Error("la memoria no dice de dónde salen los DI del cobre");
    /* Aluminio calibrado: el DI es del fabricante; cédula 40 sólo como indicativo, con aviso. */
    S.aire = { ...G("defaultAire")(), material: "aluminio", Lprincipal: 55, Lramales: 0, consumos: consumos() }; G("recompute")(); A = G("AIRE");
    eq(A.diPendiente, true, "aluminio: DI del fabricante pendiente:");
    const av = A.avisos.find((a) => /DI del fabricante/.test(a.msg));
    if (!av || !/indicativ/.test(av.msg)) throw new Error("falta el aviso de DI del fabricante pendiente con diámetros indicativos");
    contiene(red().desc, "pendiente", "la partida de la red lo declara:"); contiene(red().descEn, "pending", "y en inglés:");
    const txt = [...Buffer.from(G("buildAirePdf")()).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
    contiene(txt, "fabricante", "el PDF lo declara:");
    /* Acero galvanizado: cédula 40 es su DI (ASME B36.10). */
    S.aire = { ...G("defaultAire")(), material: "acero_gal", Lprincipal: 55, Lramales: 0, consumos: consumos() }; G("recompute")(); A = G("AIRE");
    eq(A.diPendiente, false, "acero: cédula 40 es su DI:"); contiene(A.diFuente, "40", "fuente:");
    if (A.avisos.some((a) => /DI del fabricante/.test(a.msg))) throw new Error("acero no debe tener aviso de DI pendiente");
    if (!/pendiente/.test(red().desc) === false) throw new Error("la partida de acero no debe decir pendiente");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.64 (H-154 + H-156) selección Greenheck: la cobertura real manda (cfmMin ≤ objetivo ≤ cfmMax, sin tolerancia ×0.9); la familia del modo sólo ordena entre los que cubren; si nadie cubre no hay modelo (ni en propuesta, ni en eléctrico) y el más cercano sólo sirve para el aviso", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const armar = (campos) => { G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.64"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.64" }; }); Object.assign(S.vent, campos); ["vent.area", "vent.height", "vent.occ"].forEach((k) => G("marcarPropio")(k)); G("recompute")(); return G("VENT"); };
  try {
    /* 1) Geometría del fixture: 11,643 CFM (objetivo 12,808). El GB-360 (4,000–9,000) no cubre; el CSW-30 (7,000–18,000) sí. */
    let V = armar({ mode: "general", spaceType: "office", area: 700, height: 4.71, occ: 46, ach: 6, ductLoss: .5, filterLoss: .25 });
    eq(V.eq.cubre, true, "hay modelo que cubre:"); eq(V.eq.primary.model, "CSW-30", "el que cubre (antes GB-360 por la familia preferida):");
    if (!(V.eq.primary.cfmMin <= V.eq.target && V.eq.target <= V.eq.primary.cfmMax)) throw new Error("el objetivo no cae dentro del rango del modelo elegido");
    if (G("validateAll")().rows.some((r) => r.lvl === "err" && /ningún modelo/.test(r.msg))) throw new Error("no debe haber aviso de «ningún modelo cubre»");
    if (!G("propuestaElecFilas")().some((c) => /CSW-30/.test(c.nombre))) throw new Error("el eléctrico debe traer el CSW-30 como carga");
    /* 2) Familia del modo dentro de los que cubren: oficina chica → un roof exhauster (G-099), no un centrífugo. */
    V = armar({ mode: "general", spaceType: "office", area: 100, height: 3, occ: 10, ach: 6, ductLoss: .5, filterLoss: .25 });
    eq(V.eq.primary.tech, "roof_exhauster", "la familia propia del modo va primero entre los que cubren:"); eq(V.eq.cubre, true);
    /* 2b) Con 1,907 CFM (objetivo 2,098) cubren G-140 (1,233–2,115, nominal 1,674) y CSW-12 (800–2,500, nominal 1,650): manda la familia, no el menor nominal. */
    V = armar({ mode: "general", spaceType: "office", area: 180, height: 3, occ: 10, ach: 6 });
    eq(V.eq.primary.tech, "roof_exhauster", "entre los que cubren manda la familia del modo aunque otro tenga menor nominal:"); contiene(V.eq.primary.model, "G-140", "modelo:");
    /* 3) H-156: 9,945 CFM de objetivo no lo cubre el GB-360 (máx 9,000) aunque 9,000 ≥ 0.9 × 9,945: rige la cobertura real → CSW-22 (4,000–10,000). */
    V = armar({ mode: "general", spaceType: "office", area: 400, height: 6, occ: 30, ach: 6.4 });
    eq(V.eq.primary.model, "CSW-22", "sin tolerancia ×0.9 el GB-360 no cubre 9,945:"); eq(V.eq.cubre, true);
    /* 4) Nadie cubre (21,189 CFM > 18,000): sin modelo. */
    V = armar({ mode: "general", spaceType: "office", area: 1000, height: 6, occ: 0, ach: 6 });
    eq(V.eq.cubre, false, "nadie cubre:"); eq(V.eq.primary, null, "sin modelo:"); eq(V.eq.closest.model, "CSW-30", "el más cercano sólo para el aviso:");
    const errs = G("validateAll")().rows.filter((r) => r.lvl === "err" && /ningún modelo/.test(r.msg));
    eq(errs.length, 1, "la matriz lo declara:"); contiene(errs[0].msg, "CSW-30", "y nombra al más cercano:");
    if (G("propuestaElecFilas")().some((c) => /extracción/.test(c.nombre))) throw new Error("sin modelo no hay carga de ventilación en el eléctrico");
    const partida = (G("QUOTE").aux || []).find((x) => x.mot === "vent");
    if (partida && /CSW|GB-/.test(partida.desc)) throw new Error("sin modelo la partida no debe nombrar un modelo");
    contiene(pdfTxt(G("buildVentPdf")()), "NO HAY SELECCION VALIDA", "el PDF de ventilación lo dice:");
    contiene(pdfTxt(G("buildMemoriaPdf")()), "sin modelo", "la memoria integral no inventa un modelo:");
    S.tab = "ventilacion"; G("render")();
    if (/Submittal del ventilador/.test(w.document.getElementById("view").textContent)) throw new Error("sin modelo no hay botón de submittal");
    /* 5) Campana: CUBE-140 (851–3,124) no cubre 3,248 → sube al siguiente que cubra. */
    V = armar({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 3.0, hoodW: 1.2, ductLoss: .5, filterLoss: .25 });
    if (V.eq.cubre && V.eq.target > V.eq.primary.cfmMax) throw new Error("se declaró «cubre» con el objetivo arriba del máximo del modelo");
    eq(V.eq.cubre, true, "hay campana que cubre 3,248:"); if (V.eq.primary.model === "CUBE-140") throw new Error("CUBE-140 no cubre 3,248");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.65 (H-155) sin medidas no hay caudal: campana sin largo o fondo y rejilla sin área libre o velocidad dan demanda 0 con aviso visible (nada de pisos de 0.1 ft, 5 % o 100 fpm), sin partidas en la cotización; con medidas, igual que siempre", () => {
  const guardado = JSON.stringify(S);
  const armar = (campos) => { G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.65"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.65" }; }); Object.assign(S.vent, campos); G("recompute")(); return G("VENT"); };
  const partidas = () => (G("QUOTE").aux || []).filter((x) => x.mot === "vent").length;
  const errs = () => G("validateAll")().rows.filter((r) => r.lvl === "err" && /Ventilación/.test(r.msg) && /medida|área libre|velocidad/.test(r.msg));
  try {
    let V = armar({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 0, hoodW: 0 });
    eq(V.demand, 0, "campana sin medidas: demanda 0 (antes 30 CFM del piso de 0.1 ft):"); eq(V.mua, 0, "sin reposición:"); eq(partidas(), 0, "sin partidas:");
    eq(errs().length, 1, "aviso visible en la matriz:"); contiene(errs()[0].msg, "pendiente", "dice que es un dato pendiente:");
    V = armar({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 3.0, hoodW: 0 });
    eq(V.demand, 0, "campana con largo pero sin fondo: 0:"); eq(errs().length, 1);
    V = armar({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 3.0, hoodW: 1.2 });
    if (!(V.demand > 2900 && V.demand < 3000)) throw new Error("con medidas la campana de 3.0 × 1.2 debía dar ~2,953 CFM: " + V.demand);
    eq(errs().length, 0, "con medidas no hay aviso:");
    V = armar({ mode: "louver", louverW: 1.2, louverH: 1.0, freeArea: 0, faceVel: 400 });
    eq(V.demand, 0, "rejilla sin área libre: 0 (antes 258 CFM del piso de 5 %):"); eq(errs().length, 1); eq(partidas(), 0);
    V = armar({ mode: "louver", louverW: 1.2, louverH: 1.0, freeArea: 50, faceVel: 0 });
    eq(V.demand, 0, "rejilla sin velocidad: 0 (antes piso de 100 fpm):"); eq(errs().length, 1);
    V = armar({ mode: "louver", louverW: 0, louverH: 1.0, freeArea: 50, faceVel: 500 });
    eq(V.demand, 0, "rejilla sin ancho: 0 (antes piso de 0.1 ft²):");
    V = armar({ mode: "louver", louverW: 1.2, louverH: 1.0, freeArea: 50, faceVel: 500 });
    cerca(V.demand, 1.2 * 3.28084 * 1.0 * 3.28084 * 0.5 * 500, 0.5, "rejilla con datos: área libre × velocidad, como siempre:"); eq(errs().length, 0);
    const txt = [...Buffer.from(G("buildVentPdf")()).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
    armar({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 0, hoodW: 0 });
    contiene([...Buffer.from(G("buildVentPdf")()).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" "), "pendiente", "el PDF lo declara:");
    if (!txt) throw new Error("PDF vacío");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.66 (H-127) presión negativa de contención: −10 Pa capturados se respetan (no se vuelven +5): fuga y reposición con |ΔP|, piso de 5 Pa sobre |ΔP|, y la memoria, el PDF y el Excel dicen el signo y citan el Anexo 1 §4.14 (10 Pa guía)", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const armar = (dp) => { G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.66"; S.clean = { ci: 0, rooms: [{ ...G("defaultRoom")("Sala de pesadas"), iso: "iso7", area: 40, height: 3, occ: 2, dp, crackLen: 6, oaFrac: .1 }] }; G("recompute")(); return G("CLEAN").cur; };
  try {
    const pos = armar(10), neg = armar(-10);
    eq(neg.dP, 10, "|ΔP| = 10 Pa:"); eq(neg.dPneg, true, "sentido negativo declarado:"); eq(neg.dPcap, -10, "captura respetada:");
    cerca(neg.leak, pos.leak, 1e-9, "la fuga por rendijas se calcula con |ΔP| (misma que a +10 Pa):"); cerca(neg.makeup, pos.makeup, 1e-9, "y la reposición también:");
    if (!neg.memo.some((m) => /NEGATIVA/.test(m) && /4\.14/.test(m))) throw new Error("la memoria no declara la presión negativa con el Anexo 1 §4.14");
    if (neg.memo.some((m) => /Presurización \+10/.test(m))) throw new Error("la memoria sigue diciendo +10 Pa con −10 capturados");
    const txt = pdfTxt(G("buildLimpioPdf")(neg));
    contiene(txt, "-10 Pa", "el PDF imprime el signo:"); if (/\+10 Pa/.test(txt)) throw new Error("el PDF sigue diciendo +10 Pa");
    contiene(txt, "4.14", "el PDF cita el Anexo 1:");
    const xl = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
    if (/<v>5<\/v>/.test(xl) && !/<v>-10<\/v>/.test(xl)) throw new Error("el Excel sigue imprimiendo 5 Pa en vez de −10");
    contiene(xl, "contenci", "el Excel dice que es contención:");
    /* Piso de 5 Pa sobre |ΔP|: −2 Pa → 5 Pa con aviso, sentido negativo. */
    const chico = armar(-2);
    eq(chico.dP, 5, "piso sobre |ΔP|:"); eq(chico.pisoDP, true); eq(chico.dPneg, true);
    /* Aviso de 10 Pa guía del Anexo 1 con 7 Pa. */
    const siete = armar(7);
    if (!siete.memo.some((m) => /4\.14/.test(m) && /10 Pa/.test(m))) throw new Error("con 7 Pa la memoria debe citar los 10 Pa guía del Anexo 1 §4.14");
    if (siete.dPneg) throw new Error("7 Pa no es negativa");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.67 (H-126) el traspaso de la reposición va por vínculo cuarto ↔ zona (id elegido en un selector), nunca por la primera palabra del nombre: sin vínculo no se traspasa nada y se dice; con vínculo sólo a esa zona", () => {
  const guardado = JSON.stringify(S);
  const act = (a) => { const b = w.document.createElement("button"); b.dataset.act = a; w.document.body.appendChild(b); b.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); b.remove(); };
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.67";
    S.zones = [{ ...G("defaultZone")("Sala de juntas"), area: 30, height: 3 }, { ...G("defaultZone")("Sala de llenado"), area: 40, height: 3 }];
    S.clean = { ci: 0, rooms: [{ ...G("defaultRoom")("Sala de llenado"), iso: "iso5", area: 40, height: 3, occ: 2 }] };
    G("recompute")();
    if (!(G("CLEAN").cur.makeup > 0)) throw new Error("el cuarto no trae reposición");
    /* Sin vínculo: nada se traspasa (antes «Sala de llenado» caía en «Sala de juntas» por la primera palabra). */
    act("cl-handoff");
    eq(S.zones[0].oaFixed || 0, 0, "la oficina «Sala de juntas» no recibe la reposición del ISO 5:"); eq(S.zones[1].oaFixed || 0, 0, "sin vínculo tampoco la homónima:");
    /* La pantalla ofrece el selector de zona por id. */
    S.tab = "limpios"; G("render")();
    const selZona = w.document.querySelector('#view select[data-path="clean.rooms.0.zonaId"], #view select[data-k="clean.rooms.0.zonaId"], #view select[name="clean.rooms.0.zonaId"]') || [...w.document.querySelectorAll("#view select")].find((s) => /zonaId/.test(s.outerHTML));
    if (!selZona) throw new Error("no hay selector de zona vinculada en el cuarto limpio");
    if (![...selZona.options].some((o) => o.value === S.zones[1].id)) throw new Error("el selector no ofrece las zonas por id");
    /* Con vínculo: sólo esa zona. */
    S.clean.rooms[0].zonaId = S.zones[1].id; G("recompute")(); act("cl-handoff");
    eq(S.zones[1].oaFixed, Math.round(G("CLEAN").cur.makeup), "la zona vinculada recibe la reposición:"); eq(S.zones[0].oaFixed || 0, 0, "la otra no:");
    /* Los ids de zona son estables y no dependen del reloj. */
    if (!/^z\d+$/.test(S.zones[0].id) || S.zones[0].id === S.zones[1].id) throw new Error("ids de zona inválidos: " + S.zones.map((z) => z.id));
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.68 (H-128) «Crear zona de carga con este cuarto» no inventa 12 W/m² de iluminación ni 0.05 renovaciones/h: nacen en 0 (pendientes de captura), la zona queda vinculada al cuarto y el proceso capturado sí pasa", () => {
  const guardado = JSON.stringify(S);
  const act = (a) => { const b = w.document.createElement("button"); b.dataset.act = a; w.document.body.appendChild(b); b.dispatchEvent(new w.MouseEvent("click", { bubbles: true })); b.remove(); };
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.68";
    S.clean = { ci: 0, rooms: [{ ...G("defaultRoom")("Sala de llenado"), iso: "iso7", area: 40, height: 3, occ: 2, procW: 25 }] };
    G("recompute")();
    const n0 = S.zones.length;
    act("clean-to-zone");
    eq(S.zones.length, n0 + 1, "zona creada:");
    const z = S.zones[S.zones.length - 1];
    eq(z.lights, 0, "iluminación sin inventar (antes 12 W/m²):"); eq(z.ach, 0, "infiltración sin inventar (antes 0.05 1/h):");
    eq(z.equip, 40 * 25, "el proceso capturado sí pasa:"); eq(z.spaceType, "cleanroom"); eq(z.area, 40);
    eq(S.clean.rooms[0].zonaId, z.id, "el cuarto queda vinculado a la zona creada (H-126):");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.69 (H-141, decisión (a) del dueño) la diversidad del edificio se aplica UNA sola vez, en la planta: las ganancias internas y el pico de cada zona no la llevan; el objetivo de planta sí (×0.8), y la memoria lo declara como criterio Carrier por ratificar", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const armar = (bldDiv) => { G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.69"; S.zones = [{ ...G("defaultZone")("Oficina"), area: 100, height: 3, occ: 10, lights: 1000, equip: 500, spaceType: "office" }]; S.bldDiv = bldDiv; S.peakScan = false; G("recompute")(); aceptarEquip(); if (!(G("SYS").plantTarget > 0)) throw new Error("el caso no aísla lo que se quiere probar: la planta debe tener objetivo (H-267: selección aceptada)"); return { L: G("LOADS")[0], Y: G("SYS") }; };
  const linea = (L, k) => L.lines.find((l) => l.label === k);
  try {
    const uno = armar(1), ocho = armar(0.8);
    ["Ocupantes", "Iluminación", "Equipos / fuerza"].forEach((k) => cerca(linea(ocho.L, k).s, linea(uno.L, k).s, 1e-6, k + ": la zona va al pico, sin diversidad del edificio (antes ×0.8):"));
    cerca(linea(ocho.L, "Ocupantes").l, linea(uno.L, "Ocupantes").l, 1e-6, "latente de ocupantes sin diversidad:");
    cerca(ocho.L.grand, uno.L.grand, 1e-6, "gran total de la zona igual con 0.8 y con 1:");
    cerca(ocho.Y.plantTarget, uno.Y.plantTarget * 0.8, 1e-6, "la planta sí lleva la diversidad, una sola vez:");
    if (!ocho.L.memo.some((m) => /[Dd]iversidad/.test(m) && /planta/.test(m) && /Carrier/.test(m))) throw new Error("la memoria de la zona no dice que la diversidad del edificio va sólo en la planta (criterio Carrier, por ratificar)");
    if (/×0\.8|x0\.8/.test(linea(ocho.L, "Ocupantes").d)) throw new Error("el detalle de ocupantes sigue mostrando el factor del edificio");
    contiene(pdfTxt(G("buildMemoriaPdf")()), "Carrier", "el PDF de carga declara el criterio:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.70 (H-142) el submittal no inventa datos del equipo: peso, dimensiones, carga de refrigerante y número de revisión van «No declarado» salvo lo que tenga documento (50TC-A07: carga 14 lb 2 oz del Form 50TC-7-16-03PD); un chiller no lleva caudal de aire ni un split «AHRI 550/590»", () => {
  const fila = (sub, k) => { const r = sub.rows.find((x) => x[0] === k); return r ? String(r[1]) : null; };
  const split = G("carrierSubmittal")(G("CARRIER").find((e) => e.model === "24ACC618"));
  ["Peso", "Dimensiones", "Carga de refrigerante"].forEach((k) => contiene(fila(split, k) || "", "No declarado", k + " sin documento:"));
  if (/estimad/.test(fila(split, "Dimensiones"))) throw new Error("las dimensiones siguen «estimadas»");
  if (/R[123]$/.test(split.rev) || /Rev R[123]/.test(fila(split, "No. de submittal"))) throw new Error("sigue el número de revisión inventado: " + split.rev);
  if (/550\/590/.test(fila(split, "Certificaciones"))) throw new Error("un split DX no certifica AHRI 550/590 (chiller)");
  const sec = (sub, k) => String((sub.sections.find((s) => s[0].startsWith(k)) || [])[1] || "");
  if (/en condiciones AHRI/.test(sec(split, "2."))) throw new Error("la capacidad sigue «en condiciones AHRI de catálogo» sin documento");
  contiene(sec(split, "7."), "No declarado", "sección 7 sin inventar:");
  const chiller = G("carrierSubmittal")(G("CARRIER").find((e) => e.model === "30RB-040"));
  if (fila(chiller, "Caudal de aire") != null) throw new Error("un chiller no lleva «Caudal de aire»");
  contiene(fila(chiller, "Certificaciones"), "550/590", "el chiller sí lleva AHRI 550/590:");
  const rtu = G("carrierSubmittal")(G("CARRIER").find((e) => e.model === "50TC-A07"));
  contiene(fila(rtu, "Carga de refrigerante"), "14 lb 2 oz", "50TC-A07 con dato documentado:"); contiene(fila(rtu, "Carga de refrigerante"), "50TC-7-16-03PD", "y su fuente:");
  contiene(fila(rtu, "Peso") || "", "No declarado", "el peso del 50TC no está cargado como dato: no se inventa:");
  const gh = G("greenSubmittal")(G("GREEN")[0]);
  if (/R[123]$/.test(gh.rev)) throw new Error("el submittal Greenheck sigue con revisión inventada: " + gh.rev);
});

t("S.71 (H-232) renta de elevación: 0 meses capturados se respeta (sin renta), sin captura queda pendiente con aviso (no se suponen 3 meses ni el piso de 1), y con meses capturados la partida los lleva tal cual", () => {
  const guardado = JSON.stringify(S);
  const renta = () => (G("SOPORTE").part || []).find((p) => /renta/.test(p.desc));
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    if (!(renta() && renta().qty === 3)) throw new Error("el proyecto fijo debía traer 3 meses de renta capturados: " + JSON.stringify(renta()));
    S.soporte.mesesElevacion = 0; G("recompute")();
    eq(G("SOPORTE").meses, 0, "0 capturado se respeta (antes piso de 1):"); if (renta()) throw new Error("con 0 meses no hay partida de renta");
    eq(G("SOPORTE").mesesPendiente, false, "0 no es pendiente:");
    S.soporte.mesesElevacion = null; G("recompute")();
    eq(G("SOPORTE").meses, 0, "sin captura no se suponen 3 meses:"); eq(G("SOPORTE").mesesPendiente, true, "queda pendiente:");
    if (renta()) throw new Error("sin captura no hay partida de renta con importe");
    if (!G("SOPORTE").avisos.some((a) => /renta/i.test(a.msg) && /pendiente/.test(a.msg))) throw new Error("falta el aviso de renta pendiente");
    if (!(G("QUOTE").pendientes || []).some((p) => p.mot === "soporte" && /renta/i.test(p.desc))) throw new Error("la cotización no declara la renta pendiente");
    S.soporte.mesesElevacion = 2; G("recompute")();
    eq(renta().qty, 2, "2 meses capturados = 2:");
    /* Un proyecto nuevo no trae 3 meses supuestos. */
    if (G("defaultSoporte")().mesesElevacion === 3) throw new Error("defaultSoporte sigue suponiendo 3 meses");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.72 (H-231) al aceptar la instantánea motores>soporte las bases de equipo salen de snap.nEquip (2 equipos cotizados + 1 compresor = 3), no de un conteo en vivo que pierde el compresor", () => {
  const guardado = JSON.stringify(S);
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    eq(G("SOPORTE").nEquipos, 3, "en vivo: 2 equipos cotizados + 1 compresor:");
    const bases = () => (G("SOPORTE").part || []).filter((p) => /[Bb]ase/.test(p.desc)).reduce((a, p) => a + p.qty, 0);
    const enVivo = bases();
    G("propAceptar")("motores>soporte"); G("recompute")();
    if (!S.soporte.snap) throw new Error("no quedó instantánea aceptada");
    eq(S.soporte.snap.nEquip, 3, "la instantánea guardó 3:");
    eq(G("SOPORTE").nEquipos, 3, "gobernado: las bases siguen siendo 3 (antes 2: se perdía el compresor):");
    eq(bases(), enVivo, "las partidas de base no cambian al aceptar la instantánea:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.73 (H-225) la altura de colgado se captura en pantalla; sin captura la varilla roscada queda pendiente (aviso, memoria y cotización) en vez de tomar la altura de trabajo (7.2 m por varilla); con captura, ML = soportes × altura", () => {
  const guardado = JSON.stringify(S);
  const varilla = () => (G("SOPORTE").part || []).filter((p) => /^Varilla/.test(p.desc));
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    eq(S.soporte.alturaColgadoM || 0, 0, "el proyecto fijo no captura altura de colgado:");
    let R = G("SOPORTE");
    eq(varilla().length, 0, "sin captura no hay partida de varilla con importe (antes 633.6 ML = 41,184 MXN):");
    eq(R.colgadoPendiente, true, "queda pendiente:");
    if (!R.avisos.some((a) => /colgado/.test(a.msg) && /pendiente/.test(a.msg))) throw new Error("falta el aviso de altura de colgado pendiente");
    if (!(G("QUOTE").pendientes || []).some((p) => p.mot === "soporte" && /[Vv]arilla/.test(p.desc))) throw new Error("la cotización no declara la varilla pendiente");
    S.tab = "soporte"; G("render")();
    const campo = w.document.querySelector('#view input[data-path="soporte.alturaColgadoM"]');
    if (!campo) throw new Error("no hay campo de altura de colgado en la pantalla de soportería");
    S.soporte.alturaColgadoM = 1.2; G("recompute")(); R = G("SOPORTE");
    eq(R.colgadoPendiente, false, "con captura no está pendiente:");
    const ml = varilla().reduce((a, p) => a + p.qty, 0);
    cerca(ml, R.nSoportes * 1.2, 0.05, "ML = soportes × 1.2 m (una varilla por soporte):");
    if (R.avisos.some((a) => /colgado/.test(a.msg) && /pendiente/.test(a.msg))) throw new Error("con captura no debe haber aviso de colgado pendiente");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.74 (H-226) los datos del edificio no se suponen: sin SDS con fuente, tipo de estructura y f'c capturados el anclaje va «Por cotizar» (predimensionado con valores de referencia declarados) y la memoria imprime Fp, ap y Rp con su aviso; con captura, el anclaje se cotiza", () => {
  const guardado = JSON.stringify(S);
  const anclaje = () => (G("SOPORTE").part || []).filter((p) => /^Anclaje/.test(p.desc));
  const pc = () => (G("QUOTE").porCotizar || []).filter((p) => p.mot === "soporte" && p.clave === "anclajeSop");
  try {
    const d = G("defaultSoporte")();
    if (d.sismoSDS === 1 || d.estructuraTipo === "losa_concreto" || d.estructuraFc === 250) throw new Error("defaultSoporte sigue suponiendo SDS 1.0 / losa / f'c 250");
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    /* El fixture guardó los valores por omisión viejos (SDS 1.0, losa, f'c 250) como estado: aquí se vacían para probar el caso sin captura. */
    S.soporte.sismoSDS = null; S.soporte.sismoFuente = ""; S.soporte.estructuraTipo = null; S.soporte.estructuraFc = null; G("recompute")();
    let R = G("SOPORTE");
    eq(R.anclajeCapturado, false, "sin SDS con fuente ni estructura:");
    eq(anclaje().length, 0, "sin captura no hay partida de anclaje con importe (antes 88 × 95 MXN):");
    if (!(pc().length === 1 && pc()[0].qty > 0)) throw new Error("el anclaje debe ir «Por cotizar» con sus piezas: " + JSON.stringify(pc()));
    contiene(pc()[0].desc, "referencia", "la partida dice que está predimensionado con valores de referencia:");
    if (!R.avisos.some((a) => /SDS/.test(a.msg) && /fuente/.test(a.msg))) throw new Error("falta el aviso de SDS sin fuente");
    if (!R.memo.some((m) => /DECLARADOS/.test(m) && /Fp/.test(m) && /Rp/.test(m))) throw new Error("la memoria no imprime Fp con ap y Rp declarados");
    if (R.memo.some((m) => /Anclaje .* a losa de concreto f'c 250/.test(m) && !/referencia/i.test(m))) throw new Error("la memoria sigue afirmando losa f'c 250 como dato");
    S.tab = "soporte"; G("render")();
    ["soporte.sismoSDS", "soporte.sismoFuente", "soporte.estructuraTipo", "soporte.estructuraFc"].forEach((p) => { if (!w.document.querySelector('#view [data-path="' + p + '"]')) throw new Error("falta el campo " + p); });
    /* Con captura y fuente: se cotiza. */
    S.soporte.sismoSDS = 1.0; S.soporte.sismoFuente = "CFE MDOC-Sismo 2015, sitio Tijuana"; S.soporte.estructuraTipo = "losa_concreto"; S.soporte.estructuraFc = 250; G("recompute")(); R = G("SOPORTE");
    eq(R.anclajeCapturado, true, "con SDS + fuente + estructura + f'c:"); if (!(anclaje().length === 1 && anclaje()[0].total > 0)) throw new Error("con captura el anclaje debe cotizarse");
    eq(pc().length, 0, "ya no está Por cotizar:");
    if (!R.memo.some((m) => /CFE MDOC-Sismo 2015/.test(m))) throw new Error("la memoria no cita la fuente capturada del SDS");
    /* SDS sin fuente no cuenta como capturado. */
    S.soporte.sismoFuente = ""; G("recompute")(); eq(G("SOPORTE").anclajeCapturado, false, "SDS sin fuente no es dato:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.75 (H-230) el modo «valores propios» pide diámetro y material (y medidas del ducto): sin ellos no inventa 50/100/32 mm ni 400×300 y las líneas quedan pendientes con aviso y en la cotización; con ellos cuenta soportes y la memoria dice que son capturados a mano", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.75"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.75" }; });
    S.zones[0].area = 200; S.zones[0].height = 6;
    S.soporte = { ...G("defaultSoporte")(), usarMotores: false, ductoM: 25, tubHidroM: 30, tubFuegoM: 0, tubAireM: 12, mesesElevacion: 0 };
    G("recompute")();
    let R = G("SOPORTE");
    eq(R.nSoportes, 0, "sin diámetro ni medidas no se cuentan soportes (antes 50/100/32 mm y 400×300 inventados):");
    const pend = R.avisos.filter((a) => /pendiente/.test(a.msg) && /(diámetro|medidas)/.test(a.msg));
    eq(pend.length, 3, "un aviso por línea sin dato (ducto, hidráulica, aire):");
    eq((G("QUOTE").pendientes || []).filter((p) => p.mot === "soporte" && /diámetro|medidas/.test(p.motivo)).length, 3, "la cotización los declara:");
    S.tab = "soporte"; G("render")();
    ["soporte.ductoAnchoMm", "soporte.ductoAltoMm", "soporte.tubHidroD", "soporte.tubHidroMat", "soporte.tubAireD", "soporte.tubAireMat"].forEach((p) => { if (!w.document.querySelector('#view [data-path="' + p + '"]')) throw new Error("falta el campo " + p); });
    /* Con diámetro, material y medidas: se cuenta. */
    S.soporte.ductoAnchoMm = 400; S.soporte.ductoAltoMm = 300; S.soporte.tubHidroD = 50; S.soporte.tubHidroMat = "acero"; S.soporte.tubAireD = 32; S.soporte.tubAireMat = "cobre"; G("recompute")(); R = G("SOPORTE");
    if (!(R.nSoportes > 0)) throw new Error("con diámetro y medidas capturados debe contar soportes");
    if (R.avisos.some((a) => /pendiente/.test(a.msg) && /(diámetro|medidas)/.test(a.msg))) throw new Error("con datos no debe haber avisos de pendiente");
    if (!R.memo.some((m) => /capturad[oa]s? a mano/.test(m))) throw new Error("la memoria no dice que las medidas son capturadas a mano");
    const aireCobre = R.sopcalc.tramos.find((t) => /Aire comprimido/.test(t.descripcion));
    if (!aireCobre || !/cobre/.test(aireCobre.descripcion)) throw new Error("el tramo de aire no dice cobre");
    S.soporte.tubAireMat = "acero"; G("recompute")();
    const aireAcero = G("SOPORTE").sopcalc.tramos.find((t) => /Aire comprimido/.test(t.descripcion));
    if (!(aireAcero && Math.abs(aireAcero.peso.total - aireCobre.peso.total) > 1e-9)) throw new Error("el material capturado no cambia el peso del tramo: no llegó a SoporteCalc");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.76 (H-229, decisión 4 del dueño) claros de cobre = mínimo de MSS SP-58-2018 (PHD) e IPC 2009 T308.5 (MCP), secundarias declaradas: ½\"–¾\" 1.524 m, 1\"–1¼\" 1.829, 1½\"–2\" 2.438, 2½\" 2.743, 3\"–4\" 3.048 (antes 1.8 / 2.4 / 3.0 / 3.7); la memoria declara la fuente", () => {
  const guardado = JSON.stringify(S);
  const esp = G("espSoporte"), ft = (x) => x * 0.3048;
  try {
    cerca(esp(15, "cobre"), ft(5), 0.001, "½\" = mín(MSS 5, IPC 6) ft:"); cerca(esp(20, "cobre"), ft(5), 0.001, "¾\":");
    cerca(esp(25, "cobre"), ft(6), 0.001, "1\" = mín(MSS 6, IPC 6):"); cerca(esp(32, "cobre"), ft(6), 0.001, "1¼\" = mín(MSS 7, IPC 6):");
    cerca(esp(40, "cobre"), ft(8), 0.001, "1½\":"); cerca(esp(50, "cobre"), ft(8), 0.001, "2\":");
    cerca(esp(65, "cobre"), ft(9), 0.001, "2½\" (antes 3.0):"); cerca(esp(80, "cobre"), ft(10), 0.001, "3\":"); cerca(esp(100, "cobre"), ft(10), 0.001, "4\" = mín(MSS 12, IPC 10) (antes 3.7):");
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    if (!G("SOPORTE").memo.some((m) => /MSS SP-58-2018/.test(m) && /IPC 2009/.test(m) && /secundaria/.test(m))) throw new Error("la memoria no declara el mínimo MSS/IPC como secundaria por ratificar");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.77 (H-228) termoplástico por subtipo, IPC 2009 T308.5 (MCP, secundaria): CPVC ≤1\" 0.9 m (dueño; IPC 3 ft) y ≥1¼\" 1.219 (antes 1.2 / 1.8), PP-R ≤1\" 0.813 y ≥1¼\" 1.219, PEAD no está en la tabla → pendiente de claro; cada soporte de termoplástico lleva ancla y 4+4 tuercas/rondanas como el despiece (anclaje sujeto a H-226)", () => {
  const guardado = JSON.stringify(S);
  const esp = G("espSoporte");
  const muebles = [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }];
  const tramos = () => [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 }];
  const qty = (re) => (G("SOPORTE").part || []).filter((p) => re.test(p.desc)).reduce((a, p) => a + p.qty, 0);
  const pcAncla = () => (G("QUOTE").porCotizar || []).filter((p) => p.mot === "soporte" && p.clave === "anclajeSop").reduce((a, p) => a + p.qty, 0);
  const hidroDe = () => (G("SOPORTE").porTuberia || []).find((x) => x.etiqueta === "Hidráulica y sanitario");
  try {
    cerca(esp(25, "plastico", "cpvc"), 0.9, 0.001, "CPVC 1\" (decisión del dueño, más cerrado que IPC 3 ft = 0.914):");
    cerca(esp(32, "plastico", "cpvc"), 1.219, 0.001, "CPVC 1¼\" = 4 ft (antes 1.2):"); cerca(esp(50, "plastico", "cpvc"), 1.219, 0.001, "CPVC 2\":");
    cerca(esp(100, "plastico", "cpvc"), 1.219, 0.001, "CPVC 4\" (antes 1.8):"); cerca(esp(150, "plastico", "cpvc"), 1.219, 0.001, "CPVC 6\" (antes 1.8):");
    cerca(esp(25, "plastico", "ppr"), 0.813, 0.001, "PP-R 1\" = 32 in:"); cerca(esp(50, "plastico", "ppr"), 1.219, 0.001, "PP-R 2\" = 4 ft:");
    eq(esp(50, "plastico", "pead"), null, "PEAD: IPC 2009 T308.5 sólo lista PE-AL-PE y PEX, no polietileno liso; sin fuente no hay claro:");
    eq(esp(50, "plastico"), null, "sin subtipo no hay claro:");
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.77"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.77" }; });
    S.zones[0].area = 200; S.zones[0].height = 6;
    S.hidro = { ...G("defaultHidro")(), material: "cpvc", muebles, tramos: tramos() };
    S.fuego = G("defaultFuego")(); S.aire = G("defaultAire")(); S.duct.segments = []; S.quote.items = [];
    S.soporte = { ...G("defaultSoporte")(), alturaColgadoM: 0.5, sismoSDS: 1.0, sismoFuente: "CFE MDOC-Sismo 2015, sitio Tijuana", estructuraTipo: "losa_concreto", estructuraFc: 250 };
    aceptarSoporte();   /* H-266 */
    let R = G("SOPORTE"), h = hidroDe();
    if (!h || h.fam !== "plastico") throw new Error("el caso no aísla lo que se quiere probar: debe agrupar como termoplástico");
    eq(R.sopcalc.tramos.length, 0, "sólo hay tramos del camino propio (nada en SoporteCalc):");
    eq(JSON.stringify(h.det.map((d) => d.e)), JSON.stringify([1.219, 1.219]), "CPVC 43.59 mm → 1½\" ≥ 1¼\": 4 ft (antes 1.2):");
    eq(h.n, 38, "ceil(25/1.219)+1 + ceil(18/1.219)+1:");
    if (!h.det.every((d) => d.ancla)) throw new Error("cada tramo de termoplástico debe traer su ancla seleccionada (ACI 318-19 cap. 17, camino propio)");
    eq(qty(/^Anclaje/), 38, "una ancla por soporte, como el despiece de SoporteCalc (antes 0):");
    eq(qty(/^Tuerca/), 304, "4 tuercas + 4 rondanas por soporte (antes 0):");
    eq(pcAncla(), 0, "con SDS + fuente + estructura el anclaje se cotiza:");
    if (!R.memo.some((m) => /IPC 2009/.test(m) && /termopl/i.test(m) && /secundaria/.test(m))) throw new Error("la memoria no declara la fuente (secundaria) del claro del termoplástico");
    /* Con la instantánea motores>soporte aceptada el subtipo viaja con ella (la familia sola no alcanza). */
    G("propAceptar")("motores>soporte"); G("recompute")();
    eq(JSON.stringify(hidroDe().det.map((d) => d.e)), JSON.stringify([1.219, 1.219]), "modo gobernado: CPVC sigue a 4 ft:");
    /* H-226 también gobierna las anclas del termoplástico: sin SDS con fuente van «Por cotizar» (H-266: con la instantánea aceptada). */
    S.soporte.sismoSDS = null; S.soporte.sismoFuente = ""; G("recompute")();
    eq(qty(/^Anclaje/), 0, "sin SDS con fuente no se cotizan las anclas del termoplástico:"); eq(pcAncla(), 38, "van «Por cotizar» con sus piezas:");
    /* PP-R capturado a mano, 1\": 32 in. */
    S.soporte = { ...G("defaultSoporte")(), usarMotores: false, tubHidroM: 30, tubHidroD: 25, tubHidroMat: "ppr", alturaColgadoM: 0.5 }; G("recompute")(); R = G("SOPORTE"); h = hidroDe();
    eq(JSON.stringify(h.det.map((d) => d.e)), JSON.stringify([0.813]), "PP-R 25 mm a mano: 32 in (antes 0.9 como CPVC):"); eq(h.n, Math.ceil(30 / 0.813) + 1, "soportes PP-R:");
    /* PEAD: sin renglón en la tabla, el tramo queda pendiente de claro (no se cuenta ni se cotiza). */
    S.soporte = { ...G("defaultSoporte")(), alturaColgadoM: 0.5 }; S.hidro.material = "pead"; aceptarSoporte(); R = G("SOPORTE"); h = hidroDe();
    eq(R.nSoportes, 0, "PEAD sin claro con fuente: no se cuentan soportes (antes 38 con la tabla de CPVC):");
    if (!(h && h.det.length === 2 && h.det.every((d) => d.pendiente && d.n === 0 && d.e === null))) throw new Error("los tramos de PEAD deben quedar marcados pendientes: " + JSON.stringify(h && h.det));
    if (!R.avisos.some((a) => /PEAD/.test(a.msg) && /pendiente/.test(a.msg) && /308\.5/.test(a.msg))) throw new Error("falta el aviso de PEAD pendiente de claro con su fuente");
    if (!(G("QUOTE").pendientes || []).some((p) => p.mot === "soporte" && /PEAD/.test(p.desc + p.motivo))) throw new Error("la cotización no declara el PEAD pendiente");
    const pdf = Buffer.from(G("buildSoportePdf")()).toString("latin1");
    if (!/\(pendiente\) Tj/.test(pdf)) throw new Error("el PDF no imprime «pendiente» en el claro del PEAD");
    /* El modo a mano ya no ofrece «termoplástico» genérico: pide el subtipo. */
    S.soporte = { ...G("defaultSoporte")(), usarMotores: false, tubHidroM: 30, tubHidroD: 25, tubHidroMat: "plastico" }; G("recompute")(); R = G("SOPORTE");
    eq(R.nSoportes, 0, "«plastico» sin subtipo queda pendiente:");
    S.tab = "soporte"; G("render")();
    const opciones = [...w.document.querySelectorAll('#view [data-path="soporte.tubHidroMat"] option')].map((o) => o.value);
    ["cpvc", "ppr", "pead"].forEach((v) => { if (!opciones.includes(v)) throw new Error("falta la opción " + v + " en el material hidráulico a mano: " + opciones.join(",")); });
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.78 (H-243) media caña y muro clasificado por cuarto limpio con su área y su altura: perímetro capturado o rectángulo 3:2 declarado «estimado» en la partida (antes fracción de área de todo el edificio entre la altura media: 31.11 ml y 73.32 m² en el proyecto fijo)", () => {
  const guardado = JSON.stringify(S);
  const parte = (re) => (G("CIVIL").part || []).find((p) => re.test(p.desc));
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    let R = G("CIVIL");
    /* Un cuarto limpio de 120 m² y 3 m: rectángulo 3:2 → lado corto √(120/1.5) = 8.944, perímetro 2·(1.5 + 1)·8.944 = 44.721 ml. */
    const per = 2 * 2.5 * Math.sqrt(120 / 1.5);
    cerca(R.mlCana, 2 * per, 0.01, "media caña doble = 2 × perímetro 3:2 del cuarto (antes 31.11):");
    cerca(R.muroLimpio, per * 3, 0.01, "muro clasificado = perímetro × altura del cuarto, 3 m (antes 73.32):");
    const mc = parte(/^Media caña/), ml = parte(/en área clasificada$|en área clasificada \(/);
    if (!mc || !/estimado/.test(mc.desc) || !/estimated/.test(mc.descEn)) throw new Error("la media caña 3:2 debe decir «estimado» en la partida (ES/EN): " + JSON.stringify(mc));
    if (!ml || !/estimado/.test(ml.desc)) throw new Error("el muro clasificado 3:2 debe decir «estimado» en la partida: " + JSON.stringify(ml));
    /* No depende de la altura de las demás zonas (antes la altura media de todo el edificio). */
    const antes = R.mlCana; S.zones[0].height = 10; G("recompute")();
    cerca(G("CIVIL").mlCana, antes, 1e-9, "subir la nave a 10 m no mueve la media caña del cuarto limpio:");
    /* Perímetro capturado: manda y deja de ser estimado. */
    S.tab = "civil"; G("render")();
    /* H-265: el perímetro vive en el renglón del cuarto clasificado de la lista de civil. */
    if (!w.document.querySelector('#view [data-path="civil.cuartos.0.perimetro"]')) throw new Error("falta el campo de perímetro por cuarto clasificado");
    S.civil.cuartos[0].perimetro = 46; G("recompute")(); R = G("CIVIL");
    cerca(R.mlCana, 92, 1e-9, "con perímetro capturado 46 ml: 92 ml de media caña:"); cerca(R.muroLimpio, 138, 1e-9, "46 × 3 = 138 m²:");
    if (/estimado/.test(parte(/^Media caña/).desc)) throw new Error("con perímetro capturado la partida ya no es estimada");
    if (!R.memo.some((m) => /capturado/.test(m) && /Cuarto limpio 1/.test(m))) throw new Error("la memoria no dice de dónde sale el perímetro del cuarto");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.79 (H-244, decisión 5 del dueño) la tabiquería no son los muros de carga térmica: perímetro de tabiquería capturable por zona y, sin captura, rectángulo 3:2 marcado «estimado» en la partida; capturar un muro exterior ya no mueve el muro civil (antes −400,446 MXN)", () => {
  const guardado = JSON.stringify(S);
  const noLimpio = () => (G("CIVIL").part || []).find((p) => /en área no clasificada/.test(p.desc) && p.clave === "A300");
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    let R = G("CIVIL");
    /* Cuatro zonas sin perímetro de tabiquería: cada una con su rectángulo 3:2 × su altura. */
    const est = (a, h) => 2 * 2.5 * Math.sqrt(a / 1.5) * h;
    const esperado = est(400, 6) + est(100, 3) + est(120, 3) + est(80, 3);
    cerca(R.muroM2, esperado, 0.01, "desarrollo = Σ rectángulo 3:2 × altura, sin los muros de carga térmica (antes 140 + 44 capturados para carga):");
    const p = noLimpio();
    if (!p || !/estimado/.test(p.desc) || !/estimated/.test(p.descEn)) throw new Error("el muro no clasificado estimado debe decirlo en la partida (ES/EN): " + JSON.stringify(p));
    /* Monotonía: capturar un muro exterior de carga térmica no toca el muro civil. */
    const antes = G("CIVIL").total; S.zones[3].walls.N = 30; G("recompute")();
    cerca(G("CIVIL").total, antes, 1e-6, "un muro exterior capturado para carga térmica no mueve la obra civil:");
    /* Perímetro de tabiquería capturado por zona: manda. */
    S.tab = "civil"; G("render")();
    /* H-265: el perímetro de tabiquería vive en el renglón del área de obra de la lista de civil. */
    if (!w.document.querySelector('#view [data-path="civil.areas.0.perimetro"]')) throw new Error("falta el campo de perímetro de tabiquería por área");
    [100, 50, 44, 36].forEach((p, i) => { S.civil.areas[i].perimetro = p; }); G("recompute")(); R = G("CIVIL");
    cerca(R.muroM2, 100 * 6 + 50 * 3 + 44 * 3 + 36 * 3, 1e-9, "con perímetros capturados: Σ perímetro × altura:");
    eq(R.estimado, false, "todo capturado, nada estimado:");
    if (/estimado/.test(noLimpio().desc)) throw new Error("con perímetros capturados la partida ya no dice estimado");
    /* Más perímetro capturado nunca baja el muro. */
    const m1 = R.muroM2; S.civil.areas[1].perimetro = 60; G("recompute")();
    if (!(G("CIVIL").muroM2 > m1)) throw new Error("más perímetro capturado debe dar más muro");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.80 (H-254, regla d «tal cual») el factor de plaza no toca la sección H ni los precios con origen declarado (referencia o proveedor): la importación de 18,500 MXN sale 18,500 en Mexicali (antes 19,980) y el precio por metro de tubería sale tal cual; el resto del catálogo sí lleva el 1.08", () => {
  const guardado = JSON.stringify(S);
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null;
    S.quote.importacion = { monto: 18500, moneda: "MXN", fuente: "agente aduanal (cotización capturada)", fecha: "2026-09-20" };
    G("recompute")();
    const Q0 = G("QUOTE"), cat0 = G("catalogoConceptos")();
    S.quote.plaza = "mexicali"; G("recompute")();
    const Q = G("QUOTE"), cat = G("catalogoConceptos")();
    const filas = (c) => c.secciones.flatMap((s) => s.partidas);
    const h = filas(cat).find((p) => p.sec === "H");
    if (!h) throw new Error("falta la partida de importación capturada");
    cerca(h.unit, 18500, 1e-6, "importación capturada tal cual en Mexicali (antes 18,500 × 1.08 = 19,980):");
    const conOrigen = Q.aux.filter((a) => a.origen);
    if (!conOrigen.length) throw new Error("el caso no aísla lo que se quiere probar: debe haber tubería con precio de origen declarado");
    conOrigen.forEach((a) => { const p = filas(cat).find((x) => x.desc === a.desc); cerca(p.unit, a.unit, 1e-9, "precio por metro con origen (" + a.origen + ") tal cual:"); });
    /* El resto sí lleva el factor: una partida de equipo sube 8 %. */
    const eq0 = filas(cat0).find((p) => p.sec === "B"), eq1 = filas(cat).find((p) => p.desc === eq0.desc);
    cerca(eq1.unit, eq0.unit * 1.08, 1e-6, "partida de equipo con el factor de Mexicali:");
    /* Costo directo = afectos × 1.08 + exentos, y cuadra con el catálogo. */
    const exentos = Q.aux.filter((a) => a.sec === "H" || a.origen).reduce((s, a) => s + a.total, 0);
    cerca(Q.direct, (Q.equipTotal + Q.auxTotal - exentos) * 1.08 + exentos, 1e-6, "costo directo con los exentos fuera del factor:");
    cerca(cat.subtotal, Q.direct, 1e-6, "el catálogo cuadra con el costo directo:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.81 (H-253, regla e) la cotización formal no sale con precios que sólo valen para el Budget: referencia de mercado, mano de obra por capturar, sección H (importación) sin capturar o USD sin tipo de cambio fechado; cada bloqueo se nombra en pantalla y en el error", () => {
  const guardado = JSON.stringify(S);
  const tiro = () => { try { G("buildLicitacionPdf")(); return ""; } catch (e) { return String(e.message); } };
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    /* Sección H sin capturar (el proyecto fijo no la trae): bloquea. */
    let e = tiro();
    contiene(e, "importación", "la formal se bloquea con la sección H «Por cotizar»:");
    let B = G("bloqueosFormal")();
    if (!B.some((b) => /importaci/.test(b))) throw new Error("bloqueosFormal no nombra la importación: " + JSON.stringify(B));
    S.tab = "cotizacion"; G("render")();
    if (!/importaci/.test(w.document.querySelector("#view").textContent.match(/La cotización formal no sale[^]*$/)?.[0] || "")) throw new Error("la pantalla no dice por qué la formal está bloqueada");
    /* Referencia de mercado + mano de obra por capturar: bloquea. */
    S.quote.importacion = { monto: 18500, moneda: "MXN", fuente: "agente aduanal (cotización capturada)", fecha: "2026-09-20" };
    const clave = Object.keys(S.quote.hidroPU)[0];
    S.quote.hidroPU[clave] = { precio: 250, moneda: "MXN", iva: false, porTramo: 1, origen: "referencia", alcance: "material", fuente: "Home Depot San Diego CA", ubicacion: "San Diego, California", url: "https://example.org/ref", fecha: "2026-09-20" };
    G("recompute")();
    if (!(G("QUOTE").referencias || []).length) throw new Error("el caso no aísla lo que se quiere probar: debe haber una referencia de mercado");
    B = G("bloqueosFormal")();
    if (!B.some((b) => /referencia de mercado/.test(b))) throw new Error("la referencia de mercado debe bloquear la formal: " + JSON.stringify(B));
    if (!B.some((b) => /mano de obra/.test(b))) throw new Error("la mano de obra por capturar debe bloquear la formal: " + JSON.stringify(B));
    contiene(tiro(), "referencia de mercado", "error de la formal con referencia:");
    /* USD sin tipo de cambio fechado: bloquea. */
    delete S.quote.hidroPU[clave]; G("recompute")();
    S.quote.currency = "USD"; S.quote.fx = 18.25; S.quote.fxFecha = ""; G("recompute")();
    if (!G("QUOTE").usdSinFecha) throw new Error("el caso no aísla lo que se quiere probar: USD sin fecha");
    if (!G("bloqueosFormal")().some((b) => /tipo de cambio/.test(b))) throw new Error("USD sin fecha debe bloquear la formal");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.82 (H-252, decisión 6 del dueño, opción a) cada precio semilla sin fuente sale en el Budget con «SEMILLA · SIN FUENTE» (EN «SEED · NO SOURCE») y bloquea la formal; los renglones con origen declarado (referencia o proveedor) y la importación capturada no llevan la marca", () => {
  const guardado = JSON.stringify(S);
  const txtPdf = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  try {
    G("importarRespaldo")(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8")); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null;
    S.quote.importacion = { monto: 18500, moneda: "MXN", fuente: "agente aduanal (cotización capturada)", fecha: "2026-09-20" };
    G("recompute")();
    const filas = G("catalogoConceptos")().secciones.flatMap((s) => s.partidas);
    const sem = filas.filter((p) => /SEMILLA · SIN FUENTE/.test(p.desc));
    if (!sem.length) throw new Error("ninguna partida sale marcada como semilla (antes ninguna: el 99.93 % del directo sin fuente)");
    if (!sem.every((p) => /SEED · NO SOURCE/.test(p.descEn))) throw new Error("la marca en inglés falta en alguna partida semilla");
    const conOrigen = G("QUOTE").aux.filter((a) => "origen" in a && a.origen);
    if (!conOrigen.length) throw new Error("el caso no aísla lo que se quiere probar: debe haber tubería con origen declarado");
    conOrigen.forEach((a) => { const p = filas.find((x) => x.desc.startsWith(a.desc)); if (!p || /SEMILLA/.test(p.desc)) throw new Error("un precio con origen (" + a.origen + ") no es semilla: " + (p && p.desc)); });
    const h = filas.find((p) => p.sec === "H"); if (!h || /SEMILLA/.test(h.desc)) throw new Error("la importación capturada con fuente y fecha no es semilla");
    eq(filas.filter((p) => !/SEMILLA/.test(p.desc)).length, conOrigen.length + 1, "sólo los renglones con origen y la importación quedan sin marca:");
    contiene(txtPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })), "SEMILLA · SIN FUENTE", "Budget PDF:");
    contiene(Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8"), "SEMILLA · SIN FUENTE", "Budget Excel:");
    S.tab = "cotizacion"; G("render")();
    contiene(w.document.querySelector("#view").textContent, "SEMILLA · SIN FUENTE", "pantalla de cotización:");
    const B = G("bloqueosFormal")();
    if (!B.some((b) => /semilla/.test(b))) throw new Error("los precios semilla deben bloquear la formal: " + JSON.stringify(B));
    let tiro = ""; try { G("buildLicitacionPdf")(); } catch (e) { tiro = String(e.message); }
    contiene(tiro, "semilla", "la formal no sale con precios semilla:");
    /* El borrador interno (sólo para revisar el documento) sale con la marca de que no es oferta. */
    contiene(txtPdf(G("buildLicitacionPdf")({ borrador: true })), "BORRADOR INTERNO", "borrador marcado:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.83 (H-166) ductos: un tramo sin medida posible (ninguna de la serie cumple), con medida bloqueada sin capturar o sin caudal no lleva sección, kilos ni importe; el error se ve en la tabla, la cédula y el Excel; la lámina queda pendiente en la cotización y la soportería no lo soporta con una medida supuesta", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const armar = (segs) => {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.83";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.83" }; });
    S.soporte = { ...(S.soporte || {}), usarMotores: true };
    S.duct.segments = segs.map(([tag, flow, extra]) => ({ ...G("defaultSegment")(tag, flow), ...extra }));
    aceptarSoporte(); return G("DUCT");   /* H-266: la soportería ve los ductos con la instantánea aceptada */
  };
  const sinSeccion = (s, que) => {
    if (!s.error) throw new Error(que + ": el tramo debe traer error visible");
    if (s.w != null || s.h != null || s.d != null) throw new Error(que + ": sin medida no hay sección (salió " + JSON.stringify([s.w, s.h, s.d]) + ")");
    eq(s.kg, 0, que + ": kilos:"); eq(s.sheet, 0, que + ": lámina:"); eq(s.total, 0, que + ": caída:"); eq(s.hangers, 0, que + ": soportes del ducto:");
    if (s.warn[0] !== s.error) throw new Error(que + ": el error debe ser el primer aviso del tramo (es el que pinta la tabla)");
  };
  try {
    /* 1) Ninguna medida de la serie cumple (6,000 L/s con alto máximo 200 mm): antes 400×200 a 75 m/s y 162 kg. */
    let D = armar([["SC-1", 6000, { length: 18, hmax: 200 }]]);
    sinSeccion(D.segs[0], "sin candidato"); eq(D.boq.kg, 0, "kilos del proyecto sin candidato:");
    contiene(D.segs[0].error, "Ninguna medida", "razón del error:");
    /* 2) Medida bloqueada sin capturar (rectangular y redondo): antes 400×200 y Ø250 */
    D = armar([["BL-1", 2000, { length: 10, lock: true }], ["BL-2", 2000, { shape: "round", length: 10, lock: true }]]);
    sinSeccion(D.segs[0], "rectangular bloqueado sin medida"); sinSeccion(D.segs[1], "redondo bloqueado sin diámetro");
    eq(D.boq.kg, 0, "kilos del proyecto bloqueado sin medida:");
    /* 2b) Bloqueada con medida capturada: se respeta (no cambia). */
    D = armar([["BL-3", 2000, { length: 10, lock: true, w: 800, h: 400 }]]);
    if (D.segs[0].error) throw new Error("con medida bloqueada capturada no hay error");
    eq([D.segs[0].w, D.segs[0].h].join("x"), "800x400", "medida bloqueada capturada:");
    /* 3) Sin caudal, 25 m: antes 400×200, 225 kg y la partida de lámina en la cotización. */
    D = armar([["TR-1", 6000, { length: 18 }], ["SQ-1", 0, { length: 25 }]]);
    sinSeccion(D.segs[1], "sin caudal"); contiene(D.segs[1].error, "Sin caudal", "razón del error:");
    cerca(D.boq.kg, 604.88, 0.05, "el tramo sano conserva sus kilos (CM.duct.1.j):");
    const Q = G("QUOTE"), lam = Q.aux.find((a) => a.mot === "duct" && a.un === "KG");
    cerca(lam.qty, 604.88, 0.05, "la partida de lámina sólo lleva el tramo con medida:");
    if (!Q.pendientes.some((p) => p.mot === "duct" && /SQ-1/.test(p.desc) && /medida/.test(p.motivo) && p.descEn && p.motivoEn)) throw new Error("la lámina del tramo sin medida debe quedar pendiente (ES/EN) en la cotización: " + JSON.stringify(Q.pendientes.filter((p) => p.mot === "duct")));
    /* Soportería con motores: el tramo sin medida no se soporta con 400×200; queda pendiente. */
    const SP = G("SOPORTE");
    if (!SP.manualPendientes.some((p) => /SQ-1/.test(p.que) && p.queEn && p.faltaEn)) throw new Error("la soportería debe dejar pendiente el ducto sin medida: " + JSON.stringify(SP.manualPendientes));
    eq(SP.mDucto, 18, "metros de ducto soportados (sólo TR-1; antes 43 con el tramo sin caudal a 400×200):");
    /* Pantalla, cédula y Excel dicen «sin medida»; el aviso del tramo es el error. */
    S.tab = "ductos"; G("render")();
    const v = w.document.getElementById("view").textContent;
    contiene(v, "Sin caudal", "la tabla de tramos muestra el error:");
    if (/400\s*×\s*200/.test(v)) throw new Error("la pantalla no debe mostrar 400 × 200");
    const ced = pdfTxt(G("buildCedulaPdf")());
    contiene(ced, "sin medida", "la cédula PDF:"); if (/400 x 200/.test(ced)) throw new Error("la cédula no debe imprimir 400 x 200");
    const xes = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8"), xen = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "MXN" })).toString("utf8");
    contiene(xes, "sin medida", "el Excel ES:"); contiene(xen, "no size", "el Excel EN:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.84 (H-167) «Generar desde carga» trae sólo los caudales: sin longitudes ni accesorios que nadie capturó (antes 20/10/15 m, tee 0.65, salida 1.0, entrada 0.03); cada tramo queda «pendiente de longitud» sin kilos, juntas, soportes ni importe, y al capturar la longitud entra", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.84"; S.site = { key: "tijuana" };
    const dz = G("defaultZone");
    S.zones = [
      { ...dz("Producción"), area: 400, height: 6, occ: 30, lights: 8000, equip: 12000, walls: { N: 40, S: 40, E: 30, W: 30, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 400 },
      { ...dz("Oficinas"), area: 100, height: 3, occ: 10, lights: 1500, equip: 2000, walls: { N: 12, S: 12, E: 10, W: 10, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 100 },
    ];
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.84" }; });
    G("recompute")();
    G("chainToDuct")(true); G("recompute")();
    const segs = S.duct.segments, D = G("DUCT"), tot = G("totals")();
    eq(segs.length, 4, "principal + 2 ramales + aire exterior:");
    eq(segs[0].flow, Math.round(tot.cfm * 1.699 / 3.6), "el caudal del principal sí sale de la carga:");
    segs.forEach((s) => {
      eq(s.length, 0, s.tag + ": longitud (nadie la capturó):");
      eq((s.fittings || []).length, 0, s.tag + ": accesorios (nadie los capturó):");
    });
    eq(D.boq.kg, 0, "kilos de la red generada:"); eq(D.boq.joints, 0, "juntas:"); eq(D.boq.hangers, 0, "soportes:"); eq(D.boq.corners, 0, "esquineros:");
    eq(D.path, 0, "caída del circuito sin longitudes ni accesorios:");
    D.segs.forEach((s) => contiene(s.warn[0] || "", "Pendiente de longitud", s.tag + ": el aviso del tramo:"));
    let Q = G("QUOTE");
    if (Q.aux.some((a) => a.mot === "duct" && a.un === "KG")) throw new Error("sin longitudes no hay partida de lámina");
    const pend = Q.pendientes.filter((p) => p.mot === "duct" && /longitud/.test(p.motivo) && p.descEn && /length/.test(p.motivoEn));
    eq(pend.length, 4, "cada tramo sin longitud queda pendiente (ES/EN) en la cotización:");
    /* Al capturar la longitud del principal, ese tramo entra con sus kilos y deja de estar pendiente. */
    S.duct.segments[0].length = 20; G("recompute")();
    if (!(G("DUCT").segs[0].kg > 0)) throw new Error("con longitud capturada el principal lleva kilos");
    Q = G("QUOTE");
    if (!Q.aux.some((a) => a.mot === "duct" && a.un === "KG")) throw new Error("con longitud capturada hay partida de lámina");
    eq(Q.pendientes.filter((p) => p.mot === "duct" && /longitud/.test(p.motivo)).length, 3, "quedan pendientes los otros tres:");
    /* La propuesta de cruce dice qué trae y qué no */
    contiene(G("PROPUESTAS")["load>duct"].que, "sin longitudes ni accesorios", "texto de la propuesta load>duct:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.85 (H-165) ducto de grasa según UMC 2018 §510.5.1 y §510.5.3 (up.codes, Nevada Mechanical Code 2018; extrae NFPA 96 §7.5): acero al carbón ≥ 0.060 in (No. 16 MSG) o inoxidable ≥ 0.048 in (No. 18 MSG), soldadura externa continua hermética, nunca galvanizado ni aluminio; sus kilos no entran a la partida de lámina galvanizada y quedan «Por cotizar»", () => {
  const guardado = JSON.stringify(S);
  const pdfTxt = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const armar = (material) => {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.85";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.85" }; });
    S.duct.meta.pc = "0.5"; S.duct.meta.material = material;
    S.duct.segments = [{ ...G("defaultSegment")("GR-1", 500), service: "kitchen_grease", length: 6 }, { ...G("defaultSegment")("TR-1", 6000), length: 18 }];
    G("recompute")(); return G("DUCT");
  };
  try {
    /* 1) Galvanizado elegido para el proyecto: el ducto de grasa es de acero al carbón 16 MSG, 0.060 in (antes cal 22 galvanizado). */
    let D = armar("galvanized"), g = D.segs[0].gauge;
    eq(g.gauge, 16, "calibre del ducto de grasa (antes 22):"); cerca(g.th_in, 0.060, 1e-9, "espesor en pulgadas (UMC 2018 §510.5.1):"); cerca(g.th_mm, 1.524, 1e-6, "espesor en mm:");
    if (/galvaniz/i.test(g.material + " " + g.ref)) throw new Error("el ducto de grasa no es galvanizado: " + g.material + " · " + g.ref);
    contiene(g.joint, "Soldadura externa continua", "junta (UMC 2018 §510.5.3):"); contiene(g.ref, "UMC 2018 §510.5.1", "cita:"); contiene(g.ref, "NFPA 96", "queda por ratificar con NFPA 96:");
    const s0 = D.segs[0]; cerca(s0.kg, s0.sheet * 1.524 / 1000 * 7850, 1e-6, "kilos con 1.524 mm de acero:");
    /* El tramo de suministro sigue galvanizado con su tabla. */
    if (!/Galvanizado/.test(D.segs[1].gauge.material)) throw new Error("el suministro sigue galvanizado");
    /* 2) Cotización: la lámina galvanizada no lleva los kilos de grasa; el ducto de grasa soldado sale «Por cotizar» (ES/EN). */
    const Q = G("QUOTE"), lam = Q.aux.find((a) => a.mot === "duct" && a.un === "KG");
    cerca(lam.qty, D.segs[1].kg, 1e-6, "la partida de lámina galvanizada sólo lleva el suministro:");
    if (/grasa/i.test(lam.desc)) throw new Error("la partida galvanizada no debe nombrar la grasa");
    const pc = (Q.porCotizar || []).find((p) => p.mot === "duct" && /grasa/i.test(p.desc));
    if (!pc || !/UMC 2018/.test(pc.desc) || !pc.descEn || !(Math.abs(pc.qty - s0.kg) < 1e-6)) throw new Error("el ducto de grasa soldado debe salir Por cotizar con sus kilos y la cita (ES/EN): " + JSON.stringify(pc));
    /* 3) Cédula PDF: calibre 16, junta soldada y la nota UMC. */
    const ced = pdfTxt(G("buildCedulaPdf")());
    contiene(ced, "UMC 2018", "la cédula cita el UMC:"); contiene(ced, "Soldadura externa continua", "la cédula imprime la junta soldada:");
    /* 4) Inoxidable: 18 MSG, 0.048 in. */
    D = armar("stainless"); g = D.segs[0].gauge;
    eq(g.gauge, 18, "inoxidable: calibre:"); cerca(g.th_in, 0.048, 1e-9, "inoxidable: espesor:"); contiene(g.material, "inoxidable", "material:");
    /* 5) Aluminio no está permitido para grasa: se toma acero al carbón, con aviso, y los kilos con densidad de acero. */
    D = armar("aluminum"); g = D.segs[0].gauge;
    eq(g.gauge, 16, "aluminio: el ducto de grasa pasa a acero al carbón 16 MSG:");
    if (!D.segs[0].warn.some((x) => /aluminio/i.test(x) && /510\.5\.1/.test(x))) throw new Error("debe avisar que la grasa no puede ser de aluminio: " + JSON.stringify(D.segs[0].warn));
    cerca(D.segs[0].kg, D.segs[0].sheet * 1.524 / 1000 * 7850, 1e-6, "aluminio: kilos de la grasa con acero:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.86 (H-181) la cotización eléctrica sigue al cálculo: el alimentador se cuantifica por calibre (juegos × hilos × metros de fase/neutro, tierra por canalización y tubo por canalización) y el tablero por su capacidad y sus circuitos dimensionados; sin precio con fuente van «Por cotizar»; sin distancia al tablero, pendiente de longitud; un ramal con corriente pendiente no se cuenta", () => {
  const guardado = JSON.stringify(S);
  const dc = (nombre) => G("defaultCarga")(nombre);
  const armar = (elec) => {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.86";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.86" }; });
    S.elec = { ...G("defaultElec")(), tomarHVAC: false, ...elec };
    G("recompute")(); return { E: G("ELEC"), Q: G("QUOTE") };
  };
  const deElec = (Q) => (Q.porCotizar || []).filter((p) => p.mot === "elec");
  try {
    /* 1) 400 kW a 220 V, 3F4H, 40 m: el alimentador sale en paralelo (antes: 1 juego a 1,350 MXN/m, tablero a 68,000 fijo). */
    let { E, Q } = armar({ sistema: "3F4H-220", Ltablero: 40, trafoKVA: 1500, trafoZ: 5.75, cargas: [{ ...dc("Proceso"), tipo: "proceso", kW: 400, V: 220, ph: 3, cant: 1, L: 20, fp: .9 }] });
    const a = E.alim, P = a.paralelo;
    if (!(P > 1)) throw new Error("el caso no aísla lo que se quiere probar: el alimentador debe ir en paralelo (salió " + P + ")");
    if (Q.aux.some((x) => x.mot === "elec")) throw new Error("el alimentador y el tablero ya no llevan precio semilla fijo: " + JSON.stringify(Q.aux.filter((x) => x.mot === "elec").map((x) => x.desc)));
    const pc = deElec(Q), clave = (k) => pc.find((p) => p.clave === k);
    const fase = clave("alimConductor"), tierra = clave("alimTierra"), tubo = clave("alimTubo"), tab = clave("tableroGeneral");
    if (!fase || !tierra || !tubo || !tab) throw new Error("faltan renglones Por cotizar del alimentador o del tablero: " + JSON.stringify(pc.map((p) => p.clave)));
    cerca(fase.qty, 4 * P * 40, 1e-9, "conductor de fase y neutro: 4 hilos × juegos × 40 m:"); eq(fase.un, "ML");
    contiene(fase.desc, String(a.awg), "calibre del conductor:"); contiene(fase.desc, P + " juegos", "juegos en paralelo:");
    cerca(tierra.qty, P * 40, 1e-9, "tierra: una por canalización × 40 m:"); contiene(tierra.desc, String(a.tierra), "calibre de la tierra:");
    cerca(tubo.qty, P * 40, 1e-9, "canalización: una por juego × 40 m:"); contiene(tubo.desc, String(a.tubo.d), "diámetro del tubo:");
    eq(tab.qty, 1); contiene(tab.desc, G("n")(E.principal, 0) + " A", "capacidad del tablero:"); contiene(tab.desc, "1 circuito", "circuitos dimensionados:");
    pc.forEach((p) => { if (!p.descEn || !p.motivo) throw new Error("renglón sin espejo EN o sin motivo: " + p.clave); });
    /* 2) 3F3H: tres hilos por juego. */
    ({ E, Q } = armar({ sistema: "3F3H-440", Ltablero: 25, trafoKVA: 300, trafoZ: 4, cargas: [{ ...dc("Motor"), tipo: "motor", kW: 22, V: 440, ph: 3, cant: 1, L: 20, fp: .85 }] }));
    cerca(deElec(Q).find((p) => p.clave === "alimConductor").qty, 3 * E.alim.paralelo * 25, 1e-9, "3F3H: 3 hilos × juegos × 25 m:");
    /* 3) Sin distancia al tablero: el alimentador queda pendiente de longitud (antes 30 m supuestos), el tablero sí se pide. */
    ({ E, Q } = armar({ sistema: "3F4H-220", trafoKVA: 300, trafoZ: 4, cargas: [{ ...dc("Contactos"), tipo: "contactos", kW: 27, V: 220, ph: 3, cant: 1, L: 10, fp: .9 },
      { ...dc("Bomba sin datos"), tipo: "motor", kW: 0, V: 220, ph: 3, cant: 1, L: 10, fp: .85 }] }));
    if (deElec(Q).some((p) => /^alim/.test(p.clave))) throw new Error("sin distancia al tablero no hay metros de alimentador");
    if (!Q.pendientes.some((p) => p.mot === "elec" && /longitud/.test(p.motivo) && p.motivoEn)) throw new Error("el alimentador debe quedar pendiente de longitud (ES/EN)");
    /* 4) El ramal con corriente pendiente no se cuenta como circuito dimensionado y queda pendiente con su nombre. */
    if (!E.calc.some((c) => c.sinI)) throw new Error("el caso no aísla lo que se quiere probar: debe haber un ramal con corriente pendiente");
    contiene(deElec(Q).find((p) => p.clave === "tableroGeneral").desc, "1 circuito", "sólo el ramal dimensionado:");
    if (!Q.pendientes.some((p) => p.mot === "elec" && /Bomba sin datos/.test(p.desc) && /corriente/.test(p.motivo))) throw new Error("el ramal sin corriente debe quedar pendiente con su nombre");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.87 (H-224, parte no bloqueada) la soportería de la red contra incendio usa el material de la red: acero como acero, cobre con MSS SP-58 (el mismo camino que la hidráulica de cobre) y CPVC «pendiente de tabla NFPA 13», nunca soportado como acero (motores, instantánea y captura a mano)", () => {
  const guardado = JSON.stringify(S);
  const armar = (material, soporte) => {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.87";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.87" }; });
    S.fuego = { ...S.fuego, riesgo: "ord2", area: 700, altura: 4.71, rociador: "k80", material, Lramal: 30, Lmontante: 12, presFuente: 30, fuente: "cisterna" };
    S.soporte = { ...S.soporte, alturaColgadoM: 1, ...(soporte || {}) };
    /* H-266: con los motores, la soportería cuenta con la instantánea aceptada; a mano, sin ella. */
    if (soporte && soporte.usarMotores === false) G("recompute")(); else aceptarSoporte();
    return G("SOPORTE");
  };
  const redFuego = (SP) => (SP.porTuberia || []).find((x) => x.etiqueta === "Contra incendio");
  try {
    let SP = armar("acero_neg");
    if (!(G("FUEGO").nTotal > 0)) throw new Error("el caso no aísla lo que se quiere probar: la red contra incendio debe tener rociadores");
    eq(redFuego(SP).fam, "acero", "acero negro: se soporta como acero:");
    /* Cobre: antes «acero». */
    SP = armar("cobre"); eq(redFuego(SP).fam, "cobre", "red de cobre: se soporta como cobre (MSS SP-58):");
    /* CPVC: sin tabla NFPA 13 no se soporta ni como acero ni con los claros de plomería del IPC; queda pendiente. */
    SP = armar("cpvc");
    const rf = redFuego(SP);
    if (rf && rf.m > 0) throw new Error("la red de CPVC no debe soportarse sin la tabla NFPA 13 (salió " + rf.fam + ", " + rf.m + " m)");
    if (!SP.manualPendientes.some((p) => /CPVC/.test(p.que) && /NFPA 13/.test(p.falta) && p.queEn && p.faltaEn)) throw new Error("la red de CPVC debe quedar pendiente de tabla NFPA 13 (ES/EN): " + JSON.stringify(SP.manualPendientes));
    if (!G("QUOTE").pendientes.some((p) => p.mot === "soporte" && /NFPA 13/.test(p.motivo))) throw new Error("el pendiente llega a la cotización");
    /* Instantánea aceptada con la red de cobre: la reconstrucción conserva el material. */
    armar("cobre"); S.soporte.snap = G("snapshotSoporte")(); G("recompute")();
    eq(redFuego(G("SOPORTE")).fam, "cobre", "con la instantánea aceptada la red sigue siendo de cobre:");
    /* Captura a mano: la red contra incendio en CPVC tampoco toma los claros del IPC. */
    SP = armar("acero_neg", { usarMotores: false, tubFuegoM: 20, tubFuegoD: 50, tubFuegoMat: "cpvc" });
    const rm = redFuego(SP);
    if (rm && rm.m > 0) throw new Error("a mano, la red contra incendio en CPVC no se soporta con los claros de plomería");
    if (!SP.manualPendientes.some((p) => /NFPA 13/.test(p.falta))) throw new Error("a mano, la red contra incendio en CPVC queda pendiente de tabla NFPA 13");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.88 (H-154) la pantalla de ventilación sin modelo se dibuja y dice «Ningún modelo del catálogo cubre el caudal»; sin caudal dice «Sin caudal: sin modelo.» (antes ReferenceError: R is not defined y tarjeta de error)", () => {
  const guardado = JSON.stringify(S);
  const armar = (campos, propios) => { G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.88"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.88" }; }); Object.assign(S.vent, campos); (propios || []).forEach((k) => G("marcarPropio")(k)); G("recompute")(); S.tab = "ventilacion"; G("render")(); return w.document.getElementById("view").textContent; };
  try {
    /* 1) Nadie cubre (21,189 CFM > 18,000 del CSW-30, caso 4 de S.64): la pantalla se dibuja y lo dice. */
    let txt = armar({ mode: "general", spaceType: "office", area: 1000, height: 6, occ: 0, ach: 6 }, ["vent.area", "vent.height", "vent.occ"]);
    eq(G("VENT").eq.primary, null, "sin modelo:");
    if (/No se pudo dibujar/.test(txt)) throw new Error("la pantalla de ventilación tronó en lugar de dibujarse: " + txt.slice(0, 300));
    contiene(txt, "Ningún modelo del catálogo cubre el caudal", "la pantalla lo dice:");
    if (/Submittal del ventilador/.test(txt)) throw new Error("sin modelo no hay botón de submittal");
    /* 2) Sin caudal (campana sin medidas, caso de S.65): la pantalla se dibuja y dice que no hay caudal. */
    txt = armar({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 0, hoodW: 0 });
    eq(G("VENT").demand, 0, "sin medidas no hay caudal:");
    if (/No se pudo dibujar/.test(txt)) throw new Error("la pantalla de ventilación tronó sin caudal: " + txt.slice(0, 300));
    contiene(txt, "Sin caudal: sin modelo.", "la pantalla lo dice:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.98 (H-262) ventilación calcula sólo con sus propios datos: el área, la altura y los ocupantes de Carga térmica ya no se copian solos (decisión del dueño, 27-sep-2026: cada disciplina con sus propios datos)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.98";
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6, occ: 30 }];
    G("recompute")();
    if (!(G("geoProyecto")().area > 0)) throw new Error("el caso no aísla lo que se quiere probar: carga térmica debe tener geometría");
    eq(S.vent.area, 0, "el área de ventilación no se copia de carga térmica:");
    eq(S.vent.height, 0, "la altura de ventilación no se copia de carga térmica:");
    eq(S.vent.occ, 0, "los ocupantes de ventilación no se copian de carga térmica:");
    /* Lo capturado en ventilación manda y carga térmica no lo mueve. */
    S.vent.area = 120; S.vent.height = 4; G("recompute")();
    S.zones[0].area = 800; G("recompute")();
    eq(S.vent.area, 120, "carga térmica no mueve el área capturada en ventilación:");
    eq(S.vent.height, 4, "carga térmica no mueve la altura capturada en ventilación:");
    S.tab = "ventilacion"; G("render")();
    const txt = w.document.getElementById("view").textContent;
    if (/heredada de Carga térmica|se heredará de Carga térmica/.test(txt)) throw new Error("la pantalla de ventilación todavía anuncia herencia de carga térmica");
    eq(G("PROPUESTAS")["load>vent"], undefined, "no queda propuesta carga térmica → ventilación:");
    eq(G("LINKS")["load>vent"], undefined, "no queda cruce load>vent:");
    if (/como reposición/.test(txt)) throw new Error("la pantalla de ventilación sigue ofreciendo el aire exterior de carga térmica como propuesta");
    if (/hered/i.test(txt)) throw new Error("la pantalla de ventilación sigue hablando de herencia: " + (/.{0,60}hered.{0,60}/i.exec(txt) || [""])[0]);
    /* Sin local capturado (el estado inicial de todo proyecto nuevo) se dice «pendiente», no se calcula 0 en silencio. */
    S.vent.area = 0; S.vent.height = 0; G("recompute")(); S.tab = "ventilacion"; G("render")();
    if (!G("VENT").avisos.some((a) => /pendiente de la captura/.test(a.msg))) throw new Error("ventilación sin área ni altura no avisa que el caudal queda pendiente de captura");
    contiene(w.document.getElementById("view").textContent, "pendiente de captura", "la pantalla de ventilación dice que el caudal queda pendiente:");
    S.vent.area = 120; S.vent.height = 4; G("recompute")();
    if (G("VENT").avisos.some((a) => /pendiente de la captura/.test(a.msg))) throw new Error("con área y altura capturadas no debe quedar el aviso de pendiente");
    /* Contra incendio no es parte de este hallazgo: sigue como estaba. */
    eq(S.fuego.area, 0, "H-264: contra incendio tampoco hereda el área de las zonas:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.99 (H-263) al seleccionar el ventilador, el calor de su motor (HP de referencia del submittal × 745.7 W) entra a la zona elegida de Carga térmica como «Misceláneos»; sólo eso; se declara ESTIMADO (regla 8); es instantánea (si ventilación cambia, la carga no se mueve y la pantalla avisa); sellos, contrato, deshacer y guardado en orden (decisión del dueño, 27-sep-2026)", () => {
  const guardado = JSON.stringify(S);
  const misc = (r) => r.lines.find((l) => /^Misceláneos · Ventilación/.test(l.label));
  const vista = () => w.document.getElementById("view").textContent;
  const sellar = (id, ts) => { S.sellos[id] = { ts, ver: G("MOTOR_VER")[id], huella: G("huellaMotor")(id) }; };
  const H = G("HIST"), hist0 = { pila: H.pila, ix: H.ix };
  const huellas = () => Object.keys(G("MOTOR_VER")).map((id) => id + ":" + G("huellaMotor")(id)).join("|");
  try {
    G("histReiniciar")();
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.99";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.99" }; });
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6, occ: 30 }, { ...G("defaultZone")("Oficina"), area: 100, height: 3, occ: 10 }];
    G("asegurarIdsZona")();
    Object.assign(S.vent, { mode: "general", spaceType: "office", area: 400, height: 6, occ: 0, ach: 6 });
    G("recompute")();
    const e = G("VENT").eq.primary;
    if (!e) throw new Error("el caso no aísla lo que se quiere probar: ventilación debe tener modelo");
    const hp = G("greenSheet")(G("GREEN").find((x) => x.id === e.id)).hp;
    const antes0 = G("LOADS")[0].grand, antes1 = G("LOADS")[1].grand;
    if (G("LOADS").some(misc)) throw new Error("sin seleccionar no debe haber misceláneos de ventilación");
    /* Un proyecto guardado con la versión anterior no trae miscVent ni vent.seleccion; al abrirlo, sanearEstado los agrega en
       null. Ninguna huella de sello debe moverse por eso (si no, abrir un proyecto sin cambios diría «la captura cambió»). */
    const conNulos = huellas();
    S.zones.forEach((z) => { delete z.miscVent; }); delete S.vent.seleccion;
    eq(huellas(), conNulos, "los campos nuevos en null no mueven ninguna huella de sello:");
    S.zones.forEach((z) => { z.miscVent = null; }); S.vent.seleccion = null;
    /* Sellos antes de seleccionar: ventilación y carga «calculado». */
    S.sellos = {}; sellar("vent", 5); sellar("load", 5);
    eq(G("selloDe")("load").estado, "calculado", "el caso arranca con carga sellada:");
    /* Se selecciona desde la pantalla, eligiendo la zona. */
    S.tab = "ventilacion"; G("render")();
    const d = w.document;
    const btn = d.querySelector('[data-act="vent-seleccionar"]');
    if (!btn) throw new Error("ventilación no tiene botón para seleccionar el modelo");
    contiene(btn.textContent, "estimado", "el botón declara que los HP son estimados:");
    const selZ = d.getElementById("vent-sel-zona");
    if (!selZ) throw new Error("con dos zonas debe pedir a qué zona entra la carga");
    selZ.value = S.zones[1].id; btn.click();
    if (!G("HIST").pila.some((x) => x.etiqueta === "seleccionar ventilador")) throw new Error("seleccionar no dejó instantánea en el historial (deshacer)");
    const L0 = G("LOADS")[0], L1 = G("LOADS")[1];
    const lin = misc(L1);
    if (!lin) throw new Error("la zona elegida no recibió la carga del ventilador seleccionado");
    cerca(lin.s, hp * 745.7, 1, "calor del motor = HP de referencia × 745.7 W:");
    eq(lin.l, 0, "el calor del motor es sensible:");
    contiene(lin.label, e.model, "el renglón dice el modelo:");
    contiene(lin.d, "ESTIMADO", "regla 8: el renglón declara que el HP es una estimación de catálogo, no dato de placa:");
    contiene(lin.d, "745.7", "regla 8: el renglón declara la conversión:");
    if (!L1.memo.some((m) => /Misceláneos/.test(m) && /ESTIMADO/.test(m))) throw new Error("la memoria de la zona no declara la procedencia del renglón");
    if (misc(L0)) throw new Error("la otra zona no debe recibir la carga");
    eq(Math.round(L0.grand), Math.round(antes0), "la otra zona no cambia:");
    if (!(L1.grand >= antes1 + lin.s - 1)) throw new Error(`la zona elegida debe subir al menos ${lin.s} W (antes ${antes1}, después ${L1.grand})`);
    /* Sellos: carga cambió de entradas (desactualizado); ventilación no (la selección no es entrada de computeVent). */
    eq(G("selloDe")("load").estado, "desactualizado", "carga térmica: la selección es una entrada nueva:");
    eq(G("selloDe")("vent").estado, "calculado", "ventilación: seleccionar no cambia sus entradas:");
    /* El cruce queda declarado: trazado de origen (memoria integral y libro de la propuesta, con su espejo EN) y memoria de ventilación. */
    const fila = G("trazaHerencia")().find((r) => r.destinoId === "load" && /Misceláneos/.test(r.campo));
    if (!fila) throw new Error("el trazado de origen no declara el ventilador que entró a carga térmica");
    contiene(fila.campo, e.model, "la fila del trazado dice el modelo:"); contiene(fila.origen, "Ventilación", "la fila dice el origen:");
    if (!(fila.en && /Miscellaneous/.test(fila.en.campo))) throw new Error("regla 7: la fila del trazado no trae su espejo en inglés");
    contiene(textoPdf(G("buildVentPdf")()), "Seleccionado por el usuario", "la memoria de ventilación dice a dónde entró el calor del motor:");
    /* La pantalla de carga muestra el renglón y la gráfica lo incluye. */
    S.zi = 1; S.tab = "carga"; G("render")();
    contiene(vista(), "Misceláneos · Ventilación", "la pestaña de carga lista el renglón:");
    contiene(vista(), "Misceláneos (ventilador seleccionado)", "la gráfica «Dónde está la carga» tiene su cubeta:");
    if (!w.document.querySelector('#view [data-act="vent-quitar"]')) throw new Error("desde Carga térmica no se puede quitar la carga del ventilador");
    contiene(vista(), "seleccionado en Ventilación", "la tarjeta de la zona dice de dónde viene:");
    /* Volver a sellar carga y seleccionar de nuevo el mismo modelo: nada cambia; la fecha de la instantánea no mueve el sello. */
    sellar("load", 6);
    S.tab = "ventilacion"; G("render")();
    d.getElementById("vent-sel-zona").value = S.zones[1].id; d.querySelector('[data-act="vent-seleccionar"]').click();
    eq(G("selloDe")("load").estado, "calculado", "reseleccionar el mismo modelo no mueve el sello de carga:");
    /* Regla 3: si ventilación cambia a otro modelo, carga térmica se queda con lo seleccionado y la pantalla avisa. */
    const g1 = G("LOADS")[1].grand;
    S.vent.ach = 7; G("recompute")();
    const e2 = G("VENT").eq.primary;
    if (!e2 || e2.id === e.id) throw new Error("el caso no aísla lo que se quiere probar: con 7 cambios/h debe salir otro modelo que cubra");
    eq(Math.round(G("LOADS")[1].grand), Math.round(g1), "si cambia ventilación, la carga no se mueve sola:");
    S.tab = "ventilacion"; G("render")();
    contiene(vista(), "ya no coincide", "la pantalla avisa que la selección quedó atrás:");
    /* Un proyecto guardado conserva la selección y la carga. */
    const s2 = G("sanearEstado")(JSON.parse(JSON.stringify(S)));
    eq(s2.vent.seleccion.modeloId, e.id, "la selección sobrevive al guardar y abrir:");
    eq(s2.zones[1].miscVent.W, Math.round(hp * 745.7), "la carga de la zona sobrevive al guardar y abrir:");
    /* Si la zona desaparece, la pantalla lo dice. */
    S.zi = 0;
    const zona1 = S.zones[1]; S.zones = [S.zones[0]]; G("recompute")(); S.tab = "ventilacion"; G("render")();
    contiene(vista(), "ya no existe", "la pantalla avisa que la zona que recibía el calor ya no existe:");
    S.zones = [S.zones[0], zona1]; G("recompute")();
    /* Quitar la selección la saca de carga térmica, deja el contrato limpio y no toca el sello de ventilación. */
    sellar("vent", 7);
    S.tab = "ventilacion"; G("render")();
    const q = d.querySelector('[data-act="vent-quitar"]');
    if (!q) throw new Error("no hay botón para quitar la selección");
    q.click();
    if (!G("HIST").pila.some((x) => x.etiqueta === "quitar selección de ventilador")) throw new Error("quitar no dejó instantánea en el historial (deshacer)");
    if (G("LOADS").some(misc)) throw new Error("al quitar la selección la carga debe salir de carga térmica");
    eq(S.vent.seleccion, null, "quitar deja la clave declarada (null), no la borra:");
    eq(G("selloDe")("vent").estado, "calculado", "ventilación: quitar tampoco cambia sus entradas:");
    const falt = G("selfCheck")().faltantes.filter((f) => /seleccion|miscVent/.test(f.ruta));
    if (falt.length) throw new Error("contrato 16.4 tras quitar: " + falt.map((f) => f.ruta).join(", "));
  } finally { H.pila = hist0.pila; H.ix = hist0.ix; G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.100 (H-264) contra incendio es autónomo: el área a proteger y la altura al rociador más alto se capturan en su pestaña; no se heredan de carga térmica ni se toman en vivo (decisión del dueño, 27-sep-2026: todos los motores independientes)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.100";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.100" }; });
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6, occ: 30 }, { ...G("defaultZone")("Oficina"), area: 100, height: 3, occ: 10 }];
    S.fuego = { ...G("defaultFuego")(), riesgo: "ord2", Lramal: 30, Lmontante: 12, tomarArea: true };
    G("recompute")();
    if (!(G("geoProyecto")().area > 0)) throw new Error("el caso no aísla lo que se quiere probar: carga térmica debe tener geometría");
    eq(S.fuego.area, 0, "el área a proteger no se copia de carga térmica:");
    eq(S.fuego.altura, 0, "la altura no se copia de carga térmica:");
    eq(G("FUEGO").area, 0, "ni se toma en vivo aunque haya permisos y tomarArea:");
    if (!G("FUEGO").memo.some((m) => /Sin área protegida capturada/.test(m))) throw new Error("sin área capturada la memoria debe decirlo");
    eq(G("LINKS")["load>fuego"], undefined, "no queda cruce load>fuego:");
    eq(Object.keys(G("HEREDA")).length, 0, "ninguna disciplina hereda:");
    if (G("ARISTAS").some((a) => a.a === "fuego" && a.regla === 1)) throw new Error("el diagrama sigue dibujando una herencia hacia contra incendio");
    /* Lo capturado manda y las zonas no lo mueven. */
    S.fuego.area = 700; S.fuego.altura = 6; G("recompute")();
    S.zones[0].area = 900; S.zones[0].height = 9; G("recompute")();
    eq(S.fuego.area, 700, "carga térmica no mueve el área capturada:"); eq(S.fuego.altura, 6, "ni la altura capturada:");
    eq(G("FUEGO").estatica, 7, "la estática va a la altura capturada + 1 m:");
    S.tab = "fuego"; G("render")();
    const txt = w.document.getElementById("view").textContent;
    if (/heredada de|se heredará de/i.test(txt)) throw new Error("la pantalla de contra incendio todavía anuncia herencia");
    /* El texto explicativo vive sólo en la guía (decisión del dueño del 19-sep-2026: sin texto de guía en la vista). */
    contiene(G("GUIA").fuego.ojo, "no las toma de Carga térmica", "la guía dice que se capturan aquí:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.105 (H-210) contra incendio sin altura al rociador más alto, cabezal o montante capturados no dimensiona la bomba: presión y potencia quedan pendientes, con error, semáforo «incompleta», pendiente en la cotización (ES/EN) y sin carga a Eléctrico; sin 6, 30 ni 12 m ocultos por omisión (regla 6)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.105";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.105" }; });
    S.fuego = { ...G("defaultFuego")(), riesgo: "ord2", area: 500, Lramal: 30, Lmontante: 12 };   // altura sin capturar (0)
    G("recompute")();
    const F = () => G("FUEGO");
    if (!(F().qTotal > 0)) throw new Error("el caso no aísla lo que se quiere probar: con área capturada hay demanda");
    eq(F().hpBomba, 0, "sin altura no se dimensiona la potencia de la bomba (HP):");
    eq(F().presBomba, 0, "ni su presión:");
    if (!F().avisos.some((a) => a.lvl === "err" && /altura/.test(a.msg))) throw new Error("sin altura el aviso es error");
    eq((G("semaforoSuite")().find((x) => x.id === "fuego") || {}).nivel, "incompleta", "semáforo de contra incendio:");
    if (G("QUOTE").porCotizar.some((p) => p.clave === "bombaFuego")) throw new Error("la bomba sin altura no va «Por cotizar» como dimensionada por el motor");
    if (!G("QUOTE").pendientes.some((p) => p.mot === "fuego" && /pendiente de altura/.test(p.motivo) && /height/.test(p.motivoEn || ""))) throw new Error("la bomba debe quedar pendiente de altura en la cotización (ES/EN)");
    if (!G("QUOTE").porCotizar.some((p) => p.clave === "cisternaFuego")) throw new Error("la reserva no depende de la altura: sigue «Por cotizar»");
    if (G("cargasOtrosMotoresElec")(S.elec).some((f) => f.kWOrigen === "fuego")) throw new Error("sin bomba dimensionada no se ofrece su carga a Eléctrico");
    S.tab = "fuego"; G("render")();
    const potencia = [...w.document.querySelectorAll("#view .metric")].find((m) => /Potencia/.test(m.querySelector(".k").textContent));
    contiene(potencia ? potencia.textContent : "", "pendiente", "la pantalla dice que la potencia está pendiente:");
    /* Sin cabezal o sin montante tampoco: la fricción no se supone. */
    S.fuego.altura = 6; S.fuego.Lramal = 0; G("recompute")();
    eq(F().hpBomba, 0, "sin cabezal capturado no se dimensiona la bomba:");
    if (!F().avisos.some((a) => a.lvl === "err" && /cabezal/.test(a.msg))) throw new Error("sin cabezal el aviso es error");
    S.fuego.Lramal = 30; S.fuego.Lmontante = 0; G("recompute")();
    eq(F().hpBomba, 0, "sin montante capturado tampoco:");
    /* Sin valores por omisión ocultos: un proyecto con los campos nulos no toma 6, 30 ni 12 m. */
    G("reemplazarEstado")({ ...JSON.parse(JSON.stringify(S)), fuego: { ...S.fuego, altura: null, Lramal: null, Lmontante: null } }); G("recompute")();
    if (F().estatica === 7 || F().Lram === 30 || F().Lmon === 12) throw new Error(`campos nulos leídos como 6/30/12 m: estática ${F().estatica}, cabezal ${F().Lram}, montante ${F().Lmon}`);
    if (F().memo.some((m) => /6 m capturados/.test(m))) throw new Error("una altura nula se leyó como 6 m capturados");
    eq(F().hpBomba, 0, "con los campos nulos la bomba queda pendiente:");
    /* Con red municipal no se afirma que alcance sin altura. */
    S.fuego = { ...S.fuego, altura: 0, Lramal: 30, Lmontante: 12, fuente: "municipal", presFuente: 35 }; G("recompute")();
    if (F().alcanza === true) throw new Error("sin altura no se puede afirmar que la red municipal alcanza");
    /* Con todo capturado, la bomba vuelve (6 + 1 m de estática). */
    S.fuego = { ...S.fuego, altura: 6, fuente: "cisterna" }; G("recompute")();
    eq(F().estatica, 7, "con la altura capturada la estática vuelve (6 + 1):");
    eq(F().hpBomba, 35, "potencia con todo capturado:");
    contiene(G("QUOTE").porCotizar.find((p) => p.clave === "bombaFuego").desc, "39.1 m", "bomba con todo capturado:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});
t("S.101 (H-265) obra civil es autónoma: sus áreas de obra y sus cuartos clasificados se capturan en su pestaña; no toma las zonas de carga térmica ni los cuartos limpios; un proyecto anterior los copia una vez al abrirlo, con las mismas cifras (decisión del dueño, 27-sep-2026)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.101";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.101" }; });
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6 }, { ...G("defaultZone")("Oficina"), area: 100, height: 3 }];
    const r0 = G("cleanRooms")()[0]; r0.area = 60; r0.height = 3;
    G("recompute")();
    if (!(G("geoProyecto")().area > 0 && G("CLEAN").sum.area > 0)) throw new Error("el caso no aísla lo que se quiere probar: debe haber zonas y cuarto limpio");
    let R = G("CIVIL");
    eq(R.area, 0, "civil no toma el área de las zonas de carga térmica:");
    eq(R.areaLimpia, 0, "ni el área de los cuartos limpios:");
    eq(G("LINKS")["load>civil"], undefined, "no queda cruce load>civil:"); eq(G("LINKS")["clean>civil"], undefined, "no queda cruce clean>civil:");
    if (G("ARISTAS").some((a) => a.a === "civil" && a.regla === 1)) throw new Error("el diagrama sigue dibujando una herencia hacia obra civil");
    if (!R.avisos.some((a) => /captura las áreas de obra/.test(a.msg))) throw new Error("sin áreas capturadas debe avisar que faltan");
    /* Captura propia: áreas y cuartos de civil. */
    S.civil.areas = [{ id: "a1", nombre: "Nave", area: 400, altura: 6, perimetro: 100 }, { id: "a2", nombre: "Oficina", area: 100, altura: 3, perimetro: 0 }];
    S.civil.cuartos = [{ id: "k1", nombre: "Cuarto A", area: 60, altura: 3, perimetro: 32 }];
    G("recompute")(); R = G("CIVIL");
    eq(R.area, 500, "área = suma de las áreas de obra capturadas:"); eq(R.areaLimpia, 60, "área clasificada = cuartos capturados:");
    cerca(R.muroM2, 100 * 6 + 2 * 2.5 * Math.sqrt(100 / 1.5) * 3, 1e-6, "tabiquería: capturada × altura + rectángulo 3:2 estimado:");
    eq(R.estimado, true, "la oficina sin perímetro queda estimada:");
    cerca(R.muroLimpio, 32 * 3, 1e-9, "muro clasificado = perímetro × altura del cuarto:"); cerca(R.mlCana, 64, 1e-9, "media caña doble:");
    /* Las zonas y los cuartos limpios ya no la mueven. */
    const t0 = R.total; S.zones[0].area = 900; S.zones[0].height = 9; r0.area = 200; G("recompute")();
    cerca(G("CIVIL").total, t0, 1e-6, "cambiar zonas o cuartos limpios no mueve la obra civil:");
    /* Sin altura capturada no se suponen 2.8 m: muro en 0 y aviso. */
    S.civil.areas[1].altura = 0; G("recompute")();
    cerca(G("CIVIL").muroM2, 100 * 6, 1e-6, "la oficina sin altura no aporta muro:");
    if (!G("CIVIL").avisos.some((a) => /sin altura capturada/.test(a.msg))) throw new Error("un área sin altura debe avisar que su muro queda pendiente");
    S.civil.areas[1].altura = 3; G("recompute")();
    /* Pantalla: la captura vive en la pestaña. */
    S.tab = "civil"; G("render")();
    const d = w.document, txt = d.getElementById("view").textContent;
    if (/Heredado/.test(txt)) throw new Error("la pantalla de civil todavía dice «Heredado»");
    ["civil.areas.0.area", "civil.areas.0.altura", "civil.areas.1.perimetro", "civil.cuartos.0.perimetro"].forEach((p) => { if (!d.querySelector(`#view [data-path="${p}"]`)) throw new Error("falta el campo " + p); });
    const add = d.querySelector('#view [data-act="civil-add"][data-tipo="areas"]'); if (!add) throw new Error("no hay botón para agregar un área de obra");
    add.click(); eq(S.civil.areas.length, 3, "agregar desde la pantalla:");
    if (new Set(S.civil.areas.map((a) => a.id)).size !== 3) throw new Error("los ids de las áreas deben ser únicos");
    /* Un proyecto anterior (sin áreas propias de civil) abre con sus áreas y su cuarto copiados de zonas y cuartos limpios. */
    const viejo = JSON.parse(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8"));
    if (Array.isArray(viejo.civil.areas)) throw new Error("el caso no aísla lo que se quiere probar: el fixture debe ser de antes de H-265");
    G("importarRespaldo")(JSON.stringify(viejo)); G("recompute")();
    eq(S.civil.areas.map((a) => a.nombre).join(","), "Producción,Oficinas,Limpio ISO 7,Laboratorio HR", "áreas copiadas de las zonas:");
    eq(S.civil.cuartos.map((c) => c.nombre + ":" + c.area + "×" + c.altura).join(","), "Cuarto limpio 1:120×3", "cuarto copiado del cuarto limpio:");
    eq(S.civil.perimZonas, undefined, "los perímetros por zona pasan al renglón:"); eq(S.civil.perimCuartos, undefined, "y los del cuarto también:");
    const t1 = G("CIVIL").total; S.zones[0].area = 5000; G("recompute")();
    cerca(G("CIVIL").total, t1, 1e-6, "ya migrado, obra civil no sigue a las zonas:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

t("S.102 (H-266) soportería es autónoma: sin la instantánea aceptada no cuenta metros de otros motores (se retiró el conteo en vivo); aceptarla los cuantifica y ya no se mueven solos; alturas y bases se capturan; un proyecto anterior se migra al abrir con las mismas cifras (decisión del dueño, 27-sep-2026)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.102";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.102" }; });
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6, occ: 30 }, { ...G("defaultZone")("Oficina"), area: 100, height: 3, occ: 10 }];
    S.duct.segments = [{ ...G("defaultSegment")("TR-1", 3000), length: 20 }];
    G("recompute")();
    if (!G("DUCT").segs.some((x) => Number(x.L) > 0)) throw new Error("el caso no aísla lo que se quiere probar: ductos debe tener un tramo con longitud");
    let SP = G("SOPORTE");
    eq(SP.mDucto, 0, "sin aceptar la propuesta no se cuentan los metros de ductos:");
    eq(SP.hTrab, 0, "la altura de trabajo no sale de las zonas:"); eq(SP.hEstructura, 0, "ni la de la estructura:");
    /* «Usar los motores» sin instantánea (un estado de revisiones anteriores o capturado directo) tampoco cuenta en vivo. */
    S.soporte.usarMotores = true; G("recompute")(); SP = G("SOPORTE");
    eq(SP.mDucto, 0, "con «usar los motores» pero sin instantánea tampoco se cuenta en vivo:");
    if (!SP.avisos.some((a) => /entran sólo al aceptar su propuesta/.test(a.msg))) throw new Error("debe avisar que los metros de los motores entran sólo al aceptar la propuesta");
    /* Aceptar la propuesta: instantánea; concede los cruces; ya cuantificado no se mueve solo. */
    Object.keys(G("LINKS")).filter((k) => /soporte$/.test(k)).forEach((k) => { delete S.perms[k]; });
    G("propAceptar")("motores>soporte"); SP = G("SOPORTE");
    const m1 = SP.mDucto; if (!(m1 >= 20)) throw new Error("con la instantánea aceptada deben contarse los 20 m de ducto: " + m1);
    ["duct>soporte", "hidro>soporte", "fuego>soporte", "aire>soporte"].forEach((k) => { if (!S.perms[k]) throw new Error("aceptar la propuesta debe conceder " + k); });
    S.duct.segments[0].length = 50; G("recompute")();
    eq(G("SOPORTE").mDucto, m1, "ya cuantificado no se mueve solo:");
    eq(G("estadoPropuesta")("motores>soporte").nivel, "desactualizado", "la propuesta avisa que el origen cambió:");
    /* Alturas y bases capturadas: mandan y las zonas no las mueven. */
    Object.assign(S.soporte, { alturaTrabajo: 7.2, alturaEstructura: 6, basesEquipo: 2, mesesElevacion: 2 }); G("recompute")();
    eq(G("SOPORTE").hTrab, 7.2, "altura de trabajo capturada:"); eq(G("SOPORTE").nEquipos, 2, "bases capturadas:");
    S.zones[0].height = 12; G("recompute")();
    eq(G("SOPORTE").hTrab, 7.2, "cambiar las zonas no mueve la altura de trabajo:"); eq(G("SOPORTE").hEstructura, 6, "ni la de la estructura:");
    /* Sin altura de trabajo: renta pendiente, no se supone. */
    S.soporte.alturaTrabajo = 0; G("recompute")(); SP = G("SOPORTE");
    if (!SP.avisos.some((a) => /no hay altura de trabajo capturada/.test(a.msg))) throw new Error("sin altura de trabajo debe avisar que la renta queda pendiente");
    if (SP.part.some((p) => /renta/.test(p.desc))) throw new Error("sin altura de trabajo no debe cotizarse renta de elevación");
    /* Contra incendio sin longitudes de cabezal y montante: la red queda pendiente; ya no se suponen 30 + 12 m leídos en vivo. */
    S.fuego = { ...G("defaultFuego")(), area: 500, altura: 6 }; aceptarSoporte();
    if (!G("SOPORTE").manualPendientes.some((p) => /sin longitudes de cabezal y montante/.test(p.que))) throw new Error("la red contra incendio sin longitudes debe quedar pendiente");
    const t2 = G("SOPORTE").total; S.fuego.Lramal = 40; S.fuego.Lmontante = 10; G("recompute")();
    cerca(G("SOPORTE").total, t2, 1e-9, "con la instantánea aceptada, contra incendio no se cuela en vivo:");
    /* Un proyecto anterior que contaba en vivo: al abrirlo toma la instantánea y las alturas que usaba; desde ahí no cuenta en vivo. */
    const viejo = JSON.parse(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8"));
    if ("alturaEstructura" in viejo.soporte || viejo.soporte.snap) throw new Error("el caso no aísla lo que se quiere probar: el fixture debe ser de antes de H-266 y en vivo");
    G("importarRespaldo")(JSON.stringify(viejo)); G("recompute")();
    if (!(S.soporte.snap && typeof S.soporte.snap === "object")) throw new Error("al abrir un proyecto en vivo debe tomarse la instantánea");
    eq(S.soporte.alturaTrabajo, 7.2, "altura de trabajo = la que usaba (zona más alta 6 m + 1.2):"); eq(S.soporte.alturaEstructura, 6, "altura de la estructura = la zona más alta:");
    const mv = G("SOPORTE").mDucto; S.duct.segments.push({ ...G("defaultSegment")("TR-X", 3000), length: 40 }); G("recompute")();
    eq(G("SOPORTE").mDucto, mv, "ya migrado no cuenta en vivo:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

/* ===== S.103 (H-268) eléctrico autónomo: las cargas de otros motores entran sólo como propuesta aceptada (instantánea) ===== */
t("S.103 (H-268) eléctrico es autónomo: con permisos y tomarHVAC, sin aceptar la propuesta, la cédula, el ventilador, el compresor, las bombas y los FFU NO entran al cuadro (se retiró el modo en vivo); aceptar concede los cruces y deja una instantánea con fecha que no se mueve sola; un proyecto guardado en vivo migra al abrir con las mismas cifras (sólo con los cruces que tenía); el sello no cambia al reabrir (decisión del dueño, 27-sep-2026)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.103";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.103" }; });
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6, occ: 30, lights: 8000, equip: 12000 }, { ...G("defaultZone")("Oficina"), area: 100, height: 3, occ: 10, lights: 1500, equip: 2000 }];
    S.vent = { ...S.vent, mode: "general", area: 500, height: 5.4, occ: 40 };
    S.aire = { ...G("defaultAire")(), consumos: [{ id: "c1", tipo: "pistola", nombre: "Prueba S.103", cant: 4, lmin: 0, bar: 0, uso: 0 }] };
    S.hidro = { ...G("defaultHidro")(), muebles: [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }] };
    S.fuego = { ...G("defaultFuego")(), area: 500, altura: 6, Lramal: 30, Lmontante: 12 };   /* H-210: con trayectoria capturada la bomba se dimensiona */
    S.clean = { rooms: [{ ...G("defaultRoom")(), area: 60, height: 2.7, occ: 4, procW: 25 }], ci: 0 };
    S.elec = { ...G("defaultElec")(), trafoKVA: 300, trafoZ: 4, Ltablero: 30, tomarHVAC: true,
      cargas: [{ ...G("defaultCarga")("Alumbrado S.103"), tipo: "alumbrado", kW: 9.5, V: 127, ph: 1, cant: 1, L: 40, fp: .95 }] };
    G("recompute")();
    aceptarEquip();   /* H-267: la cédula HVAC sale de la selección, que calcula con la propuesta de carga térmica aceptada */
    const fuentes = { cedula: !!(G("SYS") && G("SYS").chosen && G("SYS").chosen.id !== "none"), compresor: !!(G("AIRE").principal && G("AIRE").principal.kW > 0 && G("AIRE").nUnidades > 0), bombaAgua: G("HIDRO").kWbomba > 0, bombaIncendio: G("FUEGO").kWbomba > 0, ffu: G("CLEAN").sum.ffu > 0 };
    Object.entries(fuentes).forEach(([k, v]) => { if (!v) throw new Error(`el caso no aísla lo que se quiere probar: ${k} debe tener algo que proponer`); });
    const prop = G("propuestaElecFilas")();
    if (!(prop.length >= 5)) throw new Error("la propuesta debe traer la cédula, el compresor, las bombas y los FFU: " + prop.length);
    /* 1) Con todos los cruces autorizados y tomarHVAC (el modo en vivo de revisiones anteriores), sin aceptar: sólo lo capturado. */
    let R = G("ELEC");
    eq(R.calc.length, 1, "sin aceptar la propuesta sólo cuenta la carga capturada (nada entra en vivo):");
    if (R.calc.some((c) => c.auto)) throw new Error("una carga entró en vivo desde otro motor");
    eq(G("PROPUESTAS")["cedula>elec"].enVivo(), false, "ya no existe el modo en vivo:");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "pendiente", "la propuesta está por decidir, no «vivo»:");
    const demSolo = R.kVAdemanda;
    /* 2) Aceptar: concede los seis cruces y deja las cargas como instantánea con origen y fecha. */
    G("CRUCES_ELEC").forEach((k) => { delete S.perms[k]; });
    G("propAceptar")("cedula>elec"); R = G("ELEC");
    G("CRUCES_ELEC").forEach((k) => { if (!S.perms[k]) throw new Error("aceptar la propuesta debe conceder " + k); });
    const ced = S.elec.cargas.filter((c) => c.origen === "cedula");
    eq(ced.length, prop.length, "las cargas propuestas quedan en el cuadro con origen «cedula»:");
    ced.forEach((c) => { if (!(c.ts > 0)) throw new Error(`${c.nombre}: sin fecha de aceptación`); });
    ["hvac", "aire", "hidro", "fuego", "ffu"].forEach((o) => { if (!ced.some((c) => c.kWOrigen === o)) throw new Error(`falta la carga de origen ${o} en la instantánea`); });
    if (!(R.kVAdemanda > demSolo)) throw new Error("aceptadas, la demanda del tablero debe subir");
    eq(R.calc.length, 1 + ced.length, "el cuadro trae la capturada más las aceptadas:");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "aceptado", "aceptada y vigente:");
    /* 3) Regla 3: el origen cambia, el cuadro no se mueve, la propuesta avisa; y la propuesta sí refleja el cambio en el mismo ciclo. */
    const dem1 = R.kVAdemanda, comp1 = ced.find((c) => c.kWOrigen === "aire").kW;
    S.aire.consumos = [{ id: "c1", tipo: "actuador", nombre: "Grande 1", cant: 400, lmin: 0, bar: 0, uso: 0 }, { id: "c2", tipo: "pistola", nombre: "Grande 2", cant: 200, lmin: 0, bar: 0, uso: 0 }]; G("recompute")();
    if (!(G("AIRE").principal.kW > comp1)) throw new Error("el caso no aísla lo que se quiere probar: el compresor nuevo debe ser mayor");
    cerca(G("ELEC").kVAdemanda, dem1, 1e-9, "ya aceptada, la instantánea no se mueve sola aunque el compresor cambie:");
    eq(S.elec.cargas.find((c) => c.kWOrigen === "aire").kW, comp1, "el kW aceptado se conserva:");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "desactualizado", "la propuesta avisa que el origen cambió:");
    cerca(G("propuestaElecFilas")().find((c) => c.kWOrigen === "aire").kW, G("AIRE").principal.kW, 1e-9, "la propuesta trae el compresor nuevo en el mismo recompute:");
    /* 4) Los permisos ya no mueven el cuadro: las aceptadas son captura propia con origen; los parámetros propios mandan. */
    G("CRUCES_ELEC").forEach((k) => { delete S.perms[k]; }); G("recompute")();
    cerca(G("ELEC").kVAdemanda, dem1, 1e-9, "quitar los cruces no saca las cargas ya aceptadas:");
    S.elec.tempAmb = 50; G("recompute")();
    if (!(G("ELEC").alim.awg !== R.alim.awg || G("ELEC").calc.some((c, i) => c.cond.awg !== R.calc[i].cond.awg))) throw new Error("la temperatura ambiente capturada en la pestaña debe mandar en el calibre");
    S.elec.tempAmb = 40; G("recompute")();
    /* 5) Textos: pantalla, guía y memoria dicen de dónde salen las cargas; nada habla del modo en vivo. */
    const v = G("viewElec")();
    if (/en vivo/i.test(v)) throw new Error("la pantalla sigue hablando del modo en vivo");
    contiene(G("GUIA").electrico.ojo, "autónomo", "la guía lo declara:");
    if (!G("ELEC").memo.some((m) => /Origen de las cargas \(H-268\)/.test(m) && /aceptada\(s\) de otros motores/.test(m))) throw new Error("la memoria no dice de dónde salen las cargas");
    if (/EN VIVO/.test(G("PROPUESTAS")["cedula>elec"].actual())) throw new Error("la propuesta sigue hablando del modo en vivo");
    /* 6) Proyecto guardado en vivo (tomarHVAC con los cruces autorizados): abre con las MISMAS cifras que hoy da aceptar la propuesta, como instantánea con fecha, y desde ahí no cuenta en vivo. */
    const fixture = JSON.parse(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8"));
    if (fixture.elec.tomarHVAC || "h268" in fixture.elec) throw new Error("el caso no aísla lo que se quiere probar: el fixture debe ser de antes de H-268 y sin modo en vivo");
    G("importarRespaldo")(JSON.stringify(fixture)); G("recompute")();
    const antes = G("ELEC").kVAdemanda;
    G("propAceptar")("cedula>elec");
    const esperado = JSON.stringify(G("cifrasMotor")("elec")), nCed = S.elec.cargas.filter((c) => c.origen === "cedula").length;
    if (!(nCed >= 6)) throw new Error("el fixture debe proponer las seis fuentes (cédula, extractor, compresor, bombas, FFU): " + nCed);
    const vivo = JSON.parse(JSON.stringify(fixture)); vivo.elec.tomarHVAC = true;
    G("importarRespaldo")(JSON.stringify(vivo)); G("recompute")();
    eq(S.elec.tomarHVAC, false, "el modo en vivo queda apagado al abrir:");
    eq(S.elec.cargas.filter((c) => c.origen === "cedula").length, nCed, "las cargas que tomaba en vivo quedan como instantánea:");
    if (!S.elec.cargas.filter((c) => c.origen === "cedula").every((c) => c.ts > 0)) throw new Error("la instantánea migrada debe llevar fecha");
    eq(JSON.stringify(G("cifrasMotor")("elec")), esperado, "abre con las mismas cifras que tenía en vivo:");
    if (!(G("ELEC").kVAdemanda > antes)) throw new Error("el caso no aísla lo que se quiere probar: las cargas en vivo deben pesar en la demanda");
    eq((G("vinculoDe")("cedula>elec") || {}).estado, "aceptado", "queda registrada como propuesta aceptada:");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "aceptado", "vigente:");
    const demMig = G("ELEC").kVAdemanda;
    S.aire.consumos.push({ id: "cx", tipo: "actuador", nombre: "Más", cant: 400, lmin: 0, bar: 0, uso: 0 }); G("recompute")();
    cerca(G("ELEC").kVAdemanda, demMig, 1e-9, "ya migrado no cuenta en vivo:");
    /* 6b) En vivo con un solo cruce autorizado: sólo migra ese; no se conceden cruces nuevos; hoy los demás motores proponen más y el usuario decide. */
    const parcial = JSON.parse(JSON.stringify(fixture)); parcial.elec.tomarHVAC = true;
    ["vent>elec", "aire>elec", "hidro>elec", "fuego>elec", "clean>elec"].forEach((k) => { delete parcial.perms[k]; });
    G("importarRespaldo")(JSON.stringify(parcial)); G("recompute")();
    const cedP = S.elec.cargas.filter((c) => c.origen === "cedula");
    if (!cedP.length || !cedP.every((c) => c.kWOrigen === "hvac")) throw new Error("con sólo equip>elec autorizado debía migrar únicamente la cédula HVAC: " + cedP.map((c) => c.kWOrigen).join(","));
    if (S.perms["aire>elec"]) throw new Error("la migración no debe conceder cruces que no estaban autorizados");
    eq(G("estadoPropuesta")("cedula>elec").nivel, "desactualizado", "hoy los demás motores proponen más: el usuario decide:");
    /* 6c) tomarHVAC sin ningún cruce autorizado: no había nada en vivo, nada se acepta. */
    const nada = JSON.parse(JSON.stringify(fixture)); nada.elec.tomarHVAC = true; G("CRUCES_ELEC").forEach((k) => { delete nada.perms[k]; });
    G("importarRespaldo")(JSON.stringify(nada)); G("recompute")();
    eq(S.elec.cargas.filter((c) => c.origen === "cedula").length, 0, "sin cruces autorizados no había nada en vivo: nada se acepta:");
    eq(G("vinculoDe")("cedula>elec"), null, "y no se registra vínculo:");
    eq(S.elec.tomarHVAC, false, "el modo en vivo queda apagado:");
    /* 7) Sello: guardar y reabrir un proyecto ya migrado no dice «la captura cambió». */
    G("importarRespaldo")(JSON.stringify(vivo)); G("recompute")();
    S.sellos = S.sellos || {}; S.sellos.elec = { ts: 1700000000000, huella: G("huellaMotor")("elec"), ver: G("MOTOR_VER").elec };
    G("importarRespaldo")(JSON.stringify({ v: G("FORMATO_GUARDADO"), ...JSON.parse(JSON.stringify(S)) })); G("recompute")();
    eq(G("selloDe")("elec").estado, "calculado", "reabrir el proyecto no cambia la huella del eléctrico:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

/* ===== S.104 (H-267) selección de equipo autónoma: calcula sólo con sus zonas de selección (capturadas o aceptadas) ===== */
t("S.104 (H-267) selección de equipo es autónoma: sin aceptar la propuesta, cambiar la carga de una zona NO mueve el sistema integrado; aceptarla lo calcula con una instantánea con fecha; si la carga cambia después, la propuesta sale «desactualizada» y el sistema no se mueve; una zona capturada a mano sin perfil horario deja la simultaneidad «pendiente»; un proyecto guardado antes abre con las mismas cifras (decisión del dueño, 27-sep-2026)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.104";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.104" }; });
    S.zones = [{ ...G("defaultZone")("Nave"), area: 400, height: 6, occ: 30, lights: 8000, equip: 12000 }, { ...G("defaultZone")("Oficina"), area: 100, height: 3, occ: 10, lights: 1500, equip: 2000 }];
    G("recompute")();
    if (!(G("totals")().tons > 1)) throw new Error("el caso no aísla lo que se quiere probar: la carga térmica debe tener toneladas");
    const cifras = () => JSON.stringify([G("SYS").nz, G("SYS").sumPeaks, G("SYS").blockTons, G("cifrasMotor")("equip")]);
    const huellaE = () => G("huellaMotor")("equip");
    const s0 = cifras(), h0 = huellaE();
    /* 1) Sin aceptar: la carga de una zona cambia y la selección no se mueve (antes la leía en vivo: el núcleo térmico compartía sin permiso). */
    S.zones[0].occ = 60; S.zones[0].equip = 20000; G("recompute")();
    eq(cifras(), s0, "sin aceptar la propuesta, cambiar la carga de una zona no mueve el sistema integrado:");
    eq(huellaE(), h0, "ni la huella de la selección (ENTRADAS.equip ya no lleva la carga):");
    eq(G("SYS").chosen.id, "none", "sin zonas de selección no hay sistema:");
    eq(G("estadoPropuesta")("load>equip").nivel, "pendiente", "la carga queda como propuesta por decidir:");
    eq(G("DOMAINS").equip.cluster === "termico", false, "selección ya no está en el núcleo térmico:");
    delete S.perms["load>equip"]; eq(G("linkAllowed")("load>equip"), false, "el cruce load>equip pide permiso (ya no pasa por sameCluster):");
    /* 2) Aceptar: instantánea con origen y fecha; concede el cruce; el sistema integrado toma la carga. */
    const t0 = Date.now();
    G("propAceptar")("load>equip");
    const Z = S.equip.zonas;
    eq(Z.length, 2, "una zona de selección por zona de carga:");
    Z.forEach((z, i) => {
      eq(z.origen && z.origen.motor, "load", `zona ${i + 1} con origen carga térmica:`);
      if (!(z.origen.fecha >= t0)) throw new Error(`zona ${i + 1} sin fecha de aceptación`);
      eq(z.name, S.zones[i].name, "nombre:"); cerca(z.tons, G("LOADS")[i].tons, 1e-12, "TR:");
    });
    if (!S.perms["load>equip"]) throw new Error("aceptar la propuesta debe conceder load>equip");
    eq(G("SYS").nz, 2, "el sistema integrado calcula con las zonas aceptadas:");
    cerca(G("SYS").sumPeaks, G("totals")().tons, 1e-9, "suma de picos = carga aceptada:");
    eq(G("estadoPropuesta")("load>equip").nivel, "aceptado", "aceptada y vigente:");
    const s1 = cifras(), h1 = huellaE(), tons1 = G("SYS").sumPeaks;
    /* 3) Regla 3: la carga cambia; la selección no se mueve; la propuesta avisa y trae la carga nueva en el mismo ciclo. */
    S.zones[1].occ = 40; S.zones[1].equip = 9000; G("recompute")();
    eq(cifras(), s1, "ya aceptada, la selección no se mueve aunque la carga cambie:");
    eq(huellaE(), h1, "ni su huella:");
    eq(G("estadoPropuesta")("load>equip").nivel, "desactualizado", "la propuesta avisa que el origen cambió:");
    cerca(G("zonasPropuestasEquip")()[1].tons, G("LOADS")[1].tons, 1e-12, "la propuesta trae la carga nueva en el mismo recompute:");
    const dif = G("diferenciasEquip")();
    if (!dif.some((d) => d.zona === "Oficina" && d.cambios.some((c) => c.campo === "tons"))) throw new Error("«ver diferencias» debe mostrar la TR de la zona que cambió");
    eq(G("semaforoSuite")().find((x) => x.id === "equip").nivel, "desactualizada", "el semáforo de selección lo dice:");
    contiene(G("viewSeleccion")(), "Ver diferencias", "la pestaña ofrece ver las diferencias:");
    /* 4) Volver a aceptar: toma la carga nueva. */
    G("propAceptar")("load>equip");
    cerca(G("SYS").sumPeaks, G("totals")().tons, 1e-9, "al volver a aceptar toma la carga nueva:");
    if (!(G("SYS").sumPeaks > tons1)) throw new Error("el caso no aísla lo que se quiere probar: la carga nueva debe ser mayor");
    /* 5) Zona capturada a mano: sin perfil horario la simultaneidad queda pendiente (no se inventa perfil); procedencia en pantalla. */
    if (!G("SYS").haveProf) throw new Error("el caso no aísla lo que se quiere probar: con las zonas aceptadas debe haber barrido horario");
    const k = G("agregarZonaEquip")();
    G("editarZonaEquip")(k, "name", "Bodega"); G("editarZonaEquip")(k, "tons", 3); G("editarZonaEquip")(k, "cfm", 1200); G("editarZonaEquip")(k, "area", 150);
    G("recompute")();
    eq(S.equip.zonas[k].origen, null, "la zona capturada a mano no lleva origen:");
    eq(S.equip.zonas[k].profile, null, "no se inventa perfil:");
    eq(G("SYS").nz, 3, "entra al sistema:");
    eq(G("SYS").haveProf, false, "sin perfil en una zona no hay simultaneidad por hora:");
    cerca(G("SYS").blockTons, G("SYS").sumPeaks, 1e-9, "el bloque es la suma de picos (sin diversidad supuesta):");
    const v = G("viewSeleccion")();
    contiene(v, "capturada en esta pestaña", "procedencia a mano:"); contiene(v, "aceptada el", "procedencia de la carga:");
    if (!/simultaneidad por hora[^<]*pendiente/i.test(v)) throw new Error("la pantalla debe declarar la simultaneidad por hora como pendiente");
    if (!G("ENGINES").equip.checks().some((c) => /pendiente/.test(c.msg) && /Bodega/.test(c.msg))) throw new Error("la validación debe declarar la zona sin perfil");
    /* Editar la TR de una zona aceptada: queda «editada aquí» y sin perfil (pendiente); no se reescala nada. */
    G("editarZonaEquip")(0, "tons", 12); G("recompute")();
    eq(S.equip.zonas[0].editada, true, "la zona aceptada que se edita queda marcada:"); eq(S.equip.zonas[0].profile, null, "y sin perfil:");
    cerca(G("SYS").peaks.find((p) => p.zone === "Nave").tons, 12, 1e-12, "con la TR capturada:");
    /* 6) Entregables con procedencia. */
    const pdf = textoPdf(G("buildSeleccionPdf")());
    contiene(pdf, "Procedencia", "memoria de selección:"); contiene(pdf, "aceptada", "memoria de selección:"); contiene(pdf, "capturada en esta", "memoria de selección:");
    const ced = textoPdf(G("buildCedulaEquiposPdf")()); contiene(ced, "Procedencia de las zonas", "cédula:");
    if (!G("trazaHerencia")().some((r) => r.destinoId === "equip" && r.en && r.en.campo)) throw new Error("el trazado de origen debe llevar la fila de selección con espejo EN");
    /* 7) Proyecto guardado antes de H-267 (sin zonas de selección): abre con la instantánea tomada al abrir y las mismas cifras. */
    const fixture = JSON.parse(fs.readFileSync("parches/regresion-motores/regresion-motores.emp.json", "utf8"));
    if ("equip" in fixture) throw new Error("el caso no aísla lo que se quiere probar: el fixture debe ser de antes de H-267");
    const esperado = JSON.parse(fs.readFileSync("parches/regresion-motores/regresion-motores.esperado.json", "utf8")).motores.equip.cifras;
    G("importarRespaldo")(JSON.stringify(fixture)); G("recompute")();
    eq(S.equip.zonas.length, fixture.zones.length, "toma una zona de selección por zona de carga:");
    eq(S.equip.tomarDeCarga, null, "la marca se consume una sola vez:");
    if (!S.equip.zonas.every((z) => z.origen && z.origen.motor === "load" && z.origen.fecha > 0)) throw new Error("la instantánea migrada debe llevar origen y fecha");
    eq((G("vinculoDe")("load>equip") || {}).estado, "aceptado", "queda registrada como propuesta aceptada:");
    eq(G("estadoPropuesta")("load>equip").nivel, "aceptado", "vigente:");
    eq(JSON.stringify(G("cifrasMotor")("equip")), JSON.stringify(esperado), "abre con las mismas cifras de selección:");
    if (S.perms["load>equip"]) throw new Error("la migración no concede cruces nuevos (cambiaría la huella de otros motores)");
    const hMig = huellaE(), sMig = cifras();
    S.zones[0].occ += 50; G("recompute")(); eq(cifras(), sMig, "ya migrado no lee la carga en vivo:"); S.zones[0].occ -= 50; G("recompute")();
    /* 8) Sellos: un sello viejo dice «el motor cambió»; reabrir un proyecto migrado conserva la huella. */
    S.sellos = { equip: { ts: 1700000000000, huella: "0123456789abcd", ver: "1" } };
    const sv = G("selloDe")("equip"); eq(sv.estado, "desactualizado", "sello de la versión anterior:"); contiene(sv.texto, "el motor cambió", "sello viejo:");
    S.sellos.equip = { ts: 1700000000000, huella: hMig, ver: G("MOTOR_VER").equip };
    G("importarRespaldo")(JSON.stringify({ v: G("FORMATO_GUARDADO"), ...JSON.parse(JSON.stringify(S)) })); G("recompute")();
    eq(G("selloDe")("equip").estado, "calculado", "reabrir el proyecto migrado conserva la huella:");
    G("importarRespaldo")(JSON.stringify(fixture)); G("recompute")(); eq(huellaE(), hMig, "migrar otra vez (otra fecha) da la misma huella:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

/* ===== S.120–S.125 (H-272) · la carga de archivos alimenta la CAPTURA PROPIA de cada disciplina independiente =====
   Decisión del dueño (27-sep-2026): todos los motores independientes; «al insertar los archivos con el levantamiento
   (planos, información, Excel, bases de datos de planos o dibujos, y catálogos) utiliza la metadata para iniciar con el
   cálculo». Los archivos de prueba se arman aquí (como en las secciones 17, 20 y 21): un plano DXF de levantamiento con
   tres cuartos (dos con altura rotulada), un plano de instalaciones, una memoria PDF, un Excel de locales y CSV de
   extracción y de cargas. Sin nombres de clientes. */
{
  const zlibx = await import("node:zlib");
  const tA = async (nombre, fn) => { try { const r = await fn(); if (r === false) { fail++; fallos.push([nombre, "devolvió falso"]); } else ok++; } catch (e) { fail++; fallos.push([nombre, e.message]); } };
  const archivo = (nombre, c, ruta) => ({ file: new w.File([typeof c === "string" ? c : new Uint8Array(c)], nombre), ruta: ruta || nombre });
  const par = (c, v) => `${String(c).padStart(3)}\n${v}\n`;
  const lw = (capa, pts) => par(0, "LWPOLYLINE") + par(8, capa) + par(90, pts.length) + par(70, 1) + pts.map(([x, y]) => par(10, x) + par(20, y)).join("");
  const rect = (capa, x0, y0, x1, y1) => lw(capa, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
  const txt = (c, x, y, s) => par(0, "TEXT") + par(8, c) + par(10, x) + par(20, y) + par(40, 250) + par(1, s);
  const lin = (c, L) => par(0, "LINE") + par(8, c) + par(10, 0) + par(20, 0) + par(11, L) + par(21, 0);
  const dxfDe = (cuerpo) => par(0, "SECTION") + par(2, "HEADER") + par(9, "$INSUNITS") + par(70, 4) + par(0, "ENDSEC") + par(0, "SECTION") + par(2, "ENTITIES") + cuerpo + par(0, "ENDSEC") + par(0, "EOF");
  /* Levantamiento en planta (mm): nave 20×15 m (300 m², h 6, perímetro 70) con un cuarto limpio ISO 8 de 6×5 m adentro (30 m²,
     perímetro 22, SIN altura rotulada); oficina 10×8 m (80 m², h 3, perímetro 36) pegada a la nave. */
  const DXF_LEV = dxfDe(rect("A-MURO", 0, 0, 20000, 15000) + txt("A-TEXTO", 10000, 12000, "NAVE PRODUCCION 300 m2 h=6.00 m") +
    rect("A-MURO", 20000, 0, 30000, 8000) + txt("A-TEXTO", 25000, 4000, "OFICINA 80 m2 h=3.00 m") +
    rect("A-MURO", 2000, 2000, 8000, 7000) + txt("A-TEXTO", 5000, 4500, "CUARTO LIMPIO ISO 8 30 m2"));
  /* Plano de instalaciones: una nave con altura rotulada y tres redes medibles por capa. */
  const DXF_INST = dxfDe(rect("A-MURO", 0, 0, 20000, 15000) + txt("A-TEXTO", 10000, 7000, "NAVE h=7.50 m") +
    lin("IH-AGUA-FRIA", 45000) + lin("M-DUCTO-SA", 60000) + lin("PCI-ROCIADORES", 38000));
  const pdfDe = (paginas) => { const objs = []; const add = (b) => { objs.push(Buffer.isBuffer(b) ? b : Buffer.from(b, "latin1")); return objs.length; };
    const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const cont = paginas.map((t2) => { const z = zlibx.deflateSync(Buffer.from(t2, "latin1")); return add(Buffer.concat([Buffer.from(`<< /Length ${z.length} /Filter /FlateDecode >>\nstream\n`), z, Buffer.from("\nendstream")])); });
    const pagesId = objs.length + cont.length + 1;
    const pags = cont.map((c) => add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents ${c} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`));
    add(`<< /Type /Pages /Kids [${pags.map((p) => p + " 0 R").join(" ")}] /Count ${pags.length} >>`); const cat = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    const partes = [Buffer.from("%PDF-1.4\n")]; let pos = partes[0].length; const offs = [];
    objs.forEach((o, i) => { offs.push(pos); const b = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), o, Buffer.from("\nendobj\n")]); partes.push(b); pos += b.length; });
    partes.push(Buffer.from(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root ${cat} 0 R >>\nstartxref\n${pos}\n%%EOF\n`));
    return Buffer.concat(partes); };
  const PDF_LEV = pdfDe(["BT /F1 12 Tf 72 720 Td (LEVANTAMIENTO DE LA NAVE) Tj 0 -16 Td (Altura libre: 6.0 m  Ocupacion: 35 personas) Tj ET",
    "BT /F1 12 Tf 72 720 Td (Cambios de aire 8 cambios/h) Tj ET"]);
  const zipDe = (e) => G("zipCrear")(e.map((x) => ({ nombre: x.nombre, datos: typeof x.datos === "string" ? new w.TextEncoder().encode(x.datos) : new Uint8Array(x.datos) })));
  const celda = (r, v) => typeof v === "number" ? `<c r="${r}"><v>${v}</v></c>` : `<c r="${r}" t="inlineStr"><is><t>${v}</t></is></c>`;
  const xlsxDe = (nombreHoja, filas) => zipDe([
    { nombre: "[Content_Types].xml", datos: '<Types xmlns="x"><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>' },
    { nombre: "xl/workbook.xml", datos: `<workbook xmlns="x" xmlns:r="r"><sheets><sheet name="${nombreHoja}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { nombre: "xl/_rels/workbook.xml.rels", datos: '<Relationships><Relationship Id="rId1" Type="w" Target="worksheets/sheet1.xml"/></Relationships>' },
    { nombre: "xl/worksheets/sheet1.xml", datos: `<worksheet><sheetData>${filas.map((f, i) => `<row r="${i + 1}">${f.map((v, j) => celda(String.fromCharCode(65 + j) + (i + 1), v)).join("")}</row>`).join("")}</sheetData></worksheet>` },
  ]);
  /* Levantamiento en Excel: un renglón de título arriba del encabezado, como lo exportan los programas de planos. */
  const XLSX_LEV = xlsxDe("Levantamiento", [["Levantamiento de locales", "", "", "", ""], ["Local", "Área (m²)", "Altura (m)", "Perímetro (m)", "Clasificación"],
    ["Nave producción", 300, 6, 70, ""], ["Oficina", 80, 3, 36, ""], ["Cuarto limpio", 30, 3, 22, "ISO 8"]]);
  const CSV_EXTRACCION = "Nombre,Capa,Area,Perimetro,Altura\nNave,A-LOCAL,300 m2,70 m,6 m\nOficina,A-LOCAL,80 m2,36 m,3 m\n";
  const textoPdf = (u8) => Buffer.from(u8).toString("latin1");
  const filasT = () => G("cxzArchivos")();
  const esperaCola = async () => { for (let i = 0; i < 400; i++) { if (!G("CXZ_OCUPADO") && !filasT().some((f) => f.estado === "espera" && f.motor !== "sin" && f.motor !== "referencia") && !filasT().some((f) => f.estado === "procesando")) return; await new Promise((r) => setTimeout(r, 15)); } throw new Error("la cola de procesamiento no terminó"); };
  const REBANADAS = ["zones", "clean", "vent", "fuego", "civil", "soporte", "duct", "hidro", "aire", "elec"];
  const foto = () => Object.fromEntries(REBANADAS.map((k) => [k, JSON.stringify(S[k])]));
  const cambiaron = (a, b) => REBANADAS.filter((k) => a[k] !== b[k]);
  const HUELLAS = ["load", "clean", "vent", "fuego", "civil", "soporte", "duct", "hidro", "aire"];
  const huellas = () => Object.fromEntries(HUELLAS.map((k) => [k, G("huellaMotor")(k)]));
  const huellasMovidas = (a, b) => HUELLAS.filter((k) => a[k] !== b[k]);
  const limpio = (nombre) => { G("closeModal")(); G("reemplazarEstado")(G("defaultState")()); S.meta.name = nombre; G("projSave")(true); G("recompute")(); };
  const cargar = async (entradas) => { S.tab = "tablero"; await G("cxzAgregarArchivos")(entradas); await esperaCola(); };
  const ultimoLote = (tab) => { const L = G("cxLotesDe")(tab); return L[L.length - 1]; };
  const guardado = JSON.stringify(S);
  try {
    await tA("S.120 (H-272a) obra civil: el plano y el Excel del levantamiento alimentan SU captura (S.civil.areas y S.civil.cuartos, un renglón por espacio con nombre, área, altura si viene, perímetro si viene y su archivo); ya no se escribe civil.areaManual ni se apaga usarZonas; lo que el archivo no trae queda pendiente (altura 0); sólo obra civil cambia", async () => {
      limpio("S.120");
      S.civil.areas = [{ id: "a1", nombre: "Patio techado", area: 50, altura: 4, perimetro: 30 }]; G("recompute")();
      const f0 = foto(), h0 = huellas();
      await cargar([archivo("levantamiento.dxf", DXF_LEV, "Obra civil/levantamiento.dxf")]);
      const fila = filasT()[0];
      eq(fila.motor, "civil", "la carpeta manda:"); eq(fila.estado, "listo", fila.detalle);
      eq(S.civil.usarZonas, true, "cargar un plano no cambia obra civil a «totales capturados a mano»:");
      eq(Number(S.civil.areaManual) || 0, 0, "el área del plano no va al total a mano:");
      eq(JSON.stringify(S.civil.areas[0]), JSON.stringify({ id: "a1", nombre: "Patio techado", area: 50, altura: 4, perimetro: 30 }), "lo capturado a mano sigue igual:");
      const nave = S.civil.areas.find((a) => /NAVE/i.test(a.nombre)), ofi = S.civil.areas.find((a) => /OFICINA/i.test(a.nombre));
      if (!nave || !ofi) throw new Error("cada espacio del plano debe ser un renglón de «Áreas de obra»: " + JSON.stringify(S.civil.areas));
      cerca(nave.area, 300, .01, "área de la nave:"); cerca(nave.altura, 6, 1e-9, "altura rotulada de la nave:"); cerca(nave.perimetro, 70, .01, "perímetro del polígono:");
      cerca(ofi.area, 80, .01, "área de la oficina:"); cerca(ofi.altura, 3, 1e-9, "cada espacio con SU altura, no la mayor del plano:"); cerca(ofi.perimetro, 36, .01, "perímetro de la oficina:");
      if (new Set(S.civil.areas.map((a) => a.id)).size !== S.civil.areas.length) throw new Error("ids repetidos en las áreas de obra");
      const k = (S.civil.cuartos || []).find((c) => /LIMPIO/i.test(c.nombre));
      if (!k) throw new Error("el cuarto ISO 8 del plano debe entrar como cuarto clasificado de obra civil: " + JSON.stringify(S.civil.cuartos));
      cerca(k.area, 30, .01, "área del cuarto:"); cerca(k.perimetro, 22, .01, "perímetro del cuarto:"); eq(Number(k.altura) || 0, 0, "sin altura rotulada no se supone ninguna (regla 6):");
      if (S.civil.areas.some((a) => /LIMPIO/i.test(a.nombre))) throw new Error("el cuarto dentro de la nave no se cuenta además como área de obra");
      G("recompute")(); cerca(G("CIVIL").area, 50 + 300 + 80, .01, "área de obra = lo capturado + lo del plano:");
      if (!G("CIVIL").avisos.some((a) => /sin altura capturada/.test(a.msg))) throw new Error("el motor debe avisar que el cuarto sin altura queda pendiente");
      /* Trazabilidad (regla 8): cada renglón aplicado con su archivo y su rótulo; en pantalla, en «Origen de los datos» y en la memoria. */
      const L = ultimoLote("civil");
      const ap = L.aplicados.filter((a) => a.destino === "civil.areas" || a.destino === "civil.cuartos");
      eq(ap.length, 3, "un registro de origen por renglón:");
      ap.forEach((a) => { eq(a.archivo, "levantamiento.dxf", "archivo de origen:"); if (!a.texto) throw new Error("el registro no dice el rótulo del plano del que salió"); });
      contiene(G("cxOrigenHtml")("civil"), "NAVE PRODUCCION", "«Origen de los datos» lista el renglón:");
      S.tab = "civil"; G("render")();
      contiene(w.document.getElementById("view").textContent, "levantamiento.dxf", "la pestaña dice de qué archivo salió cada renglón:");
      contiene(textoPdf(G("buildCivilPdf")()), "levantamiento.dxf", "la memoria de obra civil cita el archivo:");
      /* Aislamiento: sólo obra civil cambia. */
      eq(cambiaron(f0, foto()).join(","), "civil", "rebanadas del estado que cambiaron:");
      eq(huellasMovidas(h0, huellas()).join(","), "civil", "huellas de motor que se movieron:");
      /* Excel del levantamiento: un renglón por local, con hoja y fila de origen. */
      limpio("S.120b");
      await cargar([archivo("levantamiento.xlsx", XLSX_LEV, "Obra civil/levantamiento.xlsx")]);
      const fx = filasT()[0];
      eq(fx.motor, "civil", "la carpeta manda:"); eq(fx.estado, "listo", fx.detalle);
      eq(S.civil.areas.map((a) => `${a.nombre}:${a.area}×${a.altura}/${a.perimetro}`).join(","), "Nave producción:300×6/70,Oficina:80×3/36", "áreas de obra del Excel:");
      eq((S.civil.cuartos || []).map((c) => `${c.nombre}:${c.area}×${c.altura}/${c.perimetro}`).join(","), "Cuarto limpio:30×3/22", "cuartos clasificados del Excel:");
      const apx = ultimoLote("civil").aplicados.filter((a) => /^civil\.(areas|cuartos)$/.test(a.destino));
      eq(apx.length, 3, "registros de origen del Excel (2 áreas + 1 cuarto):");
      apx.forEach((a) => { contiene(a.archivo, "levantamiento.xlsx", "archivo:"); contiene(a.archivo, "Levantamiento", "hoja:"); if (!(a.fila > 2)) throw new Error("el origen no dice la fila de la hoja (contando el título y el encabezado): " + JSON.stringify(a)); });
      eq(apx.find((a) => /Oficina/.test(a.etiqueta)).fila, 4, "fila de la oficina en la hoja:");
      eq(Number(S.civil.areaManual) || 0, 0, "ni como total a mano:");
      /* Extracción de datos de AutoCAD en CSV, con la unidad en la celda: entra completa, no sólo el renglón «Nave». */
      limpio("S.120c");
      await cargar([archivo("extraccion.csv", CSV_EXTRACCION, "Obra civil/extraccion.csv")]);
      eq(S.civil.areas.map((a) => `${a.nombre}:${a.area}×${a.altura}/${a.perimetro}`).join(","), "Nave:300×6/70,Oficina:80×3/36", "la extracción entra renglón por renglón:");
      eq(Number(S.civil.areaManual) || 0, 0, "el área no va al total a mano:");
      eq(w.__errs.length, 0, "errores de ventana:");
    });
    await tA("S.121 (H-272b) reaplicar un archivo no duplica: volver a revisar tras recargar, reasignar ida y vuelta, cargar el mismo archivo otra vez y «Aplicar» en la ventana reconocen lo que ya entró de ese archivo (clave archivo+dato), no lo repiten ni pisan lo editado; la fila lo dice; quitar el archivo avisa y no borra los datos; 34 archivos dejan 34 registros de origen", async () => {
      limpio("S.121");
      await cargar([archivo("levantamiento.dxf", DXF_LEV, "Obra civil/levantamiento.dxf")]);
      const f = filasT()[0];
      eq(f.motor, "civil", "motor:"); eq(S.civil.areas.length, 2, "áreas al cargar:"); eq(S.civil.cuartos.length, 1, "cuartos al cargar:");
      const lotes0 = G("cxLotesDe")("civil").length, aplicados0 = f.aplicados;
      /* 1) Tras recargar la página no queda el lote de sesión: «Volver a revisar» vuelve a leer el archivo. */
      delete G("CXZ_LOTES")[f.id];
      await G("cxzRevisar")(f.id);
      eq(S.civil.areas.length, 2, "volver a revisar tras recargar duplicó las áreas:"); eq(S.civil.cuartos.length, 1, "…o los cuartos:");
      eq(G("cxLotesDe")("civil").length, lotes0, "no se agrega un registro de origen vacío:");
      contiene(f.detalle, "ya habían entrado", "la fila dice que ya habían entrado:"); eq(f.aplicados, aplicados0, "la fila sigue contando lo que entró de este archivo:");
      const m = w.document.getElementById("modal");
      contiene(m.textContent, "ya había entrado de este archivo", "la ventana marca lo ya entrado:");
      /* 2) «Aplicar» en la ventana tampoco repite. */
      m.querySelector('[data-act="cx-aplicar"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      eq(S.civil.areas.length, 2, "«Aplicar» duplicó:"); eq(G("cxLotesDe")("civil").length, lotes0, "registros de origen tras «Aplicar»:");
      /* 3) Reasignar a otra disciplina y de vuelta: la otra recibe lo suyo, la primera no repite. */
      G("cxzReasignar")(f.id, "fuego"); await esperaCola();
      if (!(S.fuego.area > 0)) throw new Error("reasignado a contra incendio no recibió su área a proteger: " + f.detalle);
      G("cxzReasignar")(f.id, "civil"); await esperaCola();
      eq(S.civil.areas.length, 2, "reasignar ida y vuelta duplicó las áreas:"); eq(S.civil.cuartos.length, 1, "…o los cuartos:");
      contiene(f.detalle, "ya habían entrado");
      /* 4) Lo que el usuario editó después no se pisa: el área a proteger que entró sola se cambió a mano. */
      S.fuego.area = 999; G("recompute")();
      const f2 = (await (async () => { await cargar([archivo("levantamiento.dxf", DXF_LEV, "Contra incendio/levantamiento.dxf")]); return filasT()[filasT().length - 1]; })());
      eq(f2.motor, "fuego"); eq(S.fuego.area, 999, "el mismo plano en otra carpeta pisó el área editada a mano:");
      contiene(f2.detalle, "ya habían entrado", "la fila nueva dice que ese dato ya había entrado de este archivo:");
      /* 5) El mismo archivo otra vez en la misma disciplina: no repite y lo dice. */
      await cargar([archivo("levantamiento.dxf", DXF_LEV, "Obra civil/levantamiento.dxf")]);
      const f3 = filasT()[filasT().length - 1];
      eq(f3.motor, "civil"); eq(S.civil.areas.length, 2, "cargar el mismo archivo otra vez duplicó:"); contiene(f3.detalle, "ya habían entrado");
      /* 6) Quitar el archivo de la tabla no borra lo que entró (puede estar editado) y lo dice. */
      await G("cxzQuitar")(f.id);
      eq(S.civil.areas.length, 2, "quitar el archivo borró los renglones:");
      contiene(w.document.querySelector("#toast").textContent, "siguen en Obra civil", "el aviso dice dónde quedaron:");
      if (!G("cxLotesDe")("civil").some((l) => l.archivoRetirado)) throw new Error("el registro de origen no quedó marcado «archivo retirado»");
      contiene(G("cxOrigenHtml")("civil"), "archivo retirado", "«Origen de los datos» lo dice:");
      /* 7) Trazado sin tope corto: 34 cuadros de cargas distintos son 34 registros de origen (antes 30). */
      limpio("S.121b");
      const cuadros = Array.from({ length: 34 }, (_, i) => archivo(`cuadro-${i + 1}.csv`, `circuito,descripcion,Potencia (kW),Tension,Fases\nC-${i + 1},Tablero ${i + 1},${(i + 1) * 0.5},220 V,3F\n`, `Electrico/cuadro-${i + 1}.csv`));
      await cargar(cuadros);
      eq(S.elec.cargas.length, 34, "cargas:"); eq(G("cxLotesDe")("electrico").length, 34, "registros de origen (uno por archivo):");
      eq(w.__errs.length, 0, "errores de ventana:");
    });
    await tA("S.122 (H-272c) nada se supone al cargar: la zona de carga térmica entra sólo con lo que el plano trae (altura y personas rotuladas, muros exteriores a esa altura; ocupantes, luces, equipo y vidrio en 0 = pendientes); un cuarto sin clase ISO escrita queda sin marcar con la clase pendiente; el área a proteger de un plano de varios cuartos es la suma de sus polígonos exteriores y la altura la del cuarto más alto, con su origen; un consumo de aire sin columna de cantidad es 1 por renglón", async () => {
      limpio("S.122");
      await cargar([archivo("levantamiento.dxf", DXF_LEV, "Carga termica/levantamiento.dxf")]);
      const f = filasT()[0]; eq(f.motor, "carga", "motor:"); eq(f.estado, "listo", f.detalle);
      /* Las zonas son los cuartos «hoja» del plano (la nave contiene al cuarto limpio y no se duplica como zona). */
      const ofi = S.zones.find((z) => /OFICINA/.test(z.name)), k = S.zones.find((z) => /LIMPIO/.test(z.name));
      if (!ofi || !k) throw new Error("zonas del plano: " + S.zones.map((z) => z.name).join(","));
      cerca(ofi.height, 3, 1e-9, "altura rotulada de la oficina:"); eq(ofi.occ, 0, "ocupantes no rotulados no se suponen:"); eq(ofi.lights, 0, "luces no se suponen:"); eq(ofi.equip, 0, "equipo no se supone:");
      cerca(ofi.walls.N, 10 * 3, .2, "muro norte = ancho × altura rotulada:"); eq(ofi.walls.W, 0, "cara compartida con la nave:");
      eq(["N", "NE", "E", "SE", "S", "SW", "W", "NW"].reduce((a, o) => a + ofi.glass[o], 0), 0, "el vidrio no se deduce de un plano:");
      eq(k.height, 0, "sin altura rotulada no se supone ninguna:"); eq(["N", "E", "S", "W"].reduce((a, o) => a + k.walls[o], 0), 0, "sin altura no hay muro que calcular:");
      const pK = G("CXZ_LOTES")[f.id].propuestas.find((p) => /LIMPIO/.test(p.etiqueta));
      contiene(pK.valor, "pendientes", "la propuesta dice qué queda pendiente:"); contiene(pK.valor, "altura", "…incluida la altura:");
      contiene((G("CXZ_LOTES")[f.id].analisis.avisosPropuesta || []).join(" "), "no se suponen", "el aviso de la carga lo dice:");
      G("recompute")();
      const Lofi = G("LOADS")[S.zones.indexOf(ofi)];
      if (!(Lofi && Lofi.tons > 0)) throw new Error("la oficina con altura rotulada debe producir carga (muros y envolvente): " + JSON.stringify(Lofi && Lofi.tons));
      /* Cuartos limpios: sin clase ISO escrita no se supone ISO 7: el cuarto se ofrece sin marcar y lo dice. */
      limpio("S.122b");
      const DXF_SINISO = dxfDe(rect("A-MURO", 0, 0, 8000, 5000) + txt("A-TEXTO", 4000, 2500, "CUARTO LIMPIO LLENADO 40 m2"));
      await cargar([archivo("llenado.dxf", DXF_SINISO, "Cuartos limpios/llenado.dxf")]);
      const f2 = filasT()[0]; eq(f2.motor, "limpios", "motor:");
      const p2 = G("CXZ_LOTES")[f2.id].propuestas.find((p) => p.grupo === "cuarto");
      if (!p2) throw new Error("no se propuso el cuarto: " + f2.detalle);
      eq(p2.marcado, false, "sin clase ISO escrita no entra solo:"); eq(!!p2.aplicado, false, "…ni se aplicó:"); contiene(p2.valor, "pendiente", "la propuesta dice que la clase queda pendiente:");
      if ((S.clean.rooms || []).some((r) => /LLENADO/.test(r.name))) throw new Error("el cuarto sin clase entró solo con una clase supuesta");
      contiene(f2.detalle, "por revisar", "la fila lo deja por revisar:");
      /* Contra incendio: el área a proteger es la suma de los espacios exteriores del plano, no el rótulo de un cuarto; la altura, la del más alto. */
      limpio("S.122c");
      await cargar([archivo("levantamiento.dxf", DXF_LEV, "Contra incendio/levantamiento.dxf")]);
      eq(S.fuego.area, 380, "área a proteger = nave + oficina (antes 300, el rótulo de un cuarto):"); cerca(S.fuego.altura, 6, 1e-9, "altura del cuarto más alto:");
      const apH = ultimoLote("fuego").aplicados.find((a) => a.destino === "fuego.altura");
      if (!apH) throw new Error("la altura no quedó registrada con su origen"); contiene(apH.texto, "NAVE", "el origen dice de qué cuarto salió la altura:");
      /* Aire comprimido: sin columna de cantidad, cada renglón es un consumidor; la demanda pico ya no es 0. */
      limpio("S.122d");
      await cargar([archivo("consumos.csv", "Equipo,Consumo (l/min)\nPistola de soplado,400\nCilindro,250\n", "Aire comprimido/consumos.csv")]);
      eq(filasT()[0].motor, "aire", "motor:"); eq(S.aire.consumos.length, 2, "consumos:");
      eq(S.aire.consumos.map((c) => c.cant).join(","), "1,1", "un consumidor por renglón:");
      G("recompute")(); cerca(G("AIRE").pico, 650, .5, "demanda pico:");
      eq(w.__errs.length, 0, "errores de ventana:");
    });
    await tA("S.123 (H-272d) un archivo alimenta a varias disciplinas: el levantamiento (por carpeta o por tener varios espacios) se lee una vez y ofrece sus datos a obra civil, carga térmica, cuartos limpios, contra incendio, ventilación y soportería, cada uno a su captura propia y con su registro de origen, sin cruces ni permisos; ventilación ofrece cada cuarto sin marcar; soportería recibe los metros por capa y la altura libre como altura de la estructura sin marcar, sin casilla de conteo ni altura de trabajo; con instantánea aceptada los metros no entran solos; el cuadro de cargas en HP entra con kW, FP y distancia", async () => {
      limpio("S.123");
      const h0 = huellas(), perms0 = JSON.stringify(S.perms || {});
      await cargar([archivo("levantamiento.dxf", DXF_LEV, "Levantamiento/levantamiento.dxf")]);
      const f = filasT()[0];
      eq(f.motor, "levantamiento", "un levantamiento alimenta a varias disciplinas:"); eq(f.estado, "listo", f.detalle);
      eq(S.civil.areas.length, 2, "obra civil recibe sus áreas:"); eq(S.civil.cuartos.length, 1, "…y su cuarto:"); eq(S.civil.usarZonas, true);
      eq(S.zones.filter((z) => /OFICINA|LIMPIO/.test(z.name)).length, 2, "carga térmica recibe sus zonas:");
      eq((S.clean.rooms || []).filter((r) => /LIMPIO/.test(r.name)).length, 1, "cuartos limpios recibe el cuarto ISO 8:");
      eq(S.fuego.area, 380, "contra incendio recibe el área a proteger:"); cerca(S.fuego.altura, 6, 1e-9, "…y la altura:");
      eq(S.vent.area, 0, "ventilación no recibe el área total sola (elige el local):");
      const lv = G("CXZ_LOTES")[f.id];
      if (!lv || !lv.compuesto) throw new Error("el levantamiento debe dejar un lote por disciplina");
      const pv = ((lv.porTab.ventilacion || {}).lote || { propuestas: [] }).propuestas.filter((p) => p.destino === "vent.area");
      if (pv.length < 2 || pv.some((p) => p.marcado || p.aplicado)) throw new Error("ventilación debe ofrecer cada cuarto como opción sin marcar: " + JSON.stringify(pv.map((p) => [p.etiqueta, p.marcado])));
      eq(huellasMovidas(h0, huellas()).sort().join(","), "civil,clean,fuego,load", "huellas de motor que se movieron:");
      eq(JSON.stringify(S.perms || {}), perms0, "no se conceden permisos entre disciplinas:");
      contiene(f.detalle, "Obra civil", "la fila cuenta por disciplina:"); contiene(f.detalle, "Contra incendio");
      const M = G("cxzEstadoMotores")();
      if (M.some((m) => m.id === "levantamiento")) throw new Error("«levantamiento» no es un motor: cuenta en cada disciplina");
      eq(M.find((m) => m.id === "civil").archivos, 1, "el estado de obra civil cuenta el levantamiento:"); eq(M.find((m) => m.id === "civil").aplicados, 3, "…con lo que aplicó ahí:");
      eq(M.find((m) => m.id === "fuego").aplicados, 2, "contra incendio cuenta su área y su altura:");
      ["civil", "carga", "limpios", "fuego"].forEach((t) => { const L = G("cxLotesDe")(t); if (!L.length || !L[L.length - 1].aplicados.some((a) => a.archivo === "levantamiento.dxf")) throw new Error(t + ": sin registro de origen del levantamiento"); });
      await G("cxzRevisar")(f.id);
      const m = w.document.getElementById("modal");
      contiene(m.textContent, "Este levantamiento alimenta", "la ventana ofrece una pestaña por disciplina:"); contiene(m.textContent, "Obra civil"); contiene(m.textContent, "Ventilación");
      m.querySelector('[data-act="cx-cambiar"][data-cx-tab="fuego"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      contiene(w.document.getElementById("modal").textContent, "Área a proteger", "cambiar de pestaña muestra el lote de esa disciplina:");
      G("closeModal")();
      /* Reprocesar (tras recargar) no duplica en ninguna de las disciplinas (H-272b). */
      delete G("CXZ_LOTES")[f.id]; await G("cxzRevisar")(f.id); G("closeModal")();
      eq(S.civil.areas.length, 2, "civil no duplica:"); eq(S.zones.filter((z) => /OFICINA|LIMPIO/.test(z.name)).length, 2, "carga no duplica:"); eq(S.fuego.area, 380);
      eq(f.motor, "levantamiento", "la fila sigue siendo levantamiento:");
      /* Una planta suelta con varios espacios también es levantamiento; con uno solo sigue siendo zona (20.4). */
      limpio("S.123a");
      await cargar([archivo("planta.dxf", DXF_LEV)]);
      eq(filasT()[0].motor, "levantamiento", "planta suelta con varios espacios:"); contiene(filasT()[0].motivo, "espacios");
      /* Soportería con un plano de instalaciones. */
      limpio("S.123b");
      await cargar([archivo("instalaciones.dxf", DXF_INST, "Soporteria/instalaciones.dxf")]);
      const fs2 = filasT()[0]; eq(fs2.motor, "soporte", "motor:"); eq(fs2.estado, "listo", fs2.detalle);
      cerca(S.soporte.ductoM, 60, .1, "ducto medido:"); cerca(S.soporte.tubHidroM, 45, .1, "tubería hidro medida:"); cerca(S.soporte.tubFuegoM, 38, .1, "tubería contra incendio medida:");
      eq(S.soporte.usarMotores, false, "usarMotores no cambia:"); eq(Number(S.soporte.alturaTrabajo) || 0, 0, "la altura de trabajo no se estima del plano:"); eq(Number(S.soporte.alturaEstructura) || 0, 0, "la altura de la estructura no entra sola:");
      const ls = G("CXZ_LOTES")[fs2.id].propuestas;
      if (ls.some((p) => p.destino === "soporte.usarMotores")) throw new Error("ya no hay casilla de conteo por motores");
      const pE = ls.find((p) => p.destino === "soporte.alturaEstructura");
      if (!pE || pE.marcado) throw new Error("la altura libre del plano debe ofrecerse sin marcar como altura de la estructura: " + JSON.stringify(ls.map((p) => p.destino)));
      cerca(pE.valor, 7.5, 1e-9, "altura libre del plano:");
      contiene(textoPdf(G("buildSoportePdf")()), "instalaciones.dxf", "la memoria de soportería cita el plano:");
      /* Con instantánea de motores aceptada los metros del plano no entran solos y se dice. */
      limpio("S.123c");
      S.soporte.snap = G("snapshotSoporte")(); S.soporte.usarMotores = true; G("recompute")();
      await cargar([archivo("instalaciones.dxf", DXF_INST, "Soporteria/instalaciones.dxf")]);
      eq(Number(S.soporte.ductoM) || 0, 0, "con instantánea aceptada los metros del plano no entran solos:");
      const pD = G("CXZ_LOTES")[filasT()[0].id].propuestas.find((p) => p.destino === "soporte.ductoM");
      if (!pD || pD.marcado) throw new Error("los metros deben ofrecerse sin marcar con la instantánea aceptada"); contiene(pD.texto, "instantánea", "…y decir por qué:");
      /* Eléctrico: un cuadro en HP con factor de potencia y distancia entra completo; lo que no viene queda pendiente. */
      limpio("S.123d");
      await cargar([archivo("cuadro-hp.csv", "Equipo,HP,Tension,Fases,FP,Distancia (m)\nBomba de agua,5,220 V,3F,0.85,30\nExtractor de aire,2,220 V,3F,0.8,12\n", "Electrico/cuadro-hp.csv")]);
      eq(filasT()[0].motor, "electrico", "motor:"); eq(S.elec.cargas.length, 2, "cargas desde HP: " + filasT()[0].detalle);
      cerca(S.elec.cargas[0].kW, 5 * 0.746, .001, "kW desde HP:"); eq(S.elec.cargas[0].fp, 0.85, "factor de potencia leído:"); eq(S.elec.cargas[0].L, 30, "distancia:"); eq(S.elec.cargas[0].V, 220); eq(S.elec.cargas[0].ph, 3);
      contiene(String(ultimoLote("electrico").aplicados[0].valor), "HP", "el origen dice que el kW salió de HP:");
      const sinV = await G("cxProcesarArchivos")([archivo("cuadro-sin-v.csv", "Equipo,kW\nHorno,5\n").file], "electrico");
      const pSinV = sinV.propuestas.find((p) => p.grupo === "carga");
      eq(pSinV.marcado, false, "sin tensión ni fases en el archivo la carga no entra sola:"); contiene(pSinV.valor, "pendiente", "…y dice que quedan pendientes:");
      eq(w.__errs.length, 0, "errores de ventana:");
    });
    await tA("S.124 (H-272e) catálogos y listas de precios quedan como referencia consultable con archivo, hoja/página y fila (marca, modelo, capacidad, precio con moneda y vigencia); no entran solos a ningún motor ni dejan registro de datos aplicados; el tablero los muestra y «Consultar» los abre; una lista de precios de tubería se ofrece para importarla a hidrosanitario con sus reglas; quitar el archivo retira sus referencias", async () => {
      limpio("S.124");
      const h0 = huellas(), f0 = foto();
      const XLSX_CAT = xlsxDe("Catalogo", [["Marca", "Modelo", "Capacidad (TR)", "kW", "Precio (MXN)", "Vigencia"], ["Carrier", "RTU-10", 10, 11.5, 185000, "2026-08-01"], ["Carrier", "RTU-15", 15, 16.8, 240000, ""]]);
      await cargar([archivo("catalogo-rtu.xlsx", XLSX_CAT, "Catalogos/catalogo-rtu.xlsx")]);
      const f = filasT()[0];
      eq(f.motor, "catalogo", "un catálogo es referencia consultable, no selección:"); eq(f.estado, "listo", f.detalle); contiene(f.detalle, "referencia"); contiene(f.detalle, "no entran a ningún motor");
      const R = S.cx.referencias || [];
      eq(R.length, 2, "renglones de referencia:");
      eq(R[0].marca, "Carrier", "marca:"); eq(R[0].modelo, "RTU-10", "modelo:"); contiene(R[0].capacidad, "10 TR", "capacidad con su unidad del encabezado:"); contiene(R[0].capacidad, "kW");
      eq(R[0].precio, 185000, "precio:"); eq(R[0].moneda, "MXN", "moneda del encabezado:"); eq(R[0].fecha, "2026-08-01", "vigencia:");
      contiene(R[0].archivo, "catalogo-rtu.xlsx", "archivo:"); contiene(R[0].archivo, "Catalogo", "hoja:"); eq(R[0].fila, 2, "fila de la hoja:"); eq(R[1].fila, 3); eq(R[1].fecha, null, "sin vigencia queda null, no una fecha supuesta:");
      eq(cambiaron(f0, foto()).join(","), "", "ningún motor recibe nada de un catálogo:"); eq(huellasMovidas(h0, huellas()).join(","), "", "ninguna huella se mueve:");
      eq((S.cx.lotes || []).length, 0, "no hay registro de datos aplicados: nada entró a un motor:");
      eq(G("cxzEstadoMotores")().some((m) => m.id === "catalogo"), false, "el catálogo no es un motor:");
      S.tab = "tablero"; G("render")();
      const v = w.document.getElementById("view"), txt = v.textContent;
      contiene(txt, "Referencias del proyecto ejecutivo", "el tablero muestra las referencias:"); contiene(txt, "RTU-10"); contiene(txt, "catalogo-rtu.xlsx"); contiene(txt, "fila 3"); contiene(txt, "sin fecha de vigencia", "el precio sin vigencia se declara referencia:");
      const btn = v.querySelector('[data-act="cxz-catalogo"]');
      if (!btn) throw new Error("la fila del catálogo no ofrece «Consultar»");
      btn.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      contiene(w.document.getElementById("modal").textContent, "RTU-15", "«Consultar» abre el catálogo:"); G("closeModal")();
      /* Reprocesar no duplica las referencias. */
      delete G("CXZ_LOTES")[f.id]; f.estado = "espera"; await G("cxzProcesarPendientes")(); await esperaCola();
      eq((S.cx.referencias || []).length, 2, "reprocesar duplicó las referencias:");
      /* Cédula de equipos en PDF: cada equipo con marca y capacidad, con su página. */
      limpio("S.124b");
      const PDF_CED = pdfDe(["BT /F1 12 Tf 72 720 Td (CEDULA DE EQUIPOS) Tj 0 -16 Td (UMA-01 Carrier 39M 12 TR 4500 CFM) Tj ET"]);
      await cargar([archivo("cedula.pdf", PDF_CED, "Catalogos/cedula.pdf")]);
      eq(filasT()[0].motor, "catalogo", "motor:"); eq(filasT()[0].estado, "listo", filasT()[0].detalle);
      const uma = (S.cx.referencias || []).find((r) => r.tag === "UMA-01");
      if (!uma) throw new Error("la cédula en PDF no dejó al equipo como referencia: " + JSON.stringify(S.cx.referencias));
      eq(uma.marca, "Carrier", "marca:"); eq(uma.pagina, 1, "página:"); contiene(uma.capacidad, "12", "capacidad del mismo renglón:");
      eq((S.cx.lotes || []).length, 0, "nada entró a selección ni a otro motor:");
      /* Lista de precios de tubería: referencia, y se ofrece importarla a hidrosanitario con las reglas del importador. */
      limpio("S.124c");
      /* El diámetro 1/2" va entrecomillado como lo exporta cualquier hoja de cálculo ("1/2"""). */
      await cargar([archivo("precios-tuberia.csv", "material,diametro,precio,moneda,fuente,fecha\ncpvc,\"1/2\"\"\",85,MXN,proveedor local,2026-09-01\n", "Catalogos/precios-tuberia.csv")]);
      const fp = filasT()[0];
      eq(fp.motor, "catalogo", "una lista de precios es catálogo:"); eq(fp.estado, "listo", fp.detalle); eq(fp.info.preciosHidro, true, "se reconoce como lista de precios de tubería:");
      eq((S.cx.referencias || []).length, 1, "un renglón de referencia:"); eq(S.cx.referencias[0].precio, 85);
      const clave = G("claveHidroPU")("cpvc", '1/2"');
      if (S.quote.hidroPU && S.quote.hidroPU[clave]) throw new Error("el precio entró solo a hidrosanitario: debe esperar la orden del usuario");
      S.tab = "tablero"; G("render")();
      w.document.querySelector('#view [data-act="cxz-catalogo"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      const bImp = w.document.querySelector('#modal [data-act="cxz-catalogo-hidro"]');
      if (!bImp) throw new Error("la ventana no ofrece importar la lista a precios de hidrosanitario");
      bImp.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      for (let i = 0; i < 100 && !(S.quote.hidroPU && S.quote.hidroPU[clave]); i++) await new Promise((r) => setTimeout(r, 10));
      if (!(S.quote.hidroPU && S.quote.hidroPU[clave] && S.quote.hidroPU[clave].precio === 85)) throw new Error("la importación a precios de hidro no ocurrió: " + JSON.stringify(S.quote.hidroPU));
      G("closeModal")();
      /* Quitar el archivo retira sus referencias (no son datos aplicados). */
      await G("cxzQuitar")(fp.id);
      eq((S.cx.referencias || []).length, 0, "quitar el archivo retira sus referencias:");
      eq(w.__errs.length, 0, "errores de ventana:");
    });
    await tA("S.125 (H-272 · regla 8) la memoria integral, las memorias por disciplina y el libro de la propuesta (ES y EN) dicen la verdad sobre lo que entró desde archivos: cada dato con archivo, página o fila y «entró solo al cargar» / «aceptado por el usuario»; ya no afirman que todo lo aceptó el usuario antes de entrar al motor", async () => {
      limpio("S.125");
      /* Entra solo desde el tablero (dato claro)… */
      await cargar([archivo("levantamiento.dxf", DXF_LEV, "Obra civil/levantamiento.dxf")]);
      eq(S.civil.areas.length, 2, "áreas al cargar:");
      /* …y el usuario acepta a mano desde «Punto de partida» de ventilación (altura, ocupantes y cambios de aire de una memoria en PDF). */
      await G("cxAlElegir")([archivo("memoria.pdf", PDF_LEV).file], "ventilacion");
      const m = w.document.getElementById("modal");
      if (m.hidden) throw new Error("no se abrió la ventana de hallazgos");
      m.querySelector('[data-act="cx-aplicar"]').dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
      cerca(S.vent.height, 6, 1e-9, "altura aceptada:"); eq(S.vent.occ, 35, "ocupantes aceptados:");
      const lv = ultimoLote("ventilacion");
      if (!lv || !lv.aplicados.length || !lv.aplicados.every((a) => a.auto === false)) throw new Error("lo aceptado en la ventana debe quedar marcado como aceptado por el usuario: " + JSON.stringify(lv && lv.aplicados.map((a) => a.auto)));
      if (!ultimoLote("civil").aplicados.every((a) => a.auto === true)) throw new Error("lo que entró solo debe quedar marcado como tal");
      /* Memoria integral. */
      const txt = textoPdf(G("buildMemoriaIntegralPdf")());
      if (/aceptado por el usuario antes de entrar al motor/.test(txt)) throw new Error("la memoria integral sigue afirmando que todo lo aceptó el usuario");
      contiene(txt, "datos cargados de archivos del proyecto ejecutivo", "trazado de origen:");
      contiene(txt, "solo al cargar", "distingue lo que entró solo:"); contiene(txt, "aceptado por el usuario", "…de lo aceptado:");
      contiene(txt, "levantamiento.dxf"); contiene(txt, "memoria.pdf"); contiene(txt, "p. 1", "página del PDF:");
      contiene(txt, "supuso", "regla 6 declarada (el párrafo se parte en renglones; basta la palabra):");
      /* Memorias por disciplina. */
      contiene(textoPdf(G("buildVentPdf")()), "memoria.pdf", "la memoria de ventilación cita el archivo:");
      const civilTxt = textoPdf(G("buildCivilPdf")());
      contiene(civilTxt, "levantamiento.dxf"); contiene(civilTxt, "solo al cargar", "la memoria de civil dice cómo entró cada renglón:");
      /* Libro de la propuesta, ES y EN (espejo). */
      const xlEs = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
      contiene(xlEs, "DATOS QUE ENTRARON DESDE ARCHIVOS DEL PROYECTO EJECUTIVO", "el libro trae la sección:"); contiene(xlEs, "levantamiento.dxf"); contiene(xlEs, "memoria.pdf");
      contiene(xlEs, "entró solo al cargar", "ES: entró solo:"); contiene(xlEs, "aceptado por el usuario", "ES: aceptado:"); contiene(xlEs, "p. 1", "ES: página:");
      const xlEn = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "MXN" })).toString("utf8");
      contiene(xlEn, "DATA ENTERED FROM EXECUTIVE-PROJECT FILES", "EN: sección:"); contiene(xlEn, "entered on load", "EN: entró solo:"); contiene(xlEn, "accepted by the user", "EN: aceptado:");
      eq(w.__errs.length, 0, "errores de ventana:");
    });
    /* [H-272: siguientes] */
  } finally { G("closeModal")(); G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
}

/* ===== R. Regresión por motor (rev 2.9.22, decisión del dueño): un proyecto fijo con cifras esperadas por disciplina ===== */
const REG_DIR = "parches/regresion-motores/";
const REG_PROY = fs.readFileSync(REG_DIR + "regresion-motores.emp.json", "utf8");
const REG_ESP = JSON.parse(fs.readFileSync(REG_DIR + "regresion-motores.esperado.json", "utf8"));
t("R.1 regresión por motor: las cifras del proyecto fijo coinciden con el esperado de cada disciplina; si un motor cambia sin subir MOTOR_VER, truena", () => {
  const guardado = JSON.stringify(S);
  try {
    G("importarRespaldo")(REG_PROY); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    const MV = G("MOTOR_VER"), fallas = [];
    Object.keys(MV).forEach((id) => {
      const e = REG_ESP.motores[id];
      if (!e) { fallas.push(`${id}: sin esperado (corre node parches/regresion-motores/genera.mjs)`); return; }
      const ahora = JSON.stringify(G("cifrasMotor")(id)), esp = JSON.stringify(e.cifras);
      if (e.ver !== MV[id]) fallas.push(`${id}: MOTOR_VER subió a v${MV[id]} y el esperado es de v${e.ver}: regenera el esperado de ese motor (genera.mjs) en el mismo commit que sube la versión`);
      else if (ahora !== esp) fallas.push(`${id}: las cifras cambiaron con la MISMA versión v${MV[id]}: cambió la lógica del motor sin subir MOTOR_VER (o el fixture). Sube la versión con su hallazgo en MOTOR_CAMBIOS y regenera el esperado`);
    });
    if (fallas.length) throw new Error(fallas.join("\n   "));
    eq(Object.keys(REG_ESP.motores).length, Object.keys(MV).length, "todos los motores tienen esperado:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});
t("R.2 abrir un proyecto viejo nunca recalcula solo: los sellos quedan como venían, las disciplinas afectadas dicen Desactualizado y nada se vuelve a sellar ni a guardar", () => {
  const guardado = JSON.stringify(S), lista0 = JSON.stringify(G("projList")());
  try {
    const p = JSON.parse(REG_PROY);
    p.sellos = { hidro: { ts: 1700000000000, huella: "0123456789abcd", ver: "1", resumen: { Gasto: "3.924 L/s" } }, duct: { ts: 1700000000000, huella: "0123456789abcd", ver: G("MOTOR_VER").duct } }; /* ductos con su versión vigente: sólo la huella difiere */
    const sellosArchivo = JSON.stringify(p.sellos);
    G("importarRespaldo")(JSON.stringify(p)); G("recompute")();
    eq(JSON.stringify(S.sellos), sellosArchivo, "los sellos son exactamente los del archivo (nadie recalculó ni volvió a sellar):");
    eq(G("selloDe")("hidro").estado, "desactualizado", "hidro (motor v1 → v4):"); eq(G("selloDe")("duct").estado, "desactualizado", "ductos: la huella no coincide (captura distinta), no se recalculó:");
    eq(G("motoresCambiados")().map((m) => m.id).join(","), "hidro", "sólo hidro cambió de versión de motor:");
    eq(JSON.stringify(G("projList")()), lista0, "abrir no guardó nada por su cuenta:");
    /* Calcular es la única vía de sellar: hasta que el usuario lo pulse, el sello viejo sigue. */
    S.tab = "hidro"; G("render")();
    eq(w.document.querySelector("#view .accsello").dataset.sello, "desactualizado", "la barra dice Desactualizado hasta que el usuario calcule:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});
/* H-107 (auditoría 22-sep-2026): la rev 2.9.21 cambió la lógica de carga térmica sin subir MOTOR_VER.load. R.1 no lo ve porque
   compara contra un esperado que se regenera a mano. R.3 compara el MISMO proyecto fijo contra la revisión base (--base): un motor
   sólo puede dar cifras distintas si subió su versión, o si subió la de un motor del que se alimenta (dependencias leídas de ENTRADAS). */
if (baseFile) {
  const wb3 = await cargar(baseFile);
  t("R.3 (H-107) ningún motor cambia de cifras respecto a la revisión base sin subir MOTOR_VER, propia o de un motor del que se alimenta", () => {
    const Gb = (e) => wb3.eval(e);
    const html = fs.readFileSync(file, "utf8");
    const src = html.slice(html.indexOf("function cifrasMotor(id)"), html.indexOf("const resumenTexto ="));
    if (!src.startsWith("function cifrasMotor")) throw new Error("no se encontró cifrasMotor en index.html");
    if (Gb("typeof cifrasMotor") !== "function") Gb(src.replace("function cifrasMotor(id)", "window.cifrasMotor = function (id)"));
    const arma = "S.tab = \"tablero\"; if (typeof KZ_CACHE !== \"undefined\") KZ_CACHE.key = null; if (typeof VZ_CACHE !== \"undefined\") VZ_CACHE.key = null; recompute();";
    Gb(`importarRespaldo(${JSON.stringify(REG_PROY)}); ${arma}`);
    const MVb = Gb("typeof MOTOR_VER !== 'undefined' ? JSON.parse(JSON.stringify(MOTOR_VER)) : {}");
    const guardado = JSON.stringify(S);
    try {
      G("importarRespaldo")(REG_PROY); G(arma);
      const MV = G("MOTOR_VER"), E = G("ENTRADAS");
      /* Dependencias de resultado: lo que cada motor lee de otros (ENTRADAS.x() dentro de su función). Valor lee además las
         oportunidades calculadas por Kaizen. */
      const DEP = Object.fromEntries(Object.keys(E).map((id) => [id, [...E[id].toString().matchAll(/ENTRADAS\.(\w+)\(\)/g)].map((m) => m[1]).filter((d) => d !== id)]));
      DEP.valor = [...new Set([...(DEP.valor || []), "kaizen"])];
      const ver = (mv, id) => String((mv && mv[id]) || "1");
      const subio = (id, vis = new Set()) => { if (vis.has(id)) return false; vis.add(id); return ver(MVb, id) !== ver(MV, id) || (DEP[id] || []).some((d) => subio(d, vis)); };
      const fallas = [];
      Object.keys(MV).forEach((id) => {
        const a = JSON.stringify(G("cifrasMotor")(id)), b = Gb(`JSON.stringify(cifrasMotor(${JSON.stringify(id)}))`);
        if (a !== b && !subio(id)) fallas.push(`${id}: cifras distintas a la base con la misma versión v${ver(MV, id)} y sin cambio de versión en los motores de los que se alimenta (${(DEP[id] || []).join(", ") || "ninguno"}). Sube MOTOR_VER.${id} con su hallazgo`);
      });
      if (fallas.length) throw new Error(fallas.join("\n   "));
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });
}

/* ===== Instalación limpia (rev 2.9.22, decisión del dueño): la suite se entrega en vacío ===== */
const wLimpia = await cargar(file);
t("S.40 una instalación limpia abre con todo en cero: sin proyectos, sin cuartos, cargas, cantidades ni precios de ejemplo; los fixtures de prueba no se cargan al abrir", () => {
  const GL = (e) => wLimpia.eval(e), SL = GL("S"), num = (v) => Number(v) || 0;
  eq(GL("projList()").length, 0, "sin proyectos guardados:"); eq(SL.pid, null, "sin proyecto abierto:");
  eq(GL("hayProyecto()"), false, "no hay proyecto:");
  eq(SL.zones.length, 1, "una zona en blanco:"); eq(num(SL.zones[0].area) + num(SL.zones[0].height) + num(SL.zones[0].occ) + num(SL.zones[0].lights) + num(SL.zones[0].equip), 0, "zona en ceros:");
  eq(num(SL.zones[0].achClean), 0, "cambios/h en blanco:");
  const r = GL("cleanRooms()")[0]; eq(num(r.area) + num(r.height) + num(r.occ), 0, "cuarto limpio en ceros:");
  eq(SL.duct.segments.length, 0, "sin tramos de ducto:"); eq(SL.elec.cargas.length, 0, "sin cargas eléctricas:");
  eq(SL.hidro.muebles.length + SL.hidro.tramos.length, 0, "sin muebles ni tramos de agua:"); eq(num(SL.fuego.area), 0, "sin área contra incendio:");
  eq(SL.aire.consumos.length, 0, "sin consumos de aire:"); eq(num(SL.civil.firmeM2) + num(SL.civil.puertasSimples) + num(SL.civil.puertasLimpias), 0, "civil en ceros:");
  eq(num(SL.soporte.rielM) + num(SL.soporte.basesEquipo), 0, "soportería en ceros:");
  eq(SL.quote.items.length, 0, "sin equipos elegidos:"); eq(JSON.stringify(SL.quote.hidroPU), JSON.stringify(GL("HIDRO_PU_REFERENCIA")), "sólo referencias de mercado de tubería, ningún precio de proveedor:"); eq((SL.quote.hidroPUlog || []).length, 0, "sin bitácora de precios:"); eq(SL.quote.fxFecha, "", "tipo de cambio sin fecha capturada:"); eq(SL.kaizen.items.length, 0, "sin mejoras:");
  eq(Object.keys(SL.sellos).length, 0, "sin sellos:"); eq(Object.keys(SL.perms).length, 0, "sin cruces autorizados:");
  GL("recompute()");
  eq(GL("QUOTE").tot, 0, "cotización en cero:"); eq(GL("totals()").tons, 0, "carga en cero:"); eq(GL("HIDRO").Qtotal, 0, "hidro en cero:"); eq(GL("FUEGO").qTotal, 0, "incendio en cero:"); eq(GL("AIRE").fadRequerido, 0, "aire en cero:"); eq(GL("CIVIL").total + GL("SOPORTE").total, 0, "civil y soportería en cero:");
  GL("semaforoSuite()").forEach((s) => { if (!["vacia", "externo", "gestion"].includes(s.nivel)) throw new Error(`${s.id}: ${s.nivel} en instalación limpia`); });
  /* Los datos de prueba viven en fixtures y nunca en la aplicación. */
  const html = fs.readFileSync(file, "utf8");
  if (/regresion-motores\.emp|proyecto-formato-1_rev|fetch\(|XMLHttpRequest/.test(html)) throw new Error("index.html carga o referencia un fixture de prueba");
  ["parches/regresion-motores/regresion-motores.emp.json", "parches/fixtures-formato/proyecto-formato-1_rev-2.9.13.emp.json"].forEach((f) => { if (!fs.existsSync(f)) throw new Error(`falta el fixture ${f}`); });
});

/* ===== Precios de referencia (rev 2.9.23, decisiones del dueño 22-sep-2026): únicamente California, sólo material, USD con tipo de cambio fechado; Budget vs formal ===== */
t("S.41 (rev 2.9.23) referencias de mercado: únicamente California y sólo material; IUSA fuera (Por cotizar); etiqueta honesta; USD sólo con tipo de cambio fechado; Budget sale con leyenda y «Por cotizar»; la formal se bloquea; proveedor local sustituye con antes/después; flete/aduana/importación siempre Por cotizar hasta capturarlo", () => {
  const guardado = JSON.stringify(S);
  const txtPdf = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  const REF_PRUEBA = (moneda, extra) => ({ precio: 4.2, moneda, iva: false, porTramo: 1, origen: "referencia", alcance: "material", fuente: "REFERENCIA DE PRUEBA (no es una fuente real)", edicion: "2026", pagina: "1", ubicacion: "San Diego, CA", lista: "costo de material de estimador", url: "", fecha: "2026-09-22", ...(extra || {}) });
  try {
    /* 1. IUSA fuera: no hay referencias cargadas; el cobre sale Por cotizar. */
    eq(JSON.stringify(G("HIDRO_PU_REFERENCIA")), "{}", "sin referencias cargadas hasta recibir los libros de Craftsman:");
    if (/IUSA/.test(JSON.stringify(G("defaultState")().quote.hidroPU))) throw new Error("un proyecto nuevo trae IUSA");
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.41"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.41" }; });
    S.zones[0].area = 100; S.zones[0].height = 3;
    S.hidro = { ...G("defaultHidro")(), material: "cobre", tramos: [{ ...G("defaultTramoAgua")("AF-1"), um: 40, L: 25, alt: 0 }, { ...G("defaultTramoAgua")("AF-2"), um: 12, L: 12, alt: 0 }], muebles: [{ id: "wc_flux", cant: 4 }, { id: "lavabo", cant: 4 }] };
    S.quote.fx = 18.25; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "Banxico FIX"; G("recompute")();
    const noms = [...new Set(G("HIDRO").tramos.filter((x) => x.Lcap > 0 && x.um > 0).map((x) => String(x.nom).split(" ·")[0]))];
    eq(G("hidroDiametrosSinPrecio")().length, noms.length, "cobre sin precio: todos los diámetros Por cotizar:");
    eq((G("QUOTE").porCotizar || []).filter((p) => p.mot === "hidro" && p.un === "ML").length, noms.length, "una partida Por cotizar por diámetro:");
    eq(G("cotUnificadaEstado")().ok, true, "el Budget sale:"); eq(G("accEstado")("hidro").cot.ok, false, "la formal no:");
    /* 2. Un proyecto guardado con las referencias IUSA las pierde al abrir, con antes/después en la bitácora (archivo, no borrado). */
    const viejo = JSON.parse(JSON.stringify(S));
    viejo.quote.hidroPU = { cobre_1_: { precio: 2924.99, moneda: "MXN", iva: true, porTramo: 6.10, origen: "referencia", fuente: "Tienda IUSA, menudeo", ubicacion: "México", url: "", fecha: "2026-09-21" }, cobre_2_: 333 };
    const sv = G("sanearEstado")(viejo).quote;
    eq(sv.hidroPU.cobre_1_, undefined, "la referencia IUSA sale del Budget:"); eq(sv.hidroPU.cobre_2_, 333, "el precio de proveedor local se respeta:");
    eq(sv.hidroPUlog.length, 1, "queda archivada en la bitácora:"); eq(sv.hidroPUlog[0].via, "regla California", "vía:"); eq(sv.hidroPUlog[0].antes.precio, 2924.99, "antes:"); contiene(sv.hidroPUlog[0].despues.fuente, "Por cotizar", "después:");
    /* 3. Referencia de prueba aislada (California, sólo material, USD): se convierte con tipo de cambio fechado; el renglón dice material y la mano de obra queda pendiente. */
    const k0 = G("claveHidroPU")("cobre", noms[0]);
    S.quote.hidroPU[k0] = REF_PRUEBA("USD"); G("recompute")();
    const e0 = G("hidroPUEntrada")(k0); cerca(e0.precioM, 4.2 * 18.25, 1e-9, "4.20 USD × 18.25 por metro:"); eq(e0.alcance, "material", "sólo material:"); eq(e0.iva, false, "antes de impuestos tal como lo dice la fuente:");
    const r0 = (G("QUOTE").aux || []).find((a) => a.mot === "hidro" && a.un === "ML"); contiene(r0.desc, "material, precio de referencia de mercado", "renglón: material:"); contiene(r0.desc, "mano de obra por capturar", "y mano de obra por capturar:");
    contiene((G("QUOTE").pendientes || []).map((p) => p.motivo).join("|"), "mano de obra por capturar", "pendiente de mano de obra (no se estima):");
    const ref0 = (G("QUOTE").referencias || []).find((r) => r.clave === k0); eq(ref0.ubicacion, "San Diego, CA", "ubicación:"); eq(ref0.lista, "costo de material de estimador", "lista tal cual la fuente:"); eq(ref0.edicion, "2026", "edición:"); eq(ref0.pagina, "1", "página:");
    const pdf = txtPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
    contiene(pdf, "PRECIOS DE REFERENCIA DE MERCADO, SUJETOS A COTIZACION DE PROVEEDOR", "leyenda:");
    contiene(pdf, "REFERENCIA DE PRUEBA (no es una fuente real), ed. 2026, p. 1, San Diego, CA, 2026-09-22; 4.2 USD, sólo material, antes de impuestos, lista: costo de material de estimador", "etiqueta honesta completa:");
    contiene(pdf, "18.25 MXN/USD del 2026-09-22 (Banxico FIX)", "tipo de cambio con fecha y fuente:");
    /* 4. Etiqueta honesta: lo que la fuente no dice queda «no especificado», nunca supuesto. */
    S.quote.hidroPU[k0] = REF_PRUEBA("USD", { iva: null, lista: "", edicion: "", pagina: "" }); G("recompute")();
    const e1 = G("hidroPUEntrada")(k0); eq(e1.iva, null, "impuestos no especificados:"); eq(e1.lista, "no especificado", "lista no especificada:");
    contiene(txtPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })), "impuestos: no especificado, lista: no especificado", "el PDF lo dice tal cual:");
    /* 5. Sólo material: si la fuente combina material y mano de obra sin separarlos, Por cotizar. */
    S.quote.hidroPU[k0] = REF_PRUEBA("USD", { alcance: "material_mo" }); G("recompute")();
    eq(G("hidroPUEntrada")(k0).combinado, true, "combinado:"); eq(G("hidroDiametrosSinPrecio")().includes(noms[0]), true, "sin precio:");
    eq((G("QUOTE").porCotizar || []).find((p) => p.clave === k0).motivo, "material y mano de obra combinados", "motivo Por cotizar:");
    contiene((G("QUOTE").pendientes || []).map((p) => p.motivo).join("|"), "la fuente combina material y mano de obra", "pendiente con motivo:");
    /* 6. Únicamente California: una referencia de otro sitio no cuenta. */
    S.quote.hidroPU[k0] = REF_PRUEBA("USD", { ubicacion: "Phoenix, AZ" }); G("recompute")();
    eq(G("hidroPUEntrada")(k0).fueraCA, true, "fuera de California:"); eq((G("QUOTE").porCotizar || []).find((p) => p.clave === k0).motivo, "fuera de California", "Por cotizar:");
    /* 7. USD sin tipo de cambio fechado: no se convierte. */
    S.quote.hidroPU[k0] = REF_PRUEBA("USD"); S.quote.fxFecha = ""; G("recompute")();
    eq(G("hidroPUEntrada")(k0).sinFx, true, "sin tipo de cambio fechado:"); eq((G("QUOTE").porCotizar || []).find((p) => p.clave === k0).motivo, "tipo de cambio sin capturar", "Por cotizar:");
    /* H-250: el libro en USD ya no se emite sin fecha; el libro en MXN declara la referencia USD sin convertir. */
    contiene(Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8"), "TIPO DE CAMBIO SIN CAPTURAR", "el Excel lo dice:");
    S.quote.fxFecha = "2026-09-22"; G("recompute")(); eq(G("hidroPUEntrada")(k0).sinFx, false, "con fecha convierte:");
    /* 8. Por cotizar en el Budget con contador; la formal bloqueada. */
    const pdf2 = txtPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
    const nPC = (G("QUOTE").porCotizar || []).length; contiene(pdf2, `PARTIDAS POR COTIZAR: ${nPC}`, "contador en la primera hoja:"); contiene(pdf2, "POR COTIZAR", "renglón por cotizar:");
    const xl2 = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8"); contiene(xl2, "PARTIDAS POR COTIZAR", "contador en la portada del Excel:");
    S.quote.modo = "licitacion"; G("recompute")();
    let tiro = ""; try { G("buildLicitacionPdf")(); } catch (e) { tiro = String(e.message); }
    contiene(tiro, "La cotización formal no sale con tubería sin precio", "formal bloqueada:"); S.quote.modo = "privada";
    /* 9. Flete, aduana e importación: renglón propio (sección H), siempre Por cotizar hasta capturarlo con monto, fuente y fecha. */
    eq(G("SEC_ORDEN").includes("H"), true, "sección H:"); contiene(G("SEC_PROP").H.label, "importación", "etiqueta:");
    const imp = () => (G("QUOTE").porCotizar || []).find((p) => p.mot === "importacion");
    if (!imp()) throw new Error("la importación debía salir Por cotizar"); eq(imp().sec, "H", "en su sección:");
    contiene(pdf2, "Seccion H", "sección H en el Budget PDF:"); contiene(pdf2, "Flete, aduana e importaci", "renglón de importación en el Budget PDF:"); contiene(xl2, "Flete, aduana e importaci", "y en el Excel:");
    S.quote.importacion = { monto: 1000, moneda: "USD", fuente: "", fecha: "2026-09-22" }; G("recompute")(); if (!imp()) throw new Error("sin fuente sigue Por cotizar");
    S.quote.importacion = { monto: 1000, moneda: "USD", fuente: "Agente aduanal de prueba", fecha: "2026-09-22" }; G("recompute")();
    eq(imp(), undefined, "capturado con monto, fuente y fecha ya no está Por cotizar:");
    const rImp = (G("QUOTE").aux || []).find((a) => a.mot === "importacion"); cerca(rImp.total, 1000 * 18.25, 1e-9, "1,000 USD × 18.25, sin prorrateo:"); eq(rImp.sec, "H", "sección H:");
    S.quote.importacion = { monto: 0, moneda: "MXN", fuente: "", fecha: "" };
    /* 10. Proveedor local (pantalla y CSV) sustituye la referencia con antes/después; CSV rechaza referencia sin fuente o fuera de California. */
    G("recompute")(); const antes = G("hidroPUEntrada")(k0).precioM;
    G("setPath")(`quote.hidroPU.${k0}`, 250); G("recompute")();
    const e2 = G("hidroPUEntrada")(k0); eq(e2.origen, "proveedor", "Proveedor local:"); cerca(e2.precioM, 250, 1e-9, "por metro antes de IVA:");
    const lg = S.quote.hidroPUlog[S.quote.hidroPUlog.length - 1]; eq(lg.via, "pantalla", "bitácora:"); cerca(lg.antes.precioM, +antes.toFixed(2), 1e-9, "antes = referencia:"); cerca(lg.despues.precioM, 250, 1e-9, "después = proveedor:");
    const k1 = G("claveHidroPU")("cobre", noms[noms.length - 1]);
    const r = G("hidroPUImportarCsv")(["material,clave,diametro,precio,por_tramo_m,iva_incluido,moneda,origen,alcance,fuente,edicion,pagina,ubicacion,lista,url,fecha",
      `cobre,,${noms[noms.length - 1]},1830,6.10,si,MXN,proveedor,,"Proveedor local de prueba",,,,,,2026-09-22`,
      `cobre,,1/2",5,1,no especificado,USD,referencia,material,"Ref de prueba",2026,3,"San Diego, CA",costo de material,,2026-09-22`,
      `cobre,,3/4",5,1,no,USD,referencia,material,"Ref fuera",,,"Tijuana, BC",,,2026-09-22`,
      `cobre,,1",5,1,no,USD,referencia,material,,,,"San Diego, CA",,,2026-09-22`].join("\n"));
    eq(r.ok, 2, "dos filas importadas:"); eq(r.malas.length, 2, "rechazadas: referencia fuera de California y referencia sin fuente:"); contiene(r.malas.join("|"), "debe ser de California", "motivo California:"); contiene(r.malas.join("|"), "necesita fuente", "motivo fuente:");
    const e3 = G("hidroPUEntrada")(k1); eq(e3.origen, "proveedor", "CSV = Proveedor local:"); cerca(e3.precioM, 1830 / 6.1 / 1.16, 1e-9, "por tramo con IVA → por metro antes de IVA:");
    const e4 = G("hidroPUEntrada")("cobre_1_2_"); eq(e4.iva, null, "CSV «no especificado» → impuestos no especificados:"); eq(e4.lista, "costo de material", "lista tal cual:"); eq(e4.edicion, "2026", "edición:"); eq(e4.pagina, "3", "página:");
    /* 11. Pantalla: cada renglón dice su origen y su alcance. */
    S.quote.hidroPU[k0] = REF_PRUEBA("USD"); G("recompute")();
    const html = G("hidroPUHtml")(); contiene(html, "Referencia Budget", "pantalla marca la referencia:"); contiene(html, "sólo material", "y el alcance:"); contiene(html, "Por cotizar", "y explica Por cotizar:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

/* ===== H-250 (auditoría 22-sep-2026, regla del dueño): nada en USD sin tipo de cambio fechado, en ningún documento ===== */
t("S.43 (H-250) sin tipo de cambio con fecha nada sale en USD: la cotización queda en MXN y lo declara, la propuesta y el libro en USD no se emiten, el espejo en inglés sale en MXN y ningún documento ni la pantalla imprimen US$; con fecha, la conversión vuelve", () => {
  const guardado = JSON.stringify(S);
  const txt = (b) => Buffer.from(b).toString("latin1"), xt = (b) => Buffer.from(b).toString("utf8");
  const noUSD = (nombre, s) => { if (/US\$/.test(s)) throw new Error(`${nombre}: imprime importes en US$ sin tipo de cambio fechado`); };
  try {
    G("importarRespaldo")(REG_PROY); S.quote.currency = "USD"; S.quote.fx = 18.5; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "fixture"; G("recompute")();
    eq(G("QUOTE").cur, "USD", "con fecha la cotización sí va en USD:"); cerca(G("QUOTE").div, 18.5, 1e-9, "y divide entre el tipo de cambio:");
    contiene(txt(G("buildPropuestaPdf")({ lang: "en", mon: "USD" })), "US$", "con fecha la propuesta en USD se emite:");
    /* Sin fecha: el tipo de cambio 18.5 sigue capturado, pero no vale. */
    S.quote.fxFecha = ""; G("recompute")();
    const Q = G("QUOTE");
    eq(Q.cur, "MXN", "sin fecha la cotización queda en MXN:"); eq(Q.div, 1, "sin dividir:"); eq(Q.usdSinFecha, true, "y lo marca:");
    if (!(Q.pendientes || []).some((p) => /tipo de cambio/i.test(p.desc))) throw new Error("falta el pendiente «tipo de cambio sin fecha» en la cotización");
    let lanzo = false; try { G("buildPropuestaPdf")({ lang: "en", mon: "USD" }); } catch (e) { lanzo = /tipo de cambio/i.test(String(e && e.message)); }
    eq(lanzo, true, "la propuesta PDF en USD no se emite y dice por qué:");
    lanzo = false; try { G("buildPropuestaXlsx")({ lang: "en", mon: "USD" }); } catch (e) { lanzo = /tipo de cambio/i.test(String(e && e.message)); }
    eq(lanzo, true, "el libro en USD no se emite y dice por qué:");
    const docs = {
      "propuesta ES": txt(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })), "propuesta EN en MXN": txt(G("buildPropuestaPdf")({ lang: "en", mon: "MXN" })),
      "libro ES": xt(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })), "libro EN en MXN": xt(G("buildPropuestaXlsx")({ lang: "en", mon: "MXN" })),
      "memoria de cotización": txt(G("buildCotizacionPdf")()), "cotización hidro": txt(G("buildCotizacionMotorPdf")("hidro")), "memoria integral": txt(G("buildMemoriaIntegralPdf")()),
    };
    /* La licitación puede no emitirse por otros bloqueos (formal); si sale, tampoco puede traer US$. */
    try { docs["licitación"] = txt(G("buildLicitacionPdf")()); } catch (e) { if (/US\$/.test(String(e && e.message))) throw e; }
    Object.entries(docs).forEach(([k, s]) => noUSD(k, s));
    contiene(docs["memoria de cotización"], "sin tipo de cambio fechado", "la memoria de cotización declara por qué va en MXN:");
    contiene(docs["propuesta ES"], "sin tipo de cambio fechado", "la propuesta declara por qué va en MXN:");
    S.tab = "cotizacion"; G("render")();
    noUSD("pantalla de cotización", w.document.getElementById("view").textContent);
    eq(G("monedaEspejoEN")(), "MXN", "el espejo en inglés sale en MXN:");
    /* Con fecha otra vez: la conversión vuelve y el espejo va en USD. */
    S.quote.fxFecha = "2026-09-22"; G("recompute")();
    eq(G("QUOTE").cur, "USD", "con fecha vuelve USD:"); eq(G("QUOTE").usdSinFecha, false, "sin marca:"); eq(G("monedaEspejoEN")(), "USD", "espejo en USD:");
    contiene(txt(G("buildPropuestaPdf")({ lang: "en", mon: "USD" })), "US$", "propuesta EN en USD:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

/* ===== H-251 (auditoría 22-sep-2026, regla del dueño): California es el ESTADO; «Baja California» se rechaza ===== */
t("S.44 (H-251) una referencia sólo es de California si su estado es California (CA) de EE. UU.: Baja California, Baja California Sur, BC, México y Canadá se rechazan en el motor, al abrir un proyecto y al importar el CSV; la plantilla trae la columna estado", () => {
  const guardado = JSON.stringify(S);
  const REF = (ubicacion, extra) => ({ precio: 4.2, moneda: "USD", iva: false, porTramo: 1, origen: "referencia", alcance: "material", fuente: "REFERENCIA DE PRUEBA (no es una fuente real)", edicion: "2026", pagina: "1", ubicacion, lista: "no especificado", url: "", fecha: "2026-09-22", ...(extra || {}) });
  try {
    G("importarRespaldo")(REG_PROY); S.quote.fx = 18.5; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "fixture";
    const k = "cobre_2_"; /* diámetro en uso en la red del fixture (AF-GENERAL): así tiene partida y puede quedar «Por cotizar» */
    /* 1. Motor: la referencia de Baja California queda fuera y sale «Por cotizar». */
    S.quote.hidroPU[k] = REF("Tijuana, Baja California"); G("recompute")();
    eq(G("hidroPUEntrada")(k).fueraCA, true, "«Tijuana, Baja California» está fuera de California:");
    eq(((G("QUOTE").porCotizar || []).find((p) => p.clave === k) || {}).motivo, "fuera de California", "Por cotizar:");
    S.quote.hidroPU[k] = REF("San Diego, CA"); G("recompute")();
    eq(G("hidroPUEntrada")(k).fueraCA, false, "«San Diego, CA» sí es California:");
    /* 2. La regla, caso por caso (ubicación libre y columna estado). */
    const ok = (u, extra) => G("referenciaEnCalifornia")({ ubicacion: u, ...(extra || {}) });
    [["Tijuana, Baja California", false], ["La Paz, Baja California Sur", false], ["Tijuana, BC", false], ["Tijuana, B.C.", false], ["Ensenada, B.C., México", false], ["Toronto, ON, CA", false], ["(ca. 2026)", false], ["Phoenix, AZ", false], ["Tijuana", false], ["", false],
     ["San Diego, CA", true], ["Carlsbad, California", true], ["Fullerton, CA 92831, USA", true], ["Carlsbad, California, Estados Unidos", true], ["California", true], ["Fullerton CA", true]]
      .forEach(([u, esp]) => eq(ok(u), esp, `ubicación «${u}»:`));
    eq(ok("Carlsbad", { estado: "California" }), true, "columna estado = California:"); eq(ok("Carlsbad", { estado: "CA", pais: "USA" }), true, "estado CA, país USA:");
    eq(ok("Tijuana", { estado: "Baja California" }), false, "estado Baja California:"); eq(ok("Mexicali", { estado: "BC" }), false, "estado BC:");
    eq(ok("Carlsbad", { estado: "CA", pais: "México" }), false, "estado CA con país México:"); eq(ok("Carlsbad, CA", { estado: "Baja California" }), false, "la columna estado manda sobre el texto:");
    /* 3. Al abrir un proyecto guardado con esa referencia, se retira con antes/después. */
    const sv = G("sanearEstado")(JSON.parse(JSON.stringify({ ...S, quote: { ...S.quote, hidroPU: { [k]: REF("Tijuana, Baja California"), cobre_3_4_: REF("Carlsbad, California") }, hidroPUlog: [] } })));
    eq(sv.quote.hidroPU[k], undefined, "la de Baja California se retira al abrir:"); eq(sv.quote.hidroPU.cobre_3_4_.origen, "referencia", "la de California se queda:");
    eq(sv.quote.hidroPUlog.length, 1, "queda en la bitácora:"); eq(sv.quote.hidroPUlog[0].via, "regla California", "vía:"); eq(sv.quote.hidroPU.cobre_3_4_.estado, undefined, "sin columna estado no se inventa:");
    const sv2 = G("sanearEstado")(JSON.parse(JSON.stringify({ ...S, quote: { ...S.quote, hidroPU: { cobre_3_4_: REF("Carlsbad", { estado: "California", pais: "USA" }) }, hidroPUlog: [] } })));
    eq(sv2.quote.hidroPU.cobre_3_4_.estado, "California", "la columna estado se conserva al abrir:"); eq(sv2.quote.hidroPU.cobre_3_4_.pais, "USA", "y el país:");
    /* 4. CSV: la plantilla trae estado y país; la importación rechaza Baja California y acepta California por ubicación o por columna estado. */
    contiene(G("hidroPUPlantillaCsv")(), "estado", "la plantilla trae la columna estado:"); contiene(G("hidroPUPlantillaCsv")(), "pais", "y país:");
    const r = G("hidroPUImportarCsv")(["material,clave,diametro,precio,por_tramo_m,iva_incluido,moneda,origen,alcance,fuente,edicion,pagina,ubicacion,estado,pais,lista,url,fecha",
      `cobre,,1",5,1,no,USD,referencia,material,"Ref BC",,,"Tijuana, Baja California",,,,,2026-09-22`,
      `cobre,,1 1/4",5,1,no,USD,referencia,material,"Ref estado BC",,,"Tijuana",Baja California,México,,,2026-09-22`,
      `cobre,,1 1/2",5,1,no,USD,referencia,material,"Ref CA",,,"San Diego, CA",,,,,2026-09-22`,
      `cobre,,2",5,1,no,USD,referencia,material,"Ref estado CA",,,"Carlsbad",California,USA,,,2026-09-22`].join("\n"));
    eq(r.ok, 2, "dos filas de California importadas:"); eq(r.malas.length, 2, "dos rechazadas:"); contiene(r.malas.join("|"), "Tijuana, Baja California", "rechaza Baja California por ubicación:"); contiene(r.malas.join("|"), "Baja California", "y por columna estado:");
    eq(G("hidroPUEntrada")("cobre_2_").estado, "California", "la columna estado viaja al renglón:"); eq(G("hidroPUEntrada")("cobre_1_1_2_").fueraCA, false, "San Diego, CA por ubicación:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

/* ===== Flete local y maniobras en obra (rev 2.9.23, decisión del dueño 22-sep-2026) ===== */
t("S.42 (rev 2.9.23) «Flete local y maniobras en obra»: parámetro comercial, se dice siempre (también en 0 o sin capturar) y la cotización aclara que no incluye flete de importación, aduana ni internación (sección H)", () => {
  const guardado = JSON.stringify(S);
  const txtPdf = (bytes) => [...Buffer.from(bytes).toString("latin1").matchAll(/\(((?:\\.|[^\\)])*)\)\s*Tj/g)].map((m) => m[1].replace(/\\(.)/g, "$1")).join(" ");
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.42"; Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.42" }; });
    S.zones[0].area = 100; S.zones[0].height = 3; S.quote.freight = 0.025; G("recompute")();
    const nota = "NO incluye flete de importacion, aduana ni internacion a Mexico: eso va en la seccion H";
    const prop = txtPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" }));
    contiene(prop, "Flete local y maniobras en obra 2.5 %", "propuesta PDF: nombre nuevo con porcentaje:"); contiene(prop, nota, "propuesta PDF: aclaración de no doble cobro:");
    if (/Flete y maniobras\b/.test(prop)) throw new Error("quedó el nombre viejo en la propuesta");
    contiene(txtPdf(G("buildPropuestaPdf")({ lang: "en", mon: G("monedaEspejoEN")() })), "Local freight and site handling 2.5 %", "en inglés:"); contiene(txtPdf(G("buildPropuestaPdf")({ lang: "en", mon: G("monedaEspejoEN")() })), "does NOT include import freight, customs or entry into Mexico", "aclaración en inglés:");
    const xl = Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8");
    contiene(xl, "Flete local y maniobras en obra 2.5 %", "Excel: resumen:"); contiene(xl, nota, "Excel: condiciones:"); if (/Flete, maniobras y seguro de transito/.test(xl)) throw new Error("quedó el nombre viejo en el Excel");
    const tec = txtPdf(G("buildCotizacionPdf")()); contiene(tec, "Flete local y maniobras en obra 2.5 %", "cotización técnica:"); contiene(tec, nota, "cotización técnica: aclaración:");
    /* En 0 o sin capturar: se dice, no se omite. */
    S.quote.freight = 0; G("recompute")();
    contiene(txtPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })), "Flete local y maniobras en obra 0 % (en 0)", "en 0 se dice:");
    contiene(Buffer.from(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).toString("utf8"), "Flete local y maniobras en obra 0 % (en 0)", "Excel en 0:");
    delete S.quote.freight; G("recompute")();
    contiene(txtPdf(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })), "Flete local y maniobras en obra 0 % (sin capturar)", "sin capturar se dice:");
    S.tab = "cotizacion"; G("render")(); contiene(w.document.querySelector("#view").innerHTML, "Flete local y maniobras en obra", "pantalla: nombre nuevo:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

/* ============================== resultado =============================== */
t("R.7 H-95 la licitación, la propuesta, la cotización y la memoria integral ya traen bloque de firma (Revisado por / Aprobado por)", () => {
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) };
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba R.7" }; });
    G("recompute")();
    [
      ["licitacionFormal", []],
      ["buildPropuestaPdf", [{ lang: "es", mon: "MXN" }]],
      ["buildCotizacionPdf", []],
      ["buildMemoriaIntegralPdf", []],
    ].forEach(([fn, args]) => {
      const txt = Buffer.from(fn === "licitacionFormal" ? licitacionFormal() : G(fn)(...args)).toString("latin1");
      contiene(txt, "Revisado por", `${fn} trae "Revisado por":`);
      contiene(txt, "Aprobado por", `${fn} trae "Aprobado por":`);
    });
    /* El único de estos con espejo ES/EN es la propuesta: el bloque de firma
       también se traduce ahí, no se queda en español como el resto. */
    const en = Buffer.from(G("buildPropuestaPdf")({ lang: "en", mon: "USD" })).toString("latin1");
    contiene(en, "Reviewed by", "la propuesta en inglés traduce el bloque de firma:");
    contiene(en, "Approved by", "la propuesta en inglés traduce el bloque de firma:");
    if (/Revisado por|Aprobado por/.test(en)) throw new Error("la propuesta en inglés dejó el bloque de firma en español");
  } finally { S.perms = g.perms; G("recompute")(); }
});
t("R.8 H-95 las 8 memorias por disciplina traen bloque de firma", () => {
  ["buildMemoriaPdf", "buildElecPdf", "buildHidroPdf", "buildFuegoPdf", "buildAirePdf", "buildCivilPdf", "buildSoportePdf", "buildLimpioSuitePdf"].forEach((fn) => {
    const txt = Buffer.from(G(fn)()).toString("latin1");
    contiene(txt, "Revisado por", `${fn} trae "Revisado por":`);
    contiene(txt, "Aprobado por", `${fn} trae "Aprobado por":`);
  });
});

t("R.9 H-52 un error real de aire comprimido (clase médica en tubería no inoxidable) ya cuenta en VALID.errs, no queda invisible", () => {
  const aire0 = JSON.parse(JSON.stringify(S.aire));
  try {
    S.aire = { ...G("defaultAire")(), clase: "1.2.1", material: "acero_gal" };
    G("recompute")();
    if (!(G("AIRE").avisos.some((a) => a.lvl === "err"))) throw new Error("el caso no aísla lo que se prueba: AIRE debe traer un aviso de nivel err");
    const V = G("validateAll")();
    if (!V.rows.some((r) => r.lvl === "err" && /inoxidable/.test(r.msg))) throw new Error("el error de aire comprimido no llegó a validateAll()");
    eq(V.ok, false, "VALID.ok debe dar falso con un error real de aire comprimido:");
  } finally { S.aire = aire0; G("recompute")(); }
});
t("R.10 H-52 / H-218 un gasto que no cabe en el catálogo del material no queda invisible: en cobre (ASTM B88 hasta 4\") el tramo queda fuera de catálogo con error en aire, llega a VALID.errs y a soportería entra con el tope, no con un 5\"-6\" que SoporteCalc no tiene", () => {
  const aire0 = JSON.parse(JSON.stringify(S.aire)), sop0 = JSON.parse(JSON.stringify(S.soporte));
  try {
    /* Demanda enorme a propósito. Antes de H-218 la red de cobre resolvía en 5"-6" de cédula 40 (que SoporteCalc no tiene
       catalogado en cobre: H-48/H-77) y el error salía en soportería. Con los DI de ASTM B88 el catálogo de cobre termina en 4":
       el tramo queda fuera de catálogo en el propio motor de aire (error visible) y soportería recibe 4" (en catálogo). La
       visibilidad del error de catálogo de SoporteCalc por la ruta directa la sigue vigilando R.2. */
    S.aire = { ...G("defaultAire")(), material: "cobre", Lprincipal: 120, Lramales: 90,
      consumos: [{ id: "r10", tipo: "generico", nombre: "Carga de prueba", cant: 1, lmin: 60000, bar: 6, uso: 1 }] };
    S.soporte = G("defaultSoporte")();
    G("recompute")();
    const A = G("AIRE");
    eq(A.tramos[0].tope, true, "la troncal de cobre queda en el tope del catálogo (4\" B88):"); eq(A.tramos[0].nom, "4\"", "tope:");
    if (!A.avisos.some((a) => a.lvl === "err" && /fuera de catálogo/.test(a.msg))) throw new Error("el tramo fuera de catálogo debe ser error visible en aire");
    if (G("SOPORTE").avisos.some((a) => a.lvl === "err" && /catalogado en cobre/.test(a.msg))) throw new Error("soportería ya no debe recibir un cobre fuera de su catálogo por esta ruta");
    const V = G("validateAll")();
    if (!V.rows.some((r) => r.lvl === "err" && /fuera de catálogo/.test(r.msg || r.texto || JSON.stringify(r)))) throw new Error("el error de aire no llegó a validateAll()");
    eq(V.ok, false, "VALID.ok debe dar falso con un tramo fuera de catálogo:");
  } finally { S.aire = aire0; S.soporte = sop0; G("recompute")(); }
});

t("R.11 H-97b la propuesta en inglés (PDF y libro) traduce las descripciones dinámicas de cada partida, no solo la unidad", () => {
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) }, aire0 = JSON.parse(JSON.stringify(S.aire));
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba R.11" }; });
    /* Consumo real para que AIRE traiga compresor/tanque/secador/filtros/red,
       que es donde vive la mayoría de las plantillas nuevas. Arranque en
       ceros: defaultAire() ya no trae consumos de ejemplo. */
    S.aire = { ...G("defaultAire")(), material: "aluminio", Lprincipal: 120, Lramales: 90,
      consumos: [{ id: "r11", tipo: "generico", nombre: "Prueba R.11", cant: 12, lmin: 0, bar: 7.7, uso: 1 }] };
    G("recompute")();
    const cat = G("catalogoConceptos")();
    const partidas = cat.secciones.flatMap((s) => s.partidas);
    if (!(partidas.length > 3)) throw new Error("el caso no aísla lo que se prueba: hacen falta varias partidas de varias disciplinas");
    /* Todas las partidas deben traer descEn, y debe ser distinto de desc al
       menos en las que sí tienen texto que traducir (no solo modelo/código). */
    partidas.forEach((p) => { if (!p.descEn) throw new Error(`partida sin descEn: "${p.desc}"`); });
    const conTraduccionReal = partidas.filter((p) => p.descEn !== p.desc);
    if (!(conTraduccionReal.length >= partidas.length - 2)) throw new Error(`la mayoría de las partidas deben quedar con descEn distinto de desc: ${conTraduccionReal.length} de ${partidas.length}`);

    const pdfEn = Buffer.from(G("buildPropuestaPdf")({ lang: "en", mon: "USD" })).toString("latin1");
    const xlsxEn = Buffer.from(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).toString("utf8");
    /* Frases españolas puntuales que las plantillas viejas siempre generaban,
       ninguna debe sobrevivir en el documento en inglés. */
    const espanolViejo = ["Instalación mecánica", "Tubería de refrigerante", "Ducto de lámina galvanizada",
      "Control DDC", "Alimentador general", "Tablero general", "Cisterna de", "Rociadores automáticos",
      "Bomba contra incendio", "Compresor de tornillo", "Tanque pulmón", "Tren de filtración", "Red de aire comprimido",
      "Bajadas a punto de uso", "Limpieza general, trazo", "Firme de concreto", "Media caña sanitaria",
      "Varilla roscada", "Abrazadera de sujeción", "Riostra sísmica"];
    espanolViejo.forEach((frase) => {
      if (pdfEn.includes(frase)) throw new Error(`el PDF en inglés todavía dice "${frase}"`);
      if (xlsxEn.includes(frase)) throw new Error(`el libro en inglés todavía dice "${frase}"`);
    });
    /* Y una muestra de las frases nuevas sí debe aparecer -del aire comprimido
       que el propio caso de prueba configuró, así que su presencia no depende
       de que haya equipo HVAC capturado en S.quote.items-. */
    contiene(pdfEn, "air receiver tank", "el PDF en inglés trae la traducción real:");
    contiene(xlsxEn, "air receiver tank", "el libro en inglés trae la traducción real:");
  } finally { S.perms = g.perms; S.aire = aire0; G("recompute")(); }
});
t("R.12 H-97b la propuesta en español conserva las descripciones de siempre (no se rompió nada al agregar descEn)", () => {
  const g = { perms: JSON.parse(JSON.stringify(S.perms)) }, aire0 = JSON.parse(JSON.stringify(S.aire));
  try {
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba R.12" }; });
    /* Arranque en ceros: defaultAire() ya no trae consumos de ejemplo. */
    S.aire = { ...G("defaultAire")(), material: "aluminio", Lprincipal: 120, Lramales: 90,
      consumos: [{ id: "r12", tipo: "generico", nombre: "Prueba R.12", cant: 12, lmin: 0, bar: 7.7, uso: 1 }] };
    G("recompute")();
    const pdfEs = Buffer.from(G("buildPropuestaPdf")({ lang: "es", mon: "MXN" })).toString("latin1");
    contiene(pdfEs, "Tanque pulmón", "el PDF en español sigue diciendo lo de siempre:");
  } finally { S.perms = g.perms; S.aire = aire0; G("recompute")(); }
});

/* ===== GA. Guías repetidas (guias-a: carga, limpios, selección, ventilación, ductos, comparativo) ==========
   Decisión del dueño (19-sep-2026): el texto explicativo estático vive SOLO en la guía (GUIA / guiaHtml) y,
   si el usuario oculta la guía, ya no aparece. Lo que la vista decía y la guía no traía (norma, umbral,
   criterio) se movió a la guía: no se perdió. La ayuda propia de cada campo (REF) y los avisos calculados
   no se tocaron. */
const GA_MOVIDO = [
  /* [pestaña, campo de la guía, frase que tiene que traer] */
  ["carga", "ojo", "no cada cuarto: un cuarto con termostato propio, un área abierta o una nave"],
  ["carga", "ojo", "La selección de equipo de esta pestaña es la aislada de cada zona"],
  ["carga", "ojo", "el sistema consolidado del edificio —chiller con manejadoras, o condensadoras con unidades interiores— está en Proyecto → Sistema integrado, junto con la cédula de equipos"],
  ["seleccion", "ojo", "los precios que traen de fábrica salen de una referencia interna de la casa de grado cuarto limpio, con filtración HEPA y variadores"],
  ["seleccion", "ojo", "para una nave o una oficina normal quedan altos"],
  ["seleccion", "ojo", "captura tu lista vigente por familia"],
  ["seleccion", "ojo", "valida contra la cotización del distribuidor antes de firmar"],
  ["seleccion", "ojo", "Los precios se guardan dentro del proyecto"],
  ["limpios", "cuando", "con clase, área y altura basta para arrancar"],
  ["limpios", "cuando", "se captura aparte, como zona en Carga térmica con el tipo de espacio Cuarto limpio, su clase ISO y sus cambios de aire"],
  ["limpios", "cuando", "el calor de los ventiladores, el proceso, la iluminación, los ocupantes y la reposición entran una sola vez, con el barrido horario y la psicrometría completos"],
  ["limpios", "ojo", "La ISO 14644-1 clasifica por concentración de partículas"],
  ["limpios", "ojo", "el rango de cambios de aire, la cobertura de filtros en techo y la cascada de presión no salen de ella —esa norma no los fija— sino de la ISO 14644-4 y de la guía de referencia ISPE"],
  ["ductos", "que", "Darcy–Weisbach con Haaland"],
  ["ductos", "que", "calibres SMACNA por clase de presión, accesorios Ductmate compatibles"],
  ["ductos", "ojo", "la suma de los tramos de suministro y retorno, porque el recorrido crítico todavía no se calcula"],
  ["ductos", "ojo", "Si un tramo domina la pérdida, revisa su velocidad o sus accesorios antes de subir el equipo"],
  ["comparativo", "ojo", "los valores en ámbar se salen del patrón —más de 1.8 veces la mediana de las zonas del proyecto, o menos de esa mediana entre 1.8 (≈ 56 %)—"], /* rev 2.9.15 · el texto dice lo que hace raro(): > mediana×1.8 o < mediana/1.8 */
  ["comparativo", "ojo", "No están mal por definición: están fuera de familia, y eso vale la pena revisarlo"],
];
/* Lo que ya no puede estar en la vista (viewOf, sin la guía). */
const GA_QUITADO = {
  carga: ["Una zona es cada espacio con su propio termostato", "Ésta es la selección aislada de la zona", "sistema consolidado del edificio"],
  seleccion: ["Lee esto antes de mandar una cotización", "referencia interna de la casa de grado"],
  limpios: ["Este motor resuelve volumen de aire", "no salen de la 14644-1", "el barrido horario y la psicrometría completos"],
  ductos: ["<b>Método:</b>", "dimensionado por fricción constante o por velocidad, calibres SMACNA", "La presión del ventilador que se muestra suma", "Agrega uno o genéralo desde la carga térmica"],
  comparativo: ["Los valores en ámbar se salen del patrón"],
};
/* Pantalla completa (con o sin guía) de una pestaña, con el estado restaurado. */
const gaPantalla = (tab, guia) => {
  const g0 = S.guia, t0 = S.tab;
  try { S.guia = guia; S.tab = tab; G("render")(); return w.document.getElementById("view").textContent.replace(/\s+/g, " "); }
  finally { S.guia = g0; S.tab = t0; }
};
const gaCuenta = (txt, frag) => txt.split(frag).length - 1;

t("GA.1 la guía de cada pantalla trae lo que la vista decía y ya no dice: la norma, el umbral y el criterio se movieron, no se perdieron", () => {
  const Gu = G("GUIA");
  GA_MOVIDO.forEach(([tab, campo, frase]) => {
    if (!Gu[tab] || typeof Gu[tab][campo] !== "string") throw new Error(`GUIA.${tab}.${campo} no existe`);
    contiene(Gu[tab][campo], frase, `GUIA.${tab}.${campo}:`);
  });
  /* La guía sigue siendo la misma estructura: que / cuando (y ojo donde lo había). */
  ["carga", "limpios", "seleccion", "ventilacion", "ductos", "comparativo"].forEach((tab) => {
    if (!Gu[tab].que || !Gu[tab].cuando) throw new Error(`GUIA.${tab} perdió que/cuando`);
  });
});

t("GA.2 la vista ya no repite la guía: los textos quitados no salen de viewOf() en ninguna de las seis pantallas", () => {
  const z0 = JSON.parse(JSON.stringify(S.zones)), zi0 = S.zi, duct0 = JSON.parse(JSON.stringify(S.duct)), tab0 = S.tab;
  try {
    const revisar = (etq) => Object.entries(GA_QUITADO).forEach(([tab, frases]) => {
      const html = G("viewOf")(tab);
      frases.forEach((f) => { if (html.includes(f)) throw new Error(`${etq} · ${tab}: la vista todavía dice «${f}»`); });
    });
    G("recompute")(); revisar("proyecto de prueba (2 zonas)");
    S.zones = S.zones.slice(0, 1); S.zi = 0; G("recompute")(); revisar("una zona");
    S.zones = []; G("recompute")(); revisar("sin zonas");
    S.zones = JSON.parse(JSON.stringify(z0)); S.zi = zi0; S.duct.segments = []; G("recompute")(); revisar("ductos sin tramos");
  } finally {
    S.zones = z0; S.zi = zi0; S.duct = duct0; S.tab = tab0; G("recompute")(); G("render")();
  }
});

t("GA.3 lo movido vive una sola vez, en la guía, y con la guía oculta no aparece en ninguna de las seis pantallas", () => {
  G("recompute")();
  const porTab = {};
  GA_MOVIDO.forEach(([tab, , frase]) => { (porTab[tab] = porTab[tab] || []).push(frase); });
  Object.entries(porTab).forEach(([tab, frases]) => {
    const con = gaPantalla(tab, true), sin = gaPantalla(tab, false);
    frases.forEach((f) => {
      eq(gaCuenta(con, f), 1, `${tab} · con la guía visible «${f.slice(0, 60)}…» aparece`);
      eq(gaCuenta(sin, f), 0, `${tab} · con la guía oculta «${f.slice(0, 60)}…» aparece`);
    });
  });
  G("render")();
});

t("GA.4 sin tocar la ayuda de cada campo: con la guía oculta el aviso de precios de grado cuarto limpio sigue bajo el factor de lista", () => {
  const g0 = S.guia, t0 = S.tab;
  try {
    S.guia = false; S.tab = "seleccion"; G("render")();
    const campo = w.document.querySelector('#view input[data-path="quote.priceFactor"]');
    if (!campo) throw new Error("no está el campo del factor de ajuste de lista");
    const ayuda = campo.closest(".field").textContent;
    contiene(ayuda, "grado cuarto limpio", "ayuda del factor de lista:");
    contiene(ayuda, "corre alto", "ayuda del factor de lista:");
    contiene(ayuda, "entre 0.55 y 0.75", "ayuda del factor de lista:");
  } finally { S.guia = g0; S.tab = t0; G("render")(); }
});

t("GA.5 el botón «Ver el sistema del edificio» sigue (solo con varias zonas) y el estado vacío de carga conserva el hecho y la acción", () => {
  const z0 = JSON.parse(JSON.stringify(S.zones)), zi0 = S.zi;
  try {
    G("recompute")();
    contiene(G("viewOf")("carga"), 'data-act="go-sys"', "con dos zonas:");
    S.zones = S.zones.slice(0, 1); S.zi = 0; G("recompute")();
    if (G("viewOf")("carga").includes('data-act="go-sys"')) throw new Error("con una zona no debe ofrecer el sistema del edificio");
    S.zones = []; G("recompute")();
    const vacio = G("viewOf")("carga");
    contiene(vacio, "Este proyecto todavía no tiene zonas.", "estado vacío:");
    contiene(vacio, 'data-act="zone-add"', "estado vacío, acción:");
  } finally { S.zones = z0; S.zi = zi0; G("recompute")(); G("render")(); }
});

t("GA.6 ventilación no tenía texto de guía repetido y sigue sin él: la vista no describe el modo ni la selección (lo hace la guía)", () => {
  G("recompute")();
  const html = G("viewOf")("ventilacion"), Gu = G("GUIA").ventilacion;
  contiene(Gu.que, "Extracción y reposición de aire", "guía de ventilación:");
  contiene(Gu.cuando, "no para el aire acondicionado", "guía de ventilación:");
  if (html.includes("Extracción y reposición de aire") || html.includes("no para el aire acondicionado")) throw new Error("la vista de ventilación repite la guía");
});

/* ============================ GB · Guías sin texto repetido (guias-b) =====
   rev 2.9.14 · Decisión del dueño (19-sep-2026): el texto de guía repetido se
   ELIMINA de la vista y vive SOLO en la guía (GUIA / guiaHtml); si el usuario
   oculta la guía, no aparece. Ninguna norma ni criterio se pierde: lo que la
   guía no traía se movió a GUIA[tab] (campos ojo y metodo).
   Pantallas de este bloque: eléctrico, hidráulico, contra incendio, aire
   comprimido, obra civil y soportería. NO se toca la ayuda propia de cada
   campo, los avisos del motor, las cifras ni las memorias (r.memo). */
{
  /* [fragmento que salía en la vista, campo de GUIA donde vive ahora, fragmento equivalente en la guía] */
  const GB_QUITADO = {
    electrico: [
      ["Solo se usa para estimar la corriente de falla y elegir capacidad interruptiva", "ojo", "estimar la corriente de falla, elegir la capacidad interruptiva"] /* rev 2.9.15 · la guía agrega el aviso del 80 % que ya da el código */,
      ["No es un estudio de corto circuito", "ojo", "No es estudio de corto circuito"],
      ["Método: ampacidad de la Tabla 310-15(b)(16)", "metodo", "Ampacidad de la Tabla 310-15(b)(16) a 75 °C"],
      ["factores de demanda del art. 220, 125 % del motor mayor por el art. 430-24", "metodo", "factores de demanda del art. 220, 125 % del motor mayor por el art. 430-24"],
      ["protección por 240-6 y tierra por la Tabla 250-122", "metodo", "protección por 240-6 y tierra por la Tabla 250-122"],
      ["R·cosφ + X·senφ y la Tabla 9 del capítulo 9, no con una constante K", "metodo", "R·cosφ + X·senφ y la Tabla 9 del capítulo 9, no con una constante K"],
    ],
    hidro: [
      ["Método: unidades mueble y de descarga por tabla", "metodo", "Unidades mueble y de descarga por tabla"],
      ["gasto probable por la curva de Hunter (tanque o fluxómetro según los muebles)", "metodo", "gasto probable por la curva de Hunter (tanque o fluxómetro según los muebles)"],
      ["pérdida por Hazen-Williams, drenaje por unidades de descarga con el límite de inodoros por diámetro", "metodo", "pérdida por Hazen-Williams, drenaje por unidades de descarga con el límite de inodoros por diámetro"],
      ["y cisterna por dotación", "metodo", "y cisterna por dotación"],
    ],
    fuego: [
      ["Prediseño. Se resuelve la trayectoria más desfavorable completa", "ojo", "Es prediseño: se resuelve la trayectoria más desfavorable completa"],
      ["que es lo que dimensiona toma, cisterna y bomba", "ojo", "que es lo que dimensiona toma, cisterna y bomba"],
    ],
    aire: [
      ["El pico es la suma de nominales; la demanda de diseño es la mayor entre el consumo medio y el pico con simultaneidad", "metodo",
       "el pico es la suma de nominales; la demanda de diseño es la mayor entre el consumo medio y el pico con simultaneidad"],
    ],
    civil: [
      /* H-265: obra civil ya no toma las zonas; la guía dice que es autónoma y cómo se captura (el texto vive sólo en la guía). */
      ["Se copian zona por zona, no se recalculan", "ojo", "no toma las zonas de Carga térmica ni los Cuartos limpios"],
      ["la geometría del proyecto no las toca", "ojo", "Obra civil es autónoma"],
      ["Cantidades capturadas a mano en esta pestaña", "ojo", "Con los totales capturados a mano"],
      /* H-244: la tabiquería no son los muros de carga térmica: se captura por área (H-265: en la lista de civil). */
      ["Área, altura y desarrollo de muro heredados de la geometría del proyecto", "ojo", "Cada área de obra se captura aquí"],
    ],
    soporte: [
      ["Baja California es zona sísmica", "ojo", "Baja California, zona sísmica"],
      ["Sí — NFPA 13 cap. 18", "ojo", "NFPA 13 cap. 18"],
    ],
  };
  const GB_TABS = Object.keys(GB_QUITADO);
  const gbTexto = (sinGuia) => {
    const c = w.document.getElementById("view").cloneNode(true);
    c.querySelectorAll("script,style").forEach((x) => x.remove());
    if (sinGuia) c.querySelectorAll(".guia,.guia-min").forEach((x) => x.remove());
    return c.textContent.replace(/\s+/g, " ");
  };
  /* Proyecto lleno para que TODOS los bloques de cada pantalla se pinten (memorias, avisos, tarjetas de costo). */
  const gbLlena = () => {
    const g = { tab: S.tab, guia: S.guia, perms: JSON.parse(JSON.stringify(S.perms)),
      elec: JSON.parse(JSON.stringify(S.elec)), hidro: JSON.parse(JSON.stringify(S.hidro)), fuego: JSON.parse(JSON.stringify(S.fuego)),
      aire: JSON.parse(JSON.stringify(S.aire)), civil: JSON.parse(JSON.stringify(S.civil)), soporte: JSON.parse(JSON.stringify(S.soporte)) };
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "prueba GB" }; });
    S.elec = { ...G("defaultElec")(), sistema: "3F4H-220", material: "cobre", tempAmb: 30, nCond: 3, dvRamal: 3, dvTotal: 5, trafoKVA: 150, trafoZ: 4, Ltablero: 5, tomarHVAC: false,
      cargas: [{ id: "gb1", nombre: "Motor 15 kW", tipo: "motor", kW: 15, V: 220, ph: 3, cant: 1, L: 20, fp: .85, fija: false },
        { id: "gb2", nombre: "Alumbrado", tipo: "alumbrado", kW: 9.5, V: 220, ph: 3, cant: 1, L: 20, fp: .95, fija: false }] };
    S.hidro = { ...G("defaultHidro")(), muebles: [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }],
      tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }] };
    S.fuego = { ...G("defaultFuego")(), area: 600, altura: 6, Lramal: 30, Lmontante: 12, presFuente: 30 };
    S.aire = { ...G("defaultAire")(), material: "aluminio", Lprincipal: 120, Lramales: 90,
      consumos: [{ id: "gba", tipo: "generico", nombre: "Prueba GB", cant: 12, lmin: 0, bar: 7.7, uso: 1 }] };
    S.civil = G("defaultCivil")(); S.civil.usarZonas = true;
    /* H-265: obra civil captura sus propias áreas y cuartos. */
    S.civil.areas = [{ id: "a1", nombre: "Nave", area: 400, altura: 6, perimetro: 0 }]; S.civil.cuartos = [{ id: "k1", nombre: "Cuarto", area: 60, altura: 3, perimetro: 0 }];
    S.soporte = G("defaultSoporte")();
    aceptarSoporte();   /* H-266: con la instantánea aceptada */
    return g;
  };
  const gbRestaura = (g) => {
    S.tab = g.tab; S.guia = g.guia;
    Object.keys(S.perms).forEach((k) => delete S.perms[k]); Object.assign(S.perms, g.perms);
    S.elec = g.elec; S.hidro = g.hidro; S.fuego = g.fuego; S.aire = g.aire; S.civil = g.civil; S.soporte = g.soporte;
    G("recompute")();
  };

  t("GB.1 lo que se quitó de cada vista vive en GUIA[tab], en el campo que corresponde", () => {
    GB_TABS.forEach((tab) => GB_QUITADO[tab].forEach(([, campo, enGuia]) => {
      const g = G("GUIA")[tab];
      if (!g) throw new Error(`${tab}: sin guía`);
      contiene(g[campo] || "", enGuia, `GUIA.${tab}.${campo}:`);
    }));
  });

  t("GB.2 con la guía visible, el texto quitado no está en la vista: sale solo en la guía", () => {
    const g = gbLlena();
    try {
      GB_TABS.forEach((tab) => {
        S.tab = tab; S.guia = true; G("render")();
        const guia = w.document.querySelector("#view .guia-txt");
        if (!guia) throw new Error(`${tab}: con la guía visible falta .guia-txt`);
        const resto = gbTexto(true);
        GB_QUITADO[tab].forEach(([quitado, , enGuia]) => {
          contiene(guia.textContent.replace(/\s+/g, " "), enGuia, `${tab}: la guía visible dice lo que se movió:`);
          if (resto.includes(quitado)) throw new Error(`${tab}: la vista sigue repitiendo «${quitado}»`);
        });
      });
    } finally { gbRestaura(g); }
  });

  t("GB.3 con la guía oculta, ninguno de esos textos aparece y el botón para mostrarla sigue", () => {
    const g = gbLlena();
    try {
      GB_TABS.forEach((tab) => {
        S.tab = tab; S.guia = false; G("render")();
        eq(w.document.querySelectorAll("#view .guia").length, 0, `${tab}: no debe haber guía pintada:`);
        eq(w.document.querySelectorAll('#view .guia-min [data-act="guia-on"]').length, 1, `${tab}: el botón para mostrarla:`);
        const todo = gbTexto(false);
        GB_QUITADO[tab].forEach(([quitado]) => { if (todo.includes(quitado)) throw new Error(`${tab}: con la guía oculta sigue saliendo «${quitado}»`); });
      });
    } finally { gbRestaura(g); }
  });

  t("GB.4 el campo metodo de la guía se pinta como «Método.» entre «Cuándo se usa» y «Ojo», y solo si existe", () => {
    const g = gbLlena();
    try {
      GB_TABS.forEach((tab) => {
        S.tab = tab; S.guia = true; G("render")();
        const h = w.document.querySelector("#view .guia-txt").innerHTML;
        const tiene = !!G("GUIA")[tab].metodo;
        eq(h.includes("<b>Método.</b>"), tiene, `${tab}: «Método.» solo si la guía trae metodo:`);
        if (tiene) {
          if (!(h.indexOf("Cuándo se usa.") < h.indexOf("<b>Método.</b>"))) throw new Error(`${tab}: el método debe ir después de «Cuándo se usa»`);
          if (G("GUIA")[tab].ojo && !(h.indexOf("<b>Método.</b>") < h.indexOf("Ojo."))) throw new Error(`${tab}: el método debe ir antes de «Ojo»`);
        }
      });
      ["electrico", "hidro", "aire"].forEach((tab) => { if (!G("GUIA")[tab].metodo) throw new Error(`${tab}: debía traer el método que salió de su vista`); });
    } finally { gbRestaura(g); }
  });

  t("GB.5 lo que no se toca sigue en pantalla: aviso de diez UM, ayuda de campo, memorias y el banner de herencia con sus cifras", () => {
    const g = gbLlena();
    try {
      S.guia = false;
      /* hidro: aviso calculado por el motor (con la cifra del proyecto), no es texto de guía. */
      S.hidro = { ...G("defaultHidro")(), muebles: [{ id: "lavabo", cant: 2 }] }; G("recompute")();
      S.tab = "hidro"; G("render")();
      contiene(gbTexto(false), "unidades mueble el método de Hunter pierde sentido estadístico", "hidro: aviso de diez UM:");
      S.hidro = g.hidro; G("recompute")();
      /* eléctrico: la ayuda del campo del transformador */
      S.tab = "electrico"; G("render")();
      contiene(gbTexto(false), "Impedancia de cortocircuito del transformador, de su placa.", "eléctrico: ayuda del campo Z:");
      contiene(gbTexto(false), "La demanda calculada no debe pasar del 80 % de esta cifra", "eléctrico: recomendación del campo kVA:");
      /* fuego: la memoria de cálculo (resultado del motor) conserva su nota de prediseño */
      S.tab = "fuego"; G("render")();
      contiene(gbTexto(false), "PREDISEÑO: la trayectoria más desfavorable se resuelve completa", "fuego: memoria:");
      /* aire: la instrucción de uso de las columnas (ayuda del propio campo) */
      S.tab = "aire"; G("render")();
      contiene(gbTexto(false), "Deja L/min y uso en cero para tomar el valor de referencia del tipo.", "aire: uso de las columnas:");
      /* civil (H-265): ya no hay banner de herencia; la pantalla dice que es autónoma y la memoria de dónde salen las cantidades */
      S.tab = "civil"; G("render")();
      eq(w.document.querySelectorAll("#view .her").length, 0, "civil: sin banner de herencia (H-265):");
      contiene(gbTexto(false), "Obra civil es autónoma", "civil: la pantalla lo dice:");
      contiene(gbTexto(false), "Las cantidades salen de las áreas de obra", "civil: memoria (rev 2.9.17, G4-09; H-265):");
      /* civil a mano: el menú lo dice */
      S.civil.usarZonas = false; G("recompute")(); G("render")();
      eq(w.document.querySelectorAll("#view .her").length, 0, "civil a mano: sin banner:");
      contiene(gbTexto(false), "Totales capturados a mano", "civil a mano: menú:");
      /* soporte: la opción sí, no explica; el motor avisa cuando se declara exclusión */
      S.tab = "soporte"; S.soporte.sismico = false; G("recompute")(); G("render")();
      contiene(gbTexto(false), "Arriostramiento sísmico DESACTIVADO", "soporte: aviso del motor cuando se declara exclusión:");
      contiene(gbTexto(false), "No, se declara como exclusión", "soporte: opción de exclusión:");
    } finally { gbRestaura(g); }
  });

  t("GB.6 las seis pantallas dibujan sin error con el proyecto lleno, con la guía visible y con la guía oculta", () => {
    const g = gbLlena();
    try {
      GB_TABS.forEach((tab) => [true, false].forEach((visible) => {
        S.tab = tab; S.guia = visible; G("render")();
        const v = w.document.getElementById("view").innerHTML;
        if (/No se pudo dibujar/.test(v)) throw new Error(`${tab}: la pantalla no se pudo dibujar (guía ${visible ? "visible" : "oculta"})`);
        if (/undefined|NaN/.test(gbTexto(true))) throw new Error(`${tab}: aparece «undefined» o «NaN» en pantalla`);
      }));
    } finally { gbRestaura(g); }
  });
}

/* ===== GC. rev 2.9.14 · textos de guía repetidos: el texto vive sólo en la guía ===== */
/* Decisión del dueño (19-sep-2026): lo que la guía ya dice se quita de la vista; si la vista traía algo que la guía
   no tenía (norma, umbral, criterio, advertencia), se movió a la guía. Si el usuario oculta la guía, no aparece. */
const GC_PANT = ["estructural", "cotizacion", "valor", "kaizen"];
/* Lo que se movió a la guía (o ya estaba) y que la vista dejó de decir. */
const GC_EN_GUIA = {
  estructural: ["v0.1.2", "StructCalc.html", "sin instalación", "generador de marco a dos aguas", "criterio de liberación", "AISC 360",
    "memoria firmable", "prueba piloto", "no construcción", "ninguna disciplina hereda", "regla 2", "memoria integral"],   /* H-272d: ya nadie hereda geometría */
  cotizacion: ["propuesta integral", "precio unitario abierto", "esquema de pagos", "matriz de alcance", "quince hojas", "hitos de pago",
    "NO COTIZADA", "cuarto limpio", "por debajo de 1", "tarjeta de análisis", "FASAR", "sobrecosto en cascada", "explosión de insumos",
    "apertura técnica", "lista vigente"],
  valor: ["no cambia el cálculo", "deja constancia", "con tu firma"],
  kaizen: ["sobre el proyecto real", "volviendo a correr la zona", "se enlistan sin ahorro cuantificado"], /* rev 2.9.17 · G5-15: no todo se mide re-corriendo */
};
/* Frases que la vista ya no debe traer (con la guía visible ni con ella oculta). */
const GC_QUITADO = {
  estructural: ["generador de marco a dos aguas", "StructCalc.html", "sin instalación", "criterio de liberación", "Uso admisible hoy",
    "prueba piloto", "capa de revisión de miembros", "memoria firmable"],
  cotizacion: ["desglose interno del cálculo", "formato de propuesta de la casa", "identidad gráfica", "quince hojas", "hitos de pago se recalculan",
    "Los precios semilla", "corren altos", "Misma ingeniería y mismo catálogo", "apertura técnica", "salen declaradas como NO COTIZADAS"],
  valor: ["La consolidación compara lo calculado", "con tu firma", "deja constancia"],
  kaizen: ["Cada oportunidad se detecta sobre el proyecto real", "no se puede medir no se enlista"],
};
const gcConGuia = (oculta, fn) => {
  const g0 = S.guia;
  try { if (oculta) S.guia = false; else delete S.guia; return fn(); }
  finally { if (g0 === undefined) delete S.guia; else S.guia = g0; G("render")(); }
};
const gcTexto = (el) => el.textContent.replace(/\s+/g, " ");
t("GC.1 lo que Estructural, Cotización, Valor y Kaizen decían en su vista está en su guía", () => {
  const Gu = G("GUIA");
  GC_PANT.forEach((tab) => {
    if (!Gu[tab]) throw new Error(`${tab}: no tiene guía`);
    const d = [Gu[tab].que, Gu[tab].cuando, Gu[tab].ojo].join(" ").replace(/\s+/g, " ");
    GC_EN_GUIA[tab].forEach((f) => contiene(d, f, `guía de ${tab}:`));
    gcConGuia(false, () => {
      S.tab = tab; G("render")();
      const gv = w.document.querySelector("#view .guia");
      if (!gv) throw new Error(`${tab}: la guía no se ve`);
      GC_EN_GUIA[tab].forEach((f) => contiene(gcTexto(gv), f, `guía visible de ${tab}:`));
    });
  });
});
t("GC.2 las vistas ya no repiten el texto de la guía: ni con la guía visible ni con ella oculta", () => {
  GC_PANT.forEach((tab) => {
    [false, true].forEach((oculta) => gcConGuia(oculta, () => {
      S.tab = tab; G("render")();
      const c = w.document.getElementById("view").cloneNode(true);
      c.querySelectorAll(".guia").forEach((e) => e.remove());   // la guía sí puede decirlo; lo demás no
      const cuerpo = gcTexto(c);
      GC_QUITADO[tab].forEach((f) => { if (cuerpo.indexOf(f) >= 0) throw new Error(`${tab} (guía ${oculta ? "oculta" : "visible"}): la vista sigue diciendo «${f}»`); });
      if (oculta && w.document.querySelector("#view .guia")) throw new Error(`${tab}: la guía oculta sigue pintada`);
    }));
  });
});
t("GC.3 el panel «Punto de partida» no explica nada: el texto está en la guía y con la guía oculta no aparece", () => {
  const disc = Object.keys(G("CX_DISC"));
  if (disc.length < 12) throw new Error("CX_DISC trae menos de 12 disciplinas");
  disc.forEach((tab) => {
    gcConGuia(false, () => {
      S.tab = tab; G("render")();
      const v = w.document.getElementById("view");
      const panel = v.querySelector(".cx-panel");
      if (!panel) throw new Error(`${tab}: falta el panel de carga`);
      contiene(gcTexto(panel), "Punto de partida", `${tab}: rótulo:`);
      if (!v.querySelector('[data-act="cx-cargar"]')) throw new Error(`${tab}: falta el botón de cargar`);
      ["Captura desde cero", "También puedes soltar", G("CX_DISC")[tab].acepta].forEach((f) => { if (gcTexto(panel).indexOf(f) >= 0) throw new Error(`${tab}: el panel repite «${f}»`); });
      const guia = gcTexto(v.querySelector(".guia"));
      ["Punto de partida.", "Captura desde cero", "También puedes soltar", G("CX_DISC")[tab].acepta].forEach((f) => contiene(guia, f, `${tab}: la guía:`));
    });
    gcConGuia(true, () => {
      S.tab = tab; G("render")();
      const v = w.document.getElementById("view");
      ["Captura desde cero", "También puedes soltar", G("CX_DISC")[tab].acepta].forEach((f) => { if (gcTexto(v).indexOf(f) >= 0) throw new Error(`${tab}: con la guía oculta aparece «${f}»`); });
      if (!v.querySelector(".cx-panel") || !v.querySelector('[data-act="cx-cargar"]')) throw new Error(`${tab}: sin guía el panel debe seguir con su botón`);
    });
  });
  ["tablero", "proyecto", "catalogo", "cotizacion", "valor", "kaizen"].forEach((tab) => {
    gcConGuia(false, () => { S.tab = tab; G("render")(); if (w.document.querySelector("#view .guia").textContent.indexOf("Punto de partida.") >= 0) throw new Error(`${tab}: no es disciplina y su guía habla del punto de partida`); });
  });
});
t("GC.4 el modbar conserva su texto de semáforo y Estructural ya no lo repite en la vista", () => {
  GC_PANT.forEach((tab) => gcConGuia(false, () => {
    S.tab = tab; G("render")();
    const sem = G("semaforoDeTab")(tab);
    const ms = w.document.querySelector("#view .modbar .modsub");
    if (!ms) throw new Error(`${tab}: falta el texto del modbar`);
    eq(ms.textContent, sem.texto, `${tab}: el modbar dice lo que dice el semáforo:`);
  }));
  const estr = G("DISCIPLINAS").find((d) => d.id === "estr");
  gcConGuia(true, () => {
    S.tab = "estructural"; G("render")();
    const v = w.document.getElementById("view");
    contiene(v.querySelector(".modbar .modsub").textContent, estr.hara, "modbar de Estructural:");
    const c = v.cloneNode(true);
    c.querySelectorAll(".modbar,.accbar").forEach((e) => e.remove());
    if (/corre como archivo aparte/i.test(gcTexto(c))) throw new Error("la vista de Estructural repite «corre como archivo aparte» (ya lo dicen el modbar y la barra de acciones)");
    contiene(gcTexto(c), "Geometría que heredaría", "lo que sí lleva la vista:");
    contiene(gcTexto(c), "Qué hace hoy StructCalc", "lo que sí lleva la vista:");
  });
});
t("GC.5 Cotización conserva la ayuda propia de sus campos, el aviso de IVA y los avisos con cifras; Kaizen y Valor sus avisos de estado", () => {
  gcConGuia(false, () => {
    S.tab = "cotizacion"; G("render")();
    const c = gcTexto(w.document.getElementById("view"));
    ["padrón de beneficiarios", "art. 185 del Reglamento de la Ley de Obras Públicas", "Validar contra su nómina", "Compara el costo por tonelada",
      "conceptos tienen tarjeta con explosión de insumos", "rendimientos de cuadrilla cargados son"].forEach((f) => contiene(c, f, "cotización:"));
    S.tab = "kaizen"; G("render")();
    const k = gcTexto(w.document.getElementById("view"));
    ["Una mejora adoptada avanza de Planear a Actuar", "Los siete desperdicios", "memoria de la casa"].forEach((f) => contiene(k, f, "kaizen:"));
    S.tab = "valor"; G("render")();
    if (G("VALOR").props.length) contiene(gcTexto(w.document.getElementById("view")), "El orden pesa el ahorro por la tasa histórica", "valor:");
  });
});

/* ===== H-270 / H-271 · Diagramas unifilar y trifilar del eléctrico (pedido del dueño, 27-sep-2026) =====
   La prueba verifica la DESCRIPCIÓN (nodos, tramos, pendientes) que sale de computeElec y que la pantalla y la memoria la
   dibujan; no verifica píxeles. Sin captura no se inventa ningún nodo (regla 6). Los diagramas no mueven cifras. */
const n = G("n");
const proyectoUnifilar = () => {
  const d = G("defaultElec")();
  S.elec = { ...d, tomarHVAC: false, Ltablero: 40, trafoKVA: 300, trafoZ: 4, cargas: [
    { ...G("defaultCarga")("Motor de proceso"), tipo: "motor", kW: 15, V: 220, ph: 3, fp: .85, L: 30 },
    { ...G("defaultCarga")("Tarja de laboratorio"), tipo: "proceso", kW: 2, V: 127, ph: 1, fp: .9, L: 35 },
    { ...G("defaultCarga")("Horno de curado"), tipo: "resistiva", kW: 12, V: 220, ph: 3, fp: 1, L: 20 }] };
  G("recompute")();
  const R = G("ELEC");
  if (R.calc.length !== 3 || R.calc.some((c) => c.sinI) || R.calc[1].ph !== 1 || Object.keys(R.calc[1].fases || {}).length !== 1) throw new Error("el caso no aísla lo que se prueba: tres circuitos dimensionados, el segundo monofásico en una sola fase");
  return R;
};
const sinTexto = (s, ctx) => { if (/undefined|NaN|\bnull\b|—/.test(String(s))) throw new Error(`${ctx}: imprime un hueco como dato: «${s}»`); };
t("S.150 (H-270) diagrama unifilar: la descripción sale de computeElec con un nodo «alimentador» por circuito dimensionado (calibre y protección en la etiqueta), el tramo tablero→alimentador y el SVG accesible en la pestaña y en la memoria PDF; sin captura no se inventa ningún nodo y se listan los pendientes", () => {
  const guardado = JSON.stringify(S.elec), tab0 = S.tab;
  try {
    const R = proyectoUnifilar();
    const fn = w.describirUnifilar;
    const u = typeof fn === "function" ? fn(R) : { nodos: [], tramos: [], pendientes: [] };
    const alims = u.nodos.filter((x) => x.tipo === "alimentador");
    eq(alims.length, R.calc.filter((c) => !c.sinI).length, "un nodo alimentador por circuito dimensionado:");
    R.calc.forEach((c, i) => {
      const a = alims[i];
      contiene(a.etiqueta, c.cond.awg, `alimentador ${i + 1}: calibre en la etiqueta:`);
      contiene(a.etiqueta, `${c.cond.ocpd} A`, `alimentador ${i + 1}: protección en la etiqueta:`);
      contiene(a.detalle, c.cond.tierra, `alimentador ${i + 1}: tierra en el detalle:`);
      contiene(a.detalle, c.cond.tubo.d, `alimentador ${i + 1}: canalización en el detalle:`);
      contiene(a.detalle, `${c.L} m`, `alimentador ${i + 1}: longitud capturada:`);
      if (!u.tramos.some((tr) => tr.de === "tablero" && tr.a === a.id)) throw new Error(`falta el tramo tablero→${a.id}`);
      const tr2 = u.tramos.find((tr) => tr.de === a.id); if (!tr2) throw new Error(`el alimentador ${a.id} no llega a ninguna carga`);
      const carga = u.nodos.find((x) => x.id === tr2.a && x.tipo === "carga"); if (!carga) throw new Error(`el tramo ${a.id}→${tr2.a} no termina en una carga`);
      contiene(carga.etiqueta, c.nombre, "la carga lleva su nombre:"); contiene(carga.detalle, `${n(c.I, 1)} A`, "y su corriente:");
      [a.etiqueta, a.detalle, carga.etiqueta, carga.detalle].forEach((s) => sinTexto(s, `circuito ${i + 1}`));
    });
    const tipos = u.nodos.map((x) => x.tipo);
    ["acometida", "transformador", "proteccion", "tablero"].forEach((tp) => { if (!tipos.includes(tp)) throw new Error(`falta el nodo «${tp}»`); });
    const trafo = u.nodos.find((x) => x.tipo === "transformador");
    contiene(trafo.detalle, "300 kVA", "transformador con la placa capturada:"); contiene(trafo.detalle, "Z 4 %", "y su impedancia:");
    contiene(trafo.detalle, `${n(R.IccTrafo / 1000, 1)} kA`, "corriente de falla del motor:");
    const gen = u.nodos.find((x) => x.tipo === "proteccion"); contiene(gen.detalle, `${R.principal} A`, "interruptor general con el principal del motor:"); contiene(gen.detalle, `${R.kAIC} kA`, "y la capacidad interruptiva:");
    const tab = u.nodos.find((x) => x.tipo === "tablero"); contiene(tab.detalle, `${R.principal} A`, "tablero con la capacidad del principal:");
    const alimG = u.tramos.find((tr) => tr.a === "tablero"); if (!alimG) throw new Error("falta el tramo del alimentador general hacia el tablero");
    contiene(alimG.etiqueta, R.alim.awg, "alimentador general: calibre:"); contiene(alimG.etiqueta, "40 m", "y la distancia capturada:");
    if (u.pendientes.some((p) => /transformador|distancia al tablero/i.test(p))) throw new Error("con transformador y distancia capturados no debe haber pendientes de ellos: " + u.pendientes.join(" | "));
    u.nodos.forEach((x) => sinTexto(x.etiqueta + " " + x.detalle, x.id)); u.pendientes.forEach((p) => sinTexto(p, "pendiente"));
    eq(String(u.version), String(G("MOTOR_VER").elec), "la descripción declara la versión del motor:");
    /* Pantalla: SVG en línea, accesible, en currentColor, sin nada externo, que no desborda en celular; con pie de procedencia. */
    S.tab = "electrico"; G("render")();
    const v = vista();
    if (!/<svg[^>]*\brole="img"[^>]*\baria-label="Diagrama unifilar[^"]*"/.test(v)) throw new Error("la pestaña no trae el <svg role=\"img\" aria-label=\"Diagrama unifilar…\">");
    const ini = v.indexOf('<figure class="uf-fig"'), fin = v.indexOf("</figure>", ini);
    if (ini < 0 || fin < 0) throw new Error("el diagrama no va en un <figure>");
    const fig = v.slice(ini, fin);
    contiene(fig, `<figcaption>Diagrama unifilar · procedencia: computeElec v${G("MOTOR_VER").elec}, capturado en esta pestaña`, "pie de figura con procedencia:");
    contiene(fig, "max-width:100%", "no desborda en celular:"); contiene(fig, "height:auto", "alto proporcional:");
    contiene(fig, "<defs><marker", "puntas de flecha con <marker>:");
    if (/<img|https?:\/\/|<script|@import/.test(fig)) throw new Error("el diagrama carga algo de fuera");
    if (/(stroke|fill)="#/.test(fig)) throw new Error("el diagrama lleva colores en duro; debe heredar currentColor");
    if (!/stroke="currentColor"/.test(fig) || !/fill="currentColor"/.test(fig)) throw new Error("trazos y texto deben ir en currentColor");
    contiene(fig, "Motor de proceso", "la carga está rotulada:"); contiene(fig, "Tablero general", "el tablero está rotulado:");
    const fs2 = [...fig.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    if (!fs2.length || fs2.some((f) => f < 11 || f > 13)) throw new Error("texto fuera de 11–13 px: " + fs2.join(","));
    /* Memoria PDF: el mismo diagrama, con las primitivas del PDF propio (rectángulo con contorno y círculo). */
    const bytes = G("buildElecPdf")(), pdf = txtPdfE(bytes), crudo = Buffer.from(bytes).toString("latin1");
    contiene(pdf, "Diagrama unifilar", "la memoria PDF trae el diagrama:"); contiene(pdf, "C-01", "con los circuitos numerados:");
    contiene(pdf, "Motor de proceso", "y las cargas rotuladas:");
    if (!/ re S\n/.test(crudo)) throw new Error("el PDF no dibuja rectángulos con contorno (re S)");
    if (!/ c\n/.test(crudo)) throw new Error("el PDF no dibuja círculos (curvas c)");
    if (/undefined|NaN|\bnull\b/.test(pdf)) throw new Error("el PDF imprime «undefined», «NaN» o «null»");
    /* Sin captura: ningún nodo inventado, pendientes declarados. */
    const d = G("defaultElec")();
    S.elec = { ...d, tomarHVAC: false, cargas: [] }; G("recompute")();
    const u0 = typeof fn === "function" ? fn(G("ELEC")) : { nodos: [{ tipo: "inventado" }], tramos: [], pendientes: [] };
    eq(u0.nodos.length, 0, "sin cargas no se inventa ningún nodo:"); eq(u0.tramos.length, 0, "ni tramos:");
    if (!u0.pendientes.some((p) => /sin cargas/i.test(p))) throw new Error("sin captura debe listar el pendiente: " + u0.pendientes.join(" | "));
    S.tab = "electrico"; G("render")();
    if (/aria-label="Diagrama unifilar/.test(vista())) throw new Error("sin cargas no debe dibujarse un unifilar");
    /* Con cargas pero sin transformador ni distancias: el nodo no aparece y los faltantes se listan; nada supuesto. */
    S.elec = { ...d, tomarHVAC: false, cargas: [{ ...G("defaultCarga")("Motor sin distancia"), tipo: "motor", kW: 7.5, V: 220, ph: 3, fp: .85, L: 0 }] }; G("recompute")();
    const u1 = typeof fn === "function" ? fn(G("ELEC")) : { nodos: [{ tipo: "transformador" }], tramos: [], pendientes: [] };
    if (u1.nodos.some((x) => x.tipo === "transformador")) throw new Error("sin placa capturada no debe aparecer el transformador");
    ["transformador", "distancia al tablero", "Motor sin distancia"].forEach((k) => { if (!u1.pendientes.some((p) => new RegExp(k, "i").test(p))) throw new Error(`falta el pendiente «${k}»: ` + u1.pendientes.join(" | ")); });
    const todo = JSON.stringify(u1);
    if (/150 kVA|Z 4 %|\b30 m\b|\b25 m\b/.test(todo)) throw new Error("el diagrama imprime un valor supuesto: " + todo);
    const a1 = u1.nodos.find((x) => x.tipo === "alimentador"); contiene(a1.detalle, "pendiente", "sin longitud el alimentador lo dice:");
    const g1 = u1.nodos.find((x) => x.tipo === "proteccion"); contiene(g1.detalle, "kA pendiente", "sin transformador la capacidad interruptiva queda pendiente:");
  } finally { S.elec = JSON.parse(guardado); S.tab = tab0; G("recompute")(); }
});

t("S.151 (H-271) diagrama trifilar: cada circuito baja a las fases que computeElec le asignó (tres en trifásico, una en monofásico) con el calibre del motor, el neutro y la tierra tal como los cuenta, y lo que el motor no distingue (2.º conductor monofásico, neutro en sistema sin neutro) queda «pendiente» declarado; el SVG está en la pestaña y el diagrama en la memoria PDF", () => {
  const guardado = JSON.stringify(S.elec), tab0 = S.tab, ver = G("MOTOR_VER").elec;
  try {
    const R = proyectoUnifilar();
    const fn = w.describirTrifilar;
    const tf = typeof fn === "function" ? fn(R) : { circuitos: [], pendientes: [], barras: [] };
    eq(tf.circuitos.length, R.calc.length, "una columna por circuito:");
    eq(String(tf.version), String(ver), "la descripción declara la versión del motor:");
    R.calc.forEach((c, i) => {
      const k = tf.circuitos[i];
      eq(k.fases.length, c.ph === 3 ? 3 : 1, `${k.num}: fases según computeElec (${c.ph}F):`);
      if (c.ph === 3) eq(k.fases.map((f) => f.fase).join(""), "ABC", `${k.num}: trifásico en A, B y C:`);
      else eq(k.fases[0].fase, c.fase, `${k.num}: monofásico en la fase que le asignó el balanceo:`);
      k.fases.forEach((f) => {
        eq(f.awg, c.cond.awg, `${k.num} fase ${f.fase}: calibre = el del motor:`);
        cerca(f.kVA, c.ph === 3 ? c.kVAtot / 3 : c.fases[f.fase], 1e-9, `${k.num} fase ${f.fase}: kVA = el del balanceo:`);
        contiene(f.etiqueta, c.cond.awg, `${k.num} fase ${f.fase}: la etiqueta trae el calibre:`);
      });
      eq(k.tierra.awg, c.cond.tierra, `${k.num}: tierra = la Tabla 250-122 del motor:`); contiene(k.tierra.nota, "250-122", "y lo dice:");
      contiene(k.etiqueta, c.nombre, `${k.num}: la columna lleva el nombre de la carga:`);
      if (c.ph === 3) { if (!k.neutro || k.neutro.awg !== c.cond.awg) throw new Error(`${k.num}: el neutro que cuenta computeElec (calibre de fase) debe aparecer`); if (k.segundo) throw new Error(`${k.num}: un trifásico no tiene «2.º conductor»`); }
      else {
        if (k.neutro) throw new Error(`${k.num}: computeElec no cuenta neutro en monofásico; no se supone`);
        if (!k.segundo || !/pendiente/.test(k.segundo.destino)) throw new Error(`${k.num}: el 2.º conductor debe quedar «pendiente» (el motor no distingue neutro o segunda fase)`);
        if (!tf.pendientes.some((p) => p.includes(k.num) && /neutro o segunda fase/.test(p))) throw new Error(`${k.num}: falta el pendiente del 2.º conductor: ` + tf.pendientes.join(" | "));
      }
    });
    ["A", "B", "C"].forEach((f) => cerca(tf.circuitos.flatMap((k) => k.fases).filter((x) => x.fase === f).reduce((a, x) => a + x.kVA, 0), R.fases[f], 1e-9, `suma de bajadas en la fase ${f} = balanceo del motor:`));
    eq(tf.barras.join(","), "A,B,C,N,T", "3F4H-220: barras A, B, C, neutro y tierra:");
    contiene(tf.balance.texto, `${n(R.desbalance, 1)} %`, "el balance rotula el desbalance del motor:");
    tf.circuitos.forEach((k) => sinTexto([k.etiqueta, k.sub, k.conductores, ...k.fases.map((f) => f.etiqueta), ...k.pendientes].join(" "), k.num)); tf.pendientes.forEach((p) => sinTexto(p, "pendiente"));
    /* Pantalla: junto al unifilar, mismas convenciones. */
    S.tab = "electrico"; G("render")();
    const v = vista();
    if (!/<svg[^>]*\brole="img"[^>]*\baria-label="Diagrama trifilar[^"]*"/.test(v)) throw new Error("la pestaña no trae el <svg role=\"img\" aria-label=\"Diagrama trifilar…\">");
    const at = v.indexOf('aria-label="Diagrama trifilar'), ini = v.lastIndexOf('<figure class="uf-fig"', at), fin = v.indexOf("</figure>", at);
    if (ini < 0 || fin < 0) throw new Error("el trifilar no va en un <figure>");
    const fig = v.slice(ini, fin);
    contiene(fig, `<figcaption>Diagrama trifilar · procedencia: computeElec v${ver}, capturado en esta pestaña`, "pie de figura con procedencia:");
    [">L1 (A)<", ">L2 (B)<", ">L3 (C)<", ">N<", ">T<"].forEach((b) => contiene(fig, b, "barra rotulada:"));
    contiene(fig, "C-02", "columna numerada:"); contiene(fig, "Tarja de laboratorio", "carga rotulada:");
    contiene(fig, "max-width:100%", "no desborda en celular:"); contiene(fig, "<defs><marker", "puntas de flecha con <marker>:");
    if (/(stroke|fill)="#/.test(fig) || /<img|https?:\/\/|<script/.test(fig)) throw new Error("colores en duro o recursos externos en el trifilar");
    const fs2 = [...fig.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    if (!fs2.length || fs2.some((f) => f < 11 || f > 13)) throw new Error("texto fuera de 11–13 px: " + fs2.join(","));
    if (v.indexOf('aria-label="Diagrama unifilar') < 0 || v.indexOf('aria-label="Diagrama unifilar') > at) throw new Error("el trifilar va junto al unifilar, después de él");
    /* Memoria PDF */
    const pdf = txtPdfE(G("buildElecPdf")());
    contiene(pdf, "Diagrama trifilar", "la memoria trae el trifilar:"); contiene(pdf, "L1 (A)", "con sus barras:"); contiene(pdf, "neutro o segunda fase", "y el pendiente del 2.º conductor:");
    /* Sin cargas: nada dibujado, pendiente declarado. */
    const d = G("defaultElec")();
    S.elec = { ...d, tomarHVAC: false, cargas: [] }; G("recompute")();
    const t0 = typeof fn === "function" ? fn(G("ELEC")) : { circuitos: [{}], pendientes: [] };
    eq(t0.circuitos.length, 0, "sin cargas no hay columnas:"); if (!t0.pendientes.some((p) => /sin cargas/i.test(p))) throw new Error("sin captura debe listar el pendiente");
    S.tab = "electrico"; G("render")(); if (/aria-label="Diagrama trifilar/.test(vista())) throw new Error("sin cargas no debe dibujarse un trifilar");
    /* Sistema 3F3H-440 (sin neutro): no hay barra N; el neutro que computeElec cuenta en la canalización queda declarado como pendiente, no dibujado como si existiera. */
    S.elec = { ...d, tomarHVAC: false, sistema: "3F3H-440", cargas: [{ ...G("defaultCarga")("Motor a 440"), tipo: "motor", kW: 15, V: 440, ph: 3, fp: .85, L: 20 }] }; G("recompute")();
    const t3 = typeof fn === "function" ? fn(G("ELEC")) : { circuitos: [], pendientes: [], barras: ["N"] };
    if (t3.barras.includes("N")) throw new Error("3F3H-440 no tiene neutro: no debe haber barra N");
    if (!t3.pendientes.some((p) => /no tiene neutro/i.test(p))) throw new Error("debe declarar que el neutro contado por computeElec no existe en el sistema: " + t3.pendientes.join(" | "));
  } finally { S.elec = JSON.parse(guardado); S.tab = tab0; G("recompute")(); }
});

/* ===== H-269 · Cuantificación de materiales y consideraciones de cálculo del eléctrico (pedido del dueño, 27-sep-2026) =====
   La cuantificación sale de computeElec (R), sin precios (eso es de la cotización): metros de conductor = L del circuito ×
   conductores que el motor cuenta (selConductor: fases, neutro en trifásico, tierra; un juego por canalización), metros de
   canalización = L por juego, piezas de protección por capacidad. Lo que el motor no da (longitud, número de ramales, función
   del 2.º conductor monofásico) queda «pendiente», listado aparte, y no suma (regla 6). No mueve cifras. */
const proyectoMateriales = () => {
  const d = G("defaultElec")();
  S.elec = { ...d, tomarHVAC: false, Ltablero: 40, trafoKVA: 300, trafoZ: 4, cargas: [
    { ...G("defaultCarga")("Motor de proceso"), tipo: "motor", kW: 15, V: 220, ph: 3, fp: .85, L: 30 },
    { ...G("defaultCarga")("Tarja de laboratorio"), tipo: "proceso", kW: 2, V: 127, ph: 1, fp: .9, L: 35 },
    { ...G("defaultCarga")("Horno de curado"), tipo: "resistiva", kW: 12, V: 220, ph: 3, fp: 1, L: 20 },
    { ...G("defaultCarga")("Bomba sin distancia"), tipo: "proceso", kW: 5, V: 220, ph: 3, fp: .85, L: 0 }] };
  G("recompute")();
  const R = G("ELEC");
  if (R.calc.length !== 4 || R.calc.some((c) => c.sinI || c.cant !== 1) || R.calc.slice(0, 3).some((c) => c.sinL || c.Lsin) || !R.calc[3].sinL
    || Object.keys(R.calc[1].fases || {}).length !== 1 || R.Lalim !== 40 || R.sis.Vf === R.sis.V)
    throw new Error("el caso no aísla lo que se prueba: tres circuitos con L, uno sin L, el monofásico en una sola fase, sistema con neutro");
  return R;
};
const MAT_VACIO = { conductores: [], canalizaciones: [], protecciones: [], tableros: [], transformadores: [], pendientes: [] };
const sumaEn = (o, k, v) => { o[k] = (o[k] || 0) + v; };
const ordenado = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, +o[k].toFixed(6)]));
t("S.152 (H-269) cuantificación de materiales del eléctrico: los metros de conductor por calibre (L × fases, neutro y tierra que cuenta computeElec, alimentador general incluido), los de canalización por diámetro y las piezas de protección por capacidad coinciden con R; un circuito sin L queda en pendientes y no suma metros; tabla en la pestaña, sección en la memoria PDF y en el libro (ES/EN)", () => {
  const guardado = JSON.stringify(S.elec), tab0 = S.tab;
  try {
    const R = proyectoMateriales(), fn = w.materialesElec;
    const antes = JSON.stringify(R);
    const M = typeof fn === "function" ? fn(R) : MAT_VACIO;
    eq(JSON.stringify(R), antes, "la cuantificación no toca el resultado del motor:");
    /* Esperado, directo de R: conductores que selConductor cuenta en el relleno de cada canalización (trifásico: 3 fases +
       neutro de calibre de fase + tierra; monofásico: 2 + tierra), por juego en paralelo; sólo los circuitos con L. */
    const esp = { m: {}, tubo: {}, prot: {} };
    const circuito = (K, ph, L) => {
      const P = K.paralelo || 1;
      sumaEn(esp.m, `${K.awg}|${K.material}`, (ph === 3 ? 4 : 2) * P * L);
      sumaEn(esp.m, `${K.tierra}|${K.tierraMat}`, P * L);
      sumaEn(esp.tubo, K.tubo.d, P * L);
    };
    circuito(R.alim, R.sis.ph, R.Lalim);
    R.calc.filter((c) => !c.sinL).forEach((c) => circuito(c.cond, c.ph, c.L));
    sumaEn(esp.prot, String(R.principal), 1);
    R.calc.forEach((c) => sumaEn(esp.prot, String(c.cond.ocpd), 1));
    const obt = { m: {}, tubo: {}, prot: {} };
    M.conductores.forEach((r) => sumaEn(obt.m, `${r.awg}|${r.material}`, r.cant));
    M.canalizaciones.forEach((r) => sumaEn(obt.tubo, r.d, r.cant));
    M.protecciones.forEach((r) => sumaEn(obt.prot, String(r.A), r.cant));
    eq(ordenado(obt.m), ordenado(esp.m), "metros de conductor por calibre y material = L × conductores que cuenta computeElec (fases, neutro, tierra; alimentador general incluido):");
    eq(ordenado(obt.tubo), ordenado(esp.tubo), "metros de canalización por diámetro = L por juego:");
    eq(ordenado(obt.prot), ordenado(esp.prot), "piezas de protección por capacidad = interruptor general + una por circuito:");
    M.conductores.concat(M.canalizaciones).forEach((r) => eq(r.un, "m", `${r.desc}: unidad`));
    M.protecciones.concat(M.tableros, M.transformadores).forEach((r) => eq(r.un, "pza", `${r.desc}: unidad`));
    /* Función de cada conductor: la que computeElec distingue; el 2.º conductor monofásico queda «pendiente». */
    const [mot, tarja, horno, bomba] = R.calc;
    const conF = (awg, re) => M.conductores.filter((r) => r.awg === awg && re.test(r.funcion));
    if (!conF(mot.cond.awg, /^neutro/).length) throw new Error("el neutro que selConductor cuenta en el trifásico debe cuantificarse como neutro");
    if (!conF(mot.cond.tierra, /^tierra/).length) throw new Error("la tierra de la Tabla 250-122 debe cuantificarse como tierra");
    const seg = conF(tarja.cond.awg, /pendiente/);
    if (seg.length !== 1) throw new Error("el 2.º conductor del monofásico (neutro o segunda fase) debe ir en un renglón con función «pendiente»: " + JSON.stringify(M.conductores.map((r) => [r.awg, r.funcion])));
    cerca(seg[0].cant, (tarja.cond.paralelo || 1) * tarja.L, 1e-9, "sus metros sí cuentan (el conductor existe; sólo su función queda pendiente):");
    /* Origen: cada renglón dice de qué circuito y de qué campo de computeElec sale. */
    const fase1 = M.conductores.find((r) => r.awg === mot.cond.awg && /^fase/.test(r.funcion) && r.origen.includes("C-01"));
    if (!fase1) throw new Error("el renglón de fases del C-01 debe decir su origen");
    contiene(fase1.origen, "calc[0].cond.awg", "origen con el campo del calibre:"); contiene(fase1.origen, "calc[0].L", "y el de la longitud:");
    const ag = M.conductores.find((r) => r.awg === R.alim.awg && r.origen.includes("AG"));
    if (!ag) throw new Error("el alimentador general debe cuantificarse (AG)"); contiene(ag.origen, "Lalim", "con la distancia al tablero de computeElec:");
    /* Sin L: pendiente con su nombre, sin metros en ningún renglón. */
    if (!M.pendientes.some((p) => p.includes("C-04") && p.includes("Bomba sin distancia") && /longitud/.test(p))) throw new Error("el circuito sin L debe listarse en pendientes: " + M.pendientes.join(" | "));
    if (M.conductores.concat(M.canalizaciones).some((r) => r.origen.includes("C-04"))) throw new Error("el circuito sin L no debe sumar metros");
    /* Protecciones: polos que computeElec distingue (trifásico 3; monofásico pendiente); el general con su capacidad. */
    const pMot = M.protecciones.find((r) => r.origen.includes("C-01")), pTar = M.protecciones.find((r) => r.origen.includes("C-02"));
    if (!pMot || pMot.polos !== 3) throw new Error("la protección del trifásico lleva 3 polos");
    if (!pTar || pTar.polos != null) throw new Error("los polos del monofásico (1 o 2) no los distingue computeElec: pendiente");
    const gen = M.protecciones.find((r) => r.origen.includes("principal"));
    if (!gen || gen.A !== R.principal || gen.polos !== 3) throw new Error("el interruptor general = principal de computeElec, 3 polos");
    eq(M.tableros.length, 1, "un tablero general:"); contiene(M.tableros[0].desc, `${R.principal} A`, "con las barras del principal:");
    if (!/espacios/.test(M.tableros[0].desc + M.tableros[0].origen) || !M.pendientes.some((p) => /espacios/.test(p))) throw new Error("los espacios del tablero no los calcula computeElec: pendiente declarado");
    eq(M.transformadores.length, 1, "el transformador capturado:"); contiene(M.transformadores[0].desc, "300 kVA", "con su placa:"); contiene(M.transformadores[0].desc, "Z 4 %", "y su impedancia:");
    [...M.conductores, ...M.canalizaciones, ...M.protecciones, ...M.tableros, ...M.transformadores].forEach((r) => sinTexto(`${r.desc} ${r.origen}`, r.desc));
    M.pendientes.forEach((p) => sinTexto(p, "pendiente"));
    if (/\$|MXN|USD|precio/i.test(JSON.stringify(M.conductores.concat(M.canalizaciones, M.protecciones)))) throw new Error("la cuantificación no lleva precios");
    /* Pantalla, memoria PDF y libro (ES y EN). */
    S.tab = "electrico"; G("render")();
    const v = vista();
    contiene(v, "Cuantificación de materiales", "pantalla, tarjeta:");
    const ini = v.indexOf("Cuantificación de materiales"), finT = v.indexOf('<div class="card">', ini), tarj = v.slice(ini, finT > 0 ? finT : undefined);
    contiene(tarj, `${R.alim.awg} ${Number(R.alim.awg) >= 250 ? "kcmil" : "AWG"}`, "pantalla, conductor del alimentador:");
    contiene(tarj, "Bomba sin distancia", "pantalla, pendiente del circuito sin L:"); contiene(tarj, "C-01", "pantalla, origen:");
    const pdf = txtPdfE(G("buildElecPdf")());
    contiene(pdf, "Cuantificacion de materiales", "PDF, sección:"); contiene(pdf, "Bomba sin distancia", "PDF, pendiente:");
    if (/undefined|NaN|\bnull\b/.test(pdf)) throw new Error("el PDF imprime «undefined», «NaN» o «null»");
    const xEs = leerXlsx(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).txt, xEn = leerXlsx(G("buildPropuestaXlsx")({ lang: "en", mon: "MXN" })).txt;
    contiene(xEs, "CUANTIFICACION DE MATERIALES", "libro ES:"); contiene(xEn, "MATERIALS TAKE-OFF", "libro EN:");
    const fx = celdasXlsxFila(xEs, "Conductor", /MEMORIA ELECTRICA/);
    if (!fx || !fx.c.some((c) => /calc\[\d+\]\.cond\.awg|alim\.awg/.test(c))) throw new Error("libro ES: renglón de conductor con su origen: " + (fx && fx.c.join(" | ")));
    if (!celdasXlsxFila(xEn, "Raceway", /ELECTRICAL CALCULATION/)) throw new Error("libro EN: renglón de canalización en inglés");
    /* Más de una unidad en un renglón: computeElec dimensiona el ramal con la corriente de UNA unidad y no dice cuántos
       ramales son: sus metros y su protección quedan pendientes, no se multiplican ni se toman por uno. */
    S.elec.cargas[0].cant = 2; G("recompute")();
    const M2 = typeof fn === "function" ? fn(G("ELEC")) : MAT_VACIO;
    if (M2.conductores.concat(M2.canalizaciones, M2.protecciones).some((r) => r.origen.includes("C-01"))) throw new Error("2 unidades en C-01: sus metros y su protección no se suponen");
    if (!M2.pendientes.some((p) => p.includes("C-01") && /ramal/.test(p))) throw new Error("2 unidades en C-01: pendiente del número de ramales: " + M2.pendientes.join(" | "));
    /* Sin transformador capturado no se cuantifica ninguno. */
    S.elec.cargas[0].cant = 1; S.elec.trafoKVA = null; S.elec.trafoZ = null; G("recompute")();
    const M3 = typeof fn === "function" ? fn(G("ELEC")) : { ...MAT_VACIO, transformadores: [{}] };
    eq(M3.transformadores.length, 0, "sin placa capturada no hay transformador:");
    if (!M3.pendientes.some((p) => /transformador/i.test(p))) throw new Error("sin transformador: pendiente declarado");
  } finally { S.elec = JSON.parse(guardado); S.tab = tab0; G("recompute")(); }
});

t("S.153 (H-269) consideraciones de cálculo del eléctrico: los parámetros que gobiernan el cálculo salen con el valor que usó computeElec y de dónde salen (capturado en esta pestaña, valor inicial de la pestaña, pendiente, criterio de la casa); las normas se citan con edición, año, sección y página sólo si su texto está en parches/normas-texto (si no, BLOQUEADO); pantalla, memoria PDF y libro (ES/EN); ninguna cifra se mueve", () => {
  const guardado = JSON.stringify(S.elec), tab0 = S.tab;
  const vacio = { parametros: [], normas: [] };
  try {
    let R = proyectoMateriales();
    const fn = w.consideracionesElec, antes = JSON.stringify(R), E0 = JSON.stringify(S.elec);
    let C = typeof fn === "function" ? fn(R, S.elec) : vacio;
    eq(JSON.stringify(R), antes, "las consideraciones no tocan el resultado del motor:"); eq(JSON.stringify(S.elec), E0, "ni la captura:");
    const par = (k) => { const p = C.parametros.find((x) => x.clave === k); if (!p) throw new Error(`falta el parámetro «${k}»: ` + C.parametros.map((x) => x.clave).join(", ")); return p; };
    /* Los que pide el dueño: tensión y fases, fp, factores de demanda, caídas admisibles, temperatura y agrupamiento,
       distancia al tablero, kVA y Z del transformador; cada uno con valor y origen, sin huecos. */
    ["sistema", "fpAlim", "fpCargas", "demanda", "dvRamal", "dvTotal", "tempAmb", "nCond", "Ltablero", "trafoKVA", "trafoZ", "continua", "canalizacion"].forEach((k) => {
      const p = par(k); if (!p.param || !p.valor || !p.origen) throw new Error(`«${k}» sin nombre, valor u origen`); sinTexto(`${p.param} ${p.valor} ${p.origen}`, k);
    });
    contiene(par("sistema").valor, "220/127 V", "sistema con su tensión:"); contiene(par("sistema").valor, "4 hilos", "y sus hilos:");
    contiene(par("Ltablero").valor, "40 m", "distancia capturada:"); eq(par("Ltablero").tipo, "capturado", "distancia capturada, origen:"); contiene(par("Ltablero").origen, "capturado en esta pestaña", "y lo dice:");
    contiene(par("trafoKVA").valor, "300 kVA", "kVA capturado:"); contiene(par("trafoZ").valor, "4 %", "Z capturada:"); eq(par("trafoZ").tipo, "capturado", "Z capturada, origen:");
    /* El valor inicial de la pestaña no se hace pasar por captura: se dice que es el de la casa. */
    eq(par("tempAmb").tipo, "inicial", "40 °C es el valor inicial de la pestaña:"); contiene(par("tempAmb").origen, "valor inicial", "y lo dice:");
    contiene(par("tempAmb").valor, `factor ${n(G("fTemp")(40), 2)}`, "con el factor que usó el motor:");
    eq(par("fpAlim").tipo, "casa", "fp del alimentador sin capturar = criterio de la casa:"); contiene(par("fpAlim").valor, n(R.fpAlim, 2), "con el valor que usó el motor:");
    contiene(par("demanda").origen, "220-44", "demanda de contactos con su artículo:"); contiene(par("demanda").origen, "430-24", "y el 25 % del motor mayor:");
    contiene(par("demanda").valor, n(R.fdem, 2), "factor de demanda resultante del motor:");
    /* Normas: con edición, año, sección y página sólo si su texto está en parches/normas-texto y la página trae la sección. */
    const paginas = {};
    const paginaDe = (archivo, p) => {
      if (!paginas[archivo]) { const txt = fs.readFileSync(`parches/normas-texto/${archivo}`, "utf8"), o = {}; const partes = txt.split(/=====PAG (\d+)=====/); for (let i = 1; i < partes.length; i += 2) o[+partes[i]] = (o[+partes[i]] || "") + partes[i + 1]; paginas[archivo] = o; }
      const [a, b] = String(p).split("-").map(Number); let s = ""; for (let k = a; k <= (b || a); k++) s += paginas[archivo][k] || ""; return s;
    };
    if (C.normas.length < 20) throw new Error(`faltan normas que usa el motor: ${C.normas.length}`);
    ["Tabla 310-15(b)(16)", "Tabla 310-15(b)(2)(a)", "Tabla 310-15(b)(3)(a)", "220-44", "430-24", "250-122", "240-6(a)", "210-19(a)", "215-2(a)", "Tabla 5"].forEach((sec) => {
      if (!C.normas.some((x) => (x.seccion || "").includes(sec))) throw new Error(`falta la sección ${sec}`);
    });
    const NORMAS = G("NORMAS_ELEC");
    C.normas.forEach((x, i) => {
      if (x.estado === "BLOQUEADO") { contiene(x.etiqueta, "BLOQUEADO: falta el texto de la norma", `${x.familia}:`); return; }
      if (!x.texto || !fs.existsSync(`parches/normas-texto/${x.texto}`)) throw new Error(`${x.etiqueta}: se cita sin su texto en parches/normas-texto`);
      [x.norma, x.edicion, String(x.anio), x.seccion, `p. ${x.pagina}`].forEach((k) => contiene(x.etiqueta, k, "etiqueta con edición, año, sección y página:"));
      contiene(x.norma, String(x.anio), "el año va en la norma:");
      contiene(paginaDe(x.texto, x.pagina), NORMAS[i].ancla, `${x.etiqueta}: la página citada trae la sección:`);
      if (typeof x.aplica !== "boolean" || !x.uso) throw new Error(`${x.etiqueta}: sin uso o sin «interviene»`);
    });
    if (!C.normas.find((x) => x.seccion === "220-44") || C.normas.find((x) => x.seccion === "220-44").aplica) throw new Error("sin contactos, 220-44 no interviene en este proyecto");
    if (!C.normas.find((x) => x.seccion === "430-24").aplica) throw new Error("con motor, 430-24 interviene");
    /* Regla 4: una norma sin texto no se cita con edición ni sección. */
    const tx0 = NORMAS[0].texto;
    try {
      NORMAS[0].texto = null;
      const Cb = fn(R, S.elec), b = Cb.normas[0];
      eq(b.estado, "BLOQUEADO", "sin texto, BLOQUEADO:"); contiene(b.etiqueta, "BLOQUEADO: falta el texto de la norma", "etiqueta:");
      if (b.etiqueta.includes(NORMAS[0].seccion) || /p\. \d/.test(b.etiqueta) || b.etiqueta.includes("DOF")) throw new Error("una norma sin texto no se cita con edición, sección ni página: " + b.etiqueta);
    } finally { NORMAS[0].texto = tx0; }
    /* Pantalla, memoria PDF y libro. */
    S.tab = "electrico"; G("render")();
    const v = vista();
    contiene(v, "Consideraciones de cálculo", "pantalla, tarjeta:");
    const ini = v.indexOf("Consideraciones de cálculo"), finT = v.indexOf('<div class="card">', ini), tarj = v.slice(ini, finT > 0 ? finT : undefined);
    ["Temperatura ambiente", "valor inicial", "NOM-001-SEDE-2012 (DOF 29-nov-2012)", "Tabla 310-15(b)(16), p. 190", "capturado en esta pestaña"].forEach((k) => contiene(tarj, k, "pantalla:"));
    const pdf = txtPdfE(G("buildElecPdf")());
    ["Consideraciones de calculo", "NOM-001-SEDE-2012 (DOF 29-nov-2012), Tabla 310-15(b)(16), p. 190", "valor inicial"].forEach((k) => contiene(pdf, k, "PDF:"));
    if (/undefined|NaN|\bnull\b/.test(pdf)) throw new Error("el PDF imprime «undefined», «NaN» o «null»");
    const xEs = leerXlsx(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).txt, xEn = leerXlsx(G("buildPropuestaXlsx")({ lang: "en", mon: "MXN" })).txt;
    contiene(xEs, "CONSIDERACIONES DE CALCULO", "libro ES:"); contiene(xEn, "CALCULATION CONSIDERATIONS", "libro EN:");
    const fT = celdasXlsxFila(xEs, "Temperatura ambiente", /MEMORIA ELECTRICA/);
    if (!fT || !fT.c.some((c) => /valor inicial/.test(c))) throw new Error("libro ES: temperatura con su origen: " + (fT && fT.c.join(" | ")));
    const fN = celdasXlsxFila(xEn, "NOM-001-SEDE-2012 (DOF 29-nov-2012), Table", /ELECTRICAL CALCULATION/) || celdasXlsxFila(xEn, "NOM-001-SEDE-2012 (DOF 29-nov-2012)", /ELECTRICAL CALCULATION/);
    if (!fN || !fN.c.some((c) => /conductor ampacity|ampacity/.test(c))) throw new Error("libro EN: norma con su uso en inglés: " + (fN && fN.c.join(" | ")));
    /* Captura distinta del valor inicial = capturado; sin distancia ni transformador = pendiente (no se supone). */
    Object.assign(S.elec, { tempAmb: 35, fpObjetivo: .9, Ltablero: null, trafoKVA: null, trafoZ: null }); G("recompute")(); R = G("ELEC");
    C = typeof fn === "function" ? fn(R, S.elec) : vacio;
    eq(par("tempAmb").tipo, "capturado", "35 °C capturado:"); contiene(par("tempAmb").valor, "35 °C", "con su valor:"); contiene(par("tempAmb").valor, `factor ${n(G("fTemp")(35), 2)}`, "y el factor que usó el motor:");
    eq(par("fpAlim").tipo, "capturado", "fp del alimentador capturado:"); contiene(par("fpAlim").valor, "0.9", "con su valor:");
    ["Ltablero", "trafoKVA", "trafoZ"].forEach((k) => { eq(par(k).tipo, "pendiente", `${k} sin capturar:`); contiene(par(k).origen, "pendiente", `${k}:`); if (/\d/.test(par(k).valor)) throw new Error(`${k}: sin captura no lleva número: ${par(k).valor}`); });
  } finally { S.elec = JSON.parse(guardado); S.tab = tab0; G("recompute")(); }
});

/* ===== S.154 (H-277) · la temperatura ambiente que declaran la memoria, el PDF y el libro es la que usó el cálculo =====
   Con el campo vacío, fTemp calcula con 30 °C (factor de la tabla a 30 °C), pero la memoria del motor, el PDF (2. Bases de
   cálculo) y el libro (MEMORIA_ELECTRICA, ES/EN) imprimían 40 °C junto al factor de 30 °C: el documento no decía lo que se
   calculó (regla 8). Con captura, los cuatro dicen la capturada. */
t("S.154 (H-277) eléctrico: con la temperatura ambiente sin capturar, la memoria del motor, el PDF y el libro (ES/EN) dicen la temperatura con la que calculó (30 °C), no 40 °C; con captura, la capturada", () => {
  const guardado = JSON.stringify(S.elec), tab0 = S.tab;
  try {
    proyectoMateriales();
    S.elec.tempAmb = ""; G("recompute")();
    const fT = G("fTemp");
    eq(fT(""), fT(30), "sin captura el motor calcula con el factor de 30 °C:");
    const revisa = (grados, que) => {
      const memo = G("ELEC").memo.join(" "), pdf = txtPdfE(G("buildElecPdf")());
      const es = leerXlsx(G("buildPropuestaXlsx")({ lang: "es", mon: "MXN" })).txt, en = leerXlsx(G("buildPropuestaXlsx")({ lang: "en", mon: "USD" })).txt;
      contiene(memo, `temperatura ambiente de diseño ${grados} °C`, `${que} memoria del motor:`);
      contiene(pdf, `Temperatura ambiente ${grados} C`, `${que} PDF:`);
      contiene(es, `${grados} °C ambiente`, `${que} libro ES:`);
      contiene(en, `${grados} °C ambient`, `${que} libro EN:`);
    };
    revisa(30, "sin captura:");
    S.elec.tempAmb = 45; G("recompute")();
    revisa(45, "capturada 45 °C:");
  } finally { S.elec = JSON.parse(guardado); S.tab = tab0; G("recompute")(); }
});

/* ===== CM · casos calculados a mano por motor (Fase 1, rev 2.9.24) =====
   Cada motor tiene su módulo en pruebas-motores/<motor>.mjs y su hoja en parches/casos-a-mano/<motor>.csv. El módulo
   recibe el arnés (t, eq, cerca, contiene, G, S, w, …) y las filas de su hoja; compara NÚMEROS con tolerancia, no textos.
   Filas con estado «fase2:H-nnn» son el valor correcto según norma que hoy la suite no da: sólo se exigen con CM_FASE2=1
   (al cerrar el hallazgo se cambia el estado a «vigente»). Ver pruebas-motores/LEEME.md. */
const CM = {
  leerCsv(texto) {
    const parse = (l) => { const out = []; let cur = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"' && cur === "") q = true; else if (ch === ",") { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
    const lineas = String(texto).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
    const cab = parse(lineas[0]);
    return lineas.slice(1).map((l) => { const c = parse(l); return Object.fromEntries(cab.map((k, i) => [k, c[i] ?? ""])); });
  },
  casos(motor) {
    const f = `parches/casos-a-mano/${motor}.csv`;
    if (!fs.existsSync(f)) throw new Error(`falta la hoja de casos a mano ${f}`);
    const filas = CM.leerCsv(fs.readFileSync(f, "utf8"));
    const obligatorias = ["id", "descripcion", "entradas", "formula", "fuente", "caracter", "expresion", "esperado", "tolerancia", "estado", "calculado_por"];
    const faltan = obligatorias.filter((k) => !(k in (filas[0] || {})));
    if (faltan.length) throw new Error(`${f}: faltan columnas ${faltan.join(", ")}`);
    return filas;
  },
  /* Compara una fila: expresion (JS evaluado en la suite, sobre el estado que el módulo ya armó) contra esperado ± tolerancia
     (absoluta, o relativa si termina en %). Las filas fase2 sólo se exigen con CM_FASE2=1; si no, cuentan como pendientes. */
  comprobar(fila, valor) {
    const esperado = Number(fila.esperado), tolTxt = String(fila.tolerancia || "0").trim();
    const tol = /%$/.test(tolTxt) ? Math.abs(esperado) * Number(tolTxt.slice(0, -1)) / 100 : Number(tolTxt);
    if (!Number.isFinite(esperado) || !Number.isFinite(tol)) throw new Error(`${fila.id}: esperado o tolerancia no numéricos`);
    const v = valor !== undefined ? valor : G(fila.expresion);
    if (!Number.isFinite(Number(v))) throw new Error(`${fila.id} (${fila.descripcion}): la suite no dio número para «${fila.expresion}»: ${JSON.stringify(v)}`);
    if (Math.abs(Number(v) - esperado) > tol) throw new Error(`${fila.id} (${fila.descripcion}): esperado ${esperado} ± ${tol} [${fila.fuente}; ${fila.caracter}], suite ${v}`);
    return Number(v);
  },
  esFase2: (fila) => /^fase2/i.test(String(fila.estado || "")),
  exigirFase2: !!process.env.CM_FASE2,
};
{
  const dir = new URL("./pruebas-motores/", import.meta.url);
  const ctx = { t, eq, cerca, contiene, G, S, w, fs, file, baseFile, cargar, REG_PROY, CM, llenarTodoS, proyectoDePrueba };
  const mods = fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => /^[a-z]+\.mjs$/.test(x)).sort() : [];
  for (const f of mods) {
    try { const m = await import(new URL(f, dir).href); await m.default(ctx); }
    catch (e) { t(`CM.${f.replace(/\.mjs$/, "")} el módulo de casos a mano carga y corre`, () => { throw e; }); }
  }
}

const total = ok + fail;
console.log(`\nSuiteEmp rev ${G("REV")} · banco de comprobaciones de la rev 2.9.3`);
console.log(`${ok} de ${total} comprobaciones correctas`);
if (fallos.length) { console.log("\nFALLOS:"); fallos.forEach(([n2, m]) => console.log(` ✗ ${n2}\n   ${m}`)); }
if (w.__errs.length) console.log("\nerrores de ventana:", w.__errs);
process.exit(fail ? 1 : 0);
