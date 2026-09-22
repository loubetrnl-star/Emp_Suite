// Parche reaplicable del BANCO · contingencia (14-sep-2026).
// Uso: node pruebas-contingencia.mjs <pruebas.mjs entrada> <pruebas.mjs salida>
//  · 8.5 y 22.1 comparan con la contingencia en 0 %: vigilan que TODO LO DEMÁS
//    siga idéntico; el efecto propio de la contingencia lo vigila la sección C.
//  · 11.7 buscaba el texto literal «RESUMEN_EJECUTIVO!C14» como síntoma de celda
//    fija; con la fila nueva el total real cae en C14. Ahora verifica que la
//    portada apunte a la fila cuyo rótulo es el total, sea cual sea.
import fs from "node:fs";
const [, , entrada, salida] = process.argv;
let src = fs.readFileSync(entrada, "utf8");
const fallos = [];
function una(nombre, buscar, reemplazo) {
  const partes = src.split(buscar);
  if (partes.length !== 2) { fallos.push(`${nombre}: el ancla aparece ${partes.length - 1} veces`); return; }
  src = partes[0] + (typeof reemplazo === "function" ? reemplazo(buscar) : reemplazo) + partes[1];
}

una("8.5 inicio",
  '    Gb("S").hidro = JSON.parse(JSON.stringify(S.hidro));\n',
  (x) => '    /* Contingencia (14-sep-2026): renglón que la base no tiene; se compara en 0 %. */\n    const contAntes = S.quote.contingencia;\n    S.quote.contingencia = 0;\n    try {\n' + x);
una("8.5 fin",
  '    cerca(G("QUOTE").tot, Gb("QUOTE").tot, 0.01, "importe:");\n',
  (x) => x + '    } finally { S.quote.contingencia = contAntes; G("recompute")(); }\n');

una("11.7",
`  if (LES.txt.indexOf("<f>RESUMEN_EJECUTIVO!C14</f>") >= 0) throw new Error("la portada volvió a apuntar a una celda fija");`,
`  /* La portada debe apuntar a la fila que de verdad es el total del resumen. */
  [[LES.txt, "RESUMEN_EJECUTIVO", "TOTAL DE LA PROPUESTA"], [LEN.txt, "EXECUTIVE_SUMMARY", "PROPOSAL TOTAL"]].forEach(([x, hoja, etq]) => {
    const r = filaXlsxConRotulo(x, etq, /SUBTOTAL/);
    if (!r) throw new Error(\`no encontré la fila «\${etq}» en el resumen\`);
    contiene(x, \`<f>\${hoja}!C\${r}</f>\`, "la portada apunta a la fila del total:");
  });`);

una("22.1",
`    delete S.quote.indirectPct; delete S.quote.profitPct; S.quote.finPct = 1.5;`,
`    delete S.quote.indirectPct; delete S.quote.profitPct; S.quote.finPct = 1.5;
    S.quote.contingencia = 0;   // esta prueba vigila indirectos y utilidad; la contingencia la vigila la sección C`);

una("helper xlsx",
`let LES, LEN;`,
`let LES, LEN;
/* Fila (número) del resumen ejecutivo cuya celda de texto es exactamente \`etq\`.
   Busca en la hoja que además contiene \`ademas\`, para no confundirla con la portada. */
function filaXlsxConRotulo(x, etq, ademas) {
  const hojas = x.split("<worksheet").slice(1).map((t) => t.slice(0, t.indexOf("</worksheet>")));
  for (const h of hojas) {
    if (ademas && !ademas.test(h)) continue;
    for (const m of h.matchAll(/<row r="(\\d+)"[^>]*>(.*?)<\\/row>/g))
      if ([...m[2].matchAll(/<t[^>]*>([^<]*)<\\/t>/g)].some((c) => c[1] === etq)) return +m[1];
  }
  return 0;
}
function celdasXlsxFila(x, etqInicio, ademas) {
  const hojas = x.split("<worksheet").slice(1).map((t) => t.slice(0, t.indexOf("</worksheet>")));
  for (const h of hojas) {
    if (ademas && !ademas.test(h)) continue;
    for (const m of h.matchAll(/<row r="(\\d+)"[^>]*>(.*?)<\\/row>/g)) {
      const c = [...m[2].matchAll(/<t[^>]*>([^<]*)<\\/t>|<f>([^<]*)<\\/f>/g)].map((k) => (k[1] != null ? k[1] : "=" + k[2]));
      if (c.some((v) => v.startsWith(etqInicio))) return { r: +m[1], c };
    }
  }
  return null;
}`);

una("sección C",
`/* ============================== resultado =============================== */`,
`/* ===== C. Contingencia en la configuración comercial (14-sep-2026) ======
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
    const celdas = [...txt.matchAll(/\\(((?:\\\\.|[^\\\\)])*)\\)\\s*Tj/g)].map((m) => m[1].replace(/\\\\(.)/g, "$1"));
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
    if (!f) throw new Error(\`libro \${lang} sin fila de contingencia\`);
    const rDir = filaXlsxConRotulo(x, dir, /SUBTOTAL/), rSub = filaXlsxConRotulo(x, sub, /SUBTOTAL/);
    if (!f.c.includes(\`=C\${rDir}*0.15\`)) throw new Error(\`libro \${lang}: la fila no es fórmula sobre el directo: \${f.c.join(" | ")}\`);
    if (!(f.r > rDir && f.r < rSub)) throw new Error(\`libro \${lang}: la contingencia quedó fuera del SUM del subtotal\`);
    const fs2 = celdasXlsxFila(x, sub, /SUBTOTAL/);
    if (!fs2.c.includes(\`=SUM(C\${rDir}:C\${rSub - 1})\`)) throw new Error(\`libro \${lang}: subtotal \${fs2.c.join(" | ")}\`);
  });
});

/* ============================== resultado =============================== */`);

if (fallos.length) { console.error("NO SE APLICÓ:\n  " + fallos.join("\n  ")); process.exit(1); }
fs.writeFileSync(salida, src);
console.log("banco parchado → " + salida);
