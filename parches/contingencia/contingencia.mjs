// Parche reaplicable · CONTINGENCIA en la configuración comercial de SuiteEmp.
// Decisiones del dueño (14-sep-2026):
//   · base: solo costo directo  · arranque: 15 %  · entra en cotización privada y en licitación
//   · proyectos guardados sin el campo abren con 0 % para que su total no cambie
// Uso:  node contingencia.mjs <index.html entrada> <index.html salida> [--check]
// Cada ancla debe aparecer EXACTAMENTE una vez; si no, no se escribe nada.
import fs from "node:fs";

const [, , entrada, salida] = process.argv;
const soloRevisar = process.argv.includes("--check");
let src = fs.readFileSync(entrada, "utf8");
const fallos = [];

function una(nombre, buscar, reemplazo) {
  const alts = Array.isArray(buscar) ? buscar : [[buscar, reemplazo]];
  const cuentas = [];
  for (const [b, r] of alts) {
    const partes = src.split(b);
    cuentas.push(partes.length - 1);
    if (partes.length !== 2) continue;
    src = partes[0] + (typeof r === "function" ? r(b) : r) + partes[1];
    return;
  }
  fallos.push(`${nombre}: ninguna variante del ancla aparece exactamente una vez (${cuentas.join("/")})`);
}

/* 0 · marca de revisión */
const mRev = src.match(/const REV = "(\d+\.\d+\.\d+)";/);
if (!mRev) fallos.push("REV: no se encontró");
else {
  una("REV", mRev[0], `const REV = "${mRev[1]}.1";`);
  una("REV_NOTA", 'const REV_NOTA = "', `const REV_NOTA = "Rev ${mRev[1]}.1 (contingencia): la configuracion comercial agrega contingencia sobre el costo directo, 15 % de arranque, en la cotizacion, la propuesta integral (PDF y Excel, ES y EN) y la licitacion; un proyecto guardado sin el campo abre con 0 % para no cambiar su total. · `);
}

/* 1 · semilla de la casa */
una("QUOTE_SEED", "  indirect: 0.18, utility: 0.12,\n",
`  indirect: 0.18, utility: 0.12,
  /* Contingencia · política comercial de la casa (decisión del dueño, 14-sep-2026).
     Reserva para imprevistos de obra calculada SOLO sobre el costo directo: no
     genera indirectos ni utilidad. Entra en la cotización privada y en la
     licitación. Un proyecto guardado antes de que existiera abre con 0 % para
     que su total no cambie (ver sanearEstado y cotizacionTecnica). */
  contingencia: 0.15,
`);

/* 2 · cotización privada */
una("computeQuote cascada",
  "  const sub = direct + ind + uti + flete + fianza + finan, iva = sub * num(q.iva, QUOTE_SEED.iva), tot = sub + iva;",
`  const contPct = num(q.contingencia, QUOTE_SEED.contingencia), cont = direct * contPct;
  const sub = direct + ind + uti + cont + flete + fianza + finan, iva = sub * num(q.iva, QUOTE_SEED.iva), tot = sub + iva;`);
una("computeQuote salida",
  "return { lines, aux, equipTotal, equipTons, nEquip, auxTotal, direct, ind, uti, flete,",
  "return { lines, aux, equipTotal, equipTons, nEquip, auxTotal, direct, ind, uti, cont, contPct, flete,");

/* 3 · licitación: sobrecosto en cascada */
una("pctContingencia", "function estructuraSobrecosto(cd) {",
  (x) => "/* Contingencia vigente del proyecto, fracción del costo directo. Campo vacío → semilla de\n   la casa; proyecto guardado sin el campo → 0 (lo fija sanearEstado). No depende de QUOTE. */\nfunction pctContingencia() { return num((S.quote || {}).contingencia, QUOTE_SEED.contingencia); }\n" + x);
una("estructuraSobrecosto",
`  const cu = sub2 * u, sub3 = sub2 + cu;
  const cca = sub3 * ca;
  return { cd, ci, i, cf, fin, cu, u, cca, ca, pu: sub3 + cca };`,
`  const cu = sub2 * u;
  /* Contingencia sobre el costo directo, después de la utilidad: no genera
     indirectos, financiamiento ni utilidad; sí paga los cargos adicionales,
     que se retienen sobre el importe total de cada estimación. */
  const k = pctContingencia();
  const cc = cd * k, sub3 = sub2 + cu + cc;
  const cca = sub3 * ca;
  return { cd, ci, i, cf, fin, cu, u, cc, k, cca, ca, pu: sub3 + cca };`);
una("licitación párrafo",
  "costo directo, costo indirecto, costo por financiamiento, cargo por utilidad y cargos adicionales, en ese orden y en cascada.",
  'costo directo, costo indirecto, costo por financiamiento, cargo por utilidad${pctContingencia() ? ", contingencia sobre el costo directo" : ""} y cargos adicionales, en ese orden y en cascada.');
/* Decisión del dueño (14-sep-2026): con contingencia en 0 % el renglón se OCULTA en pantalla y documentos. */
una("licitación tabla",
  '    ["Cargo por utilidad", "sobre los anteriores", n(E.u * 100, 2), n(E.cu, 2)],\n',
  '    ["Cargo por utilidad", "sobre los anteriores", n(E.u * 100, 2), n(E.cu, 2)],\n    ...(E.k ? [["Contingencia", "sobre directo", n(E.k * 100, 2), n(E.cc, 2)]] : []),\n');
una("licitación tarjeta",
  "`Indirectos ${n(es.i * 100, 2)} % · financiamiento ${n(es.fin * 100, 2)} % · utilidad ${n(es.u * 100, 2)} % · cargos ${n(es.ca * 100, 2)} %`",
  "`Indirectos ${n(es.i * 100, 2)} % · financiamiento ${n(es.fin * 100, 2)} % · utilidad ${n(es.u * 100, 2)} %${es.k ? ` · contingencia ${n(es.k * 100, 2)} %` : \"\"} · cargos ${n(es.ca * 100, 2)} %`");

/* 4 · PDF de cotización (desglose interno) */
const filaPdfCot = "    ...(pctContingencia() ? [[`Contingencia ${(pctContingencia() * 100).toFixed(1)} % sobre costo directo`, M(Q.cont)]] : []),\n";
una("PDF cotización", [
  ["    [`Utilidad ${(q.utility * 100).toFixed(0)} %`, M(Q.uti)],\n", (x) => x + filaPdfCot],
  ["    [`Utilidad ${(pctQ(\"utility\", true) * 100).toFixed(0)} %`, M(Q.uti)],\n", (x) => x + filaPdfCot],   // 2.9.7
]);

/* 5 · propuesta integral PDF (ES y EN) */
const filaPdfProp = '    ...(pctContingencia() ? [[`${L("Contingencia sobre costo directo", "Contingency on direct cost")} ${n(pctContingencia() * 100, 1)} %`, $(Q.cont)]] : []),\n';
una("PDF propuesta", [
  ['    [`${L("Utilidad", "Fee")} ${n(S.quote.utility * 100, 0)} %`, $(Q.uti)],\n', (x) => x + filaPdfProp],
  ['    [`${L("Utilidad", "Fee")} ${n(pctPolitica("utility") * 100, 0)} %`, $(Q.uti)],\n', (x) => x + filaPdfProp],   // 2.9.7
]);

/* 6 · propuesta integral Excel (ES y EN): fila con fórmula dentro del SUM */
una("XLSX filas",
  "const rInd = rDir + 1, rUti = rDir + 2, rFle = rDir + 3, rFia = rDir + 4, rFin = conFin ? rDir + 5 : rFia,",
  "const conCont = pctContingencia() !== 0;\n  const rInd = rDir + 1, rUti = rDir + 2, rCon = conCont ? rDir + 3 : rUti, rFle = rCon + 1, rFia = rCon + 2, rFin = conFin ? rCon + 3 : rFia,");
const filaXlsx = "  if (conCont) rf.push([xV(XS.TD), xT(`${L(\"Contingencia sobre costo directo\", \"Contingency on direct cost\")} ${n(pctContingencia() * 100, 1)} %`, XS.TD), xF(`C${rDir}*${pctContingencia()}`, XS.MXN), xV(XS.TD)]);\n";
una("XLSX contingencia", [
  ["  rf.push([xV(XS.TD), xT(`${L(\"Utilidad\", \"Fee\")} ${n(q.utility * 100, 0)} %`, XS.TD), xF(`(C${rDir}+C${rInd})*${q.utility}`, XS.MXN), xV(XS.TD)]);\n", (x) => x + filaXlsx],
  ["  rf.push([xV(XS.TD), xT(`${L(\"Utilidad\", \"Fee\")} ${n(pctPolitica(\"utility\") * 100, 0)} %`, XS.TD), xF(`(C${rDir}+C${rInd})*${pctPolitica(\"utility\")}`, XS.MXN), xV(XS.TD)]);\n", (x) => x + filaXlsx],   // 2.9.7
]);

/* 7 · pantalla de cotización */
una("pantalla composición",
  '    { k: "Utilidad", v: Q.uti, c: "#ef5236" },\n',
  '    { k: "Utilidad", v: Q.uti, c: "#ef5236" },\n    { k: "Contingencia", v: Q.cont, c: "#c9a227" },\n');
const pasoCont = '            ${pctContingencia() ? `<div class="qstep"><span>Contingencia · ${(pctContingencia() * 100).toFixed(1)} % sobre directo</span><span class="n">${M(Q.cont)}</span></div>` : ""}\n';
una("pantalla del costo al precio", [
  ['            <div class="qstep"><span>Utilidad · ${(q.utility * 100).toFixed(0)} %</span><span class="n">${M(Q.uti)}</span></div>\n', (x) => x + pasoCont],
  ['            <div class="qstep"><span>Utilidad · ${(pctPolitica("utility") * 100).toFixed(0)} %</span><span class="n">${M(Q.uti)}</span></div>\n', (x) => x + pasoCont],   // 2.9.7
]);
una("pantalla perilla",
  '          ${slider("Utilidad", "quote.utility", q.utility, 0, 0.40, 0.01, (v) => (v * 100).toFixed(0) + " %", "margen de la empresa")}\n',
  (x) => x + '          ${slider("Contingencia", "quote.contingencia", num(q.contingencia, QUOTE_SEED.contingencia), 0, 0.30, 0.005, (v) => (v * 100).toFixed(1) + " %", "sobre el costo directo")}\n');
una("pantalla captura",
  '<div class="row">${inp("Indirectos", "quote.indirect", "number", "0.01")}${inp("Utilidad", "quote.utility", "number", "0.01")}</div>',
  (x) => x + '\n          ${inp("Contingencia (fracción del costo directo)", "quote.contingencia", "number", "0.005")}');
const campoLic = '\n            <div class="field"><label>Contingencia %</label><input type="number" value="${n(num(S.quote.contingencia, QUOTE_SEED.contingencia) * 100, 1)}" disabled /><div class="hint">Sobre el costo directo. Es la misma de la cotización: se ajusta en Perillas.</div></div>';
una("pantalla licitación", [
  ['<div class="field"><label>Utilidad %</label><input type="number" step="0.1" data-path="quote.profitPct" value="${num(S.quote.profitPct, QUOTE_SEED.profitPct)}" /></div>', (x) => x + campoLic],
  ['<div class="field"><label>Utilidad %</label><input type="number" step="0.1" data-path="quote.profitPct" value="${esquemaVacio() && S.quote.profitPct === null ? "" : num(S.quote.profitPct, QUOTE_SEED.profitPct)}" /></div>', (x) => x + campoLic],   // 2.9.7
]);
/* 2.9.7 · el caso de verificación embebido debe traer TODAS las llaves del estado: contingencia 0 conserva su huella. */
if (src.includes("const PLANTILLAS_SUITE")) una("caso embebido", '"quote": {"currency":"MXN",', '"quote": {"contingencia":0,"currency":"MXN",');
/* 2.9.7 · la contingencia es porcentaje de POLÍTICA (decisión D): borrada en pantalla vuelve a su semilla. */
if (src.includes("const POLITICA_D = [")) una("POLITICA_D", 'const POLITICA_D = ["fx", ', 'const POLITICA_D = ["contingencia", "fx", ');
una("ayuda",
  '  "quote.utility":   { ref: "Utilidad de la empresa sobre el costo ya indirecto.",',
  '  "quote.contingencia": { ref: "Contingencia: reserva para imprevistos de obra (cantidades, alcance, condiciones de sitio) calculada solo sobre el costo directo. No genera indirectos ni utilidad.", rec: "Política de la casa: 15 % de arranque. En licitación pública confirma que la convocatoria la admita." },\n  "quote.utility":   { ref: "Utilidad de la empresa sobre el costo ya indirecto.",');

/* 8 · proyectos guardados: el total no cambia */
una("sanearEstado",
  '  if (!s.quote || typeof s.quote !== "object") s.quote = JSON.parse(JSON.stringify(QUOTE_SEED));\n',
  (x) => x + '  /* Contingencia (14-sep-2026): un proyecto guardado antes de que existiera abre\n     con 0 % para que su total no cambie; queda visible y editable. */\n  if (!("contingencia" in s.quote)) s.quote.contingencia = 0;\n');
una("cotizacionTecnica",
  "  const out = JSON.parse(JSON.stringify(QUOTE_SEED));\n  if (!q || typeof q !== \"object\") return out;\n",
  "  const out = JSON.parse(JSON.stringify(QUOTE_SEED));\n  if (!q || typeof q !== \"object\") return out;\n  /* Sin el campo, la cotización es anterior a la contingencia: se copia con 0 %. */\n  if (!(\"contingencia\" in q)) out.contingencia = 0;\n");

if (fallos.length) { console.error("NO SE APLICÓ:\n  " + fallos.join("\n  ")); process.exit(1); }
if (soloRevisar) { console.log("todas las anclas encontradas una vez"); process.exit(0); }
fs.writeFileSync(salida, src);
console.log(`aplicado → ${salida} (rev ${mRev[1]}.1)`);
