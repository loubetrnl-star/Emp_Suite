// Parche reaplicable · botones de IVA de la cotización (14-sep-2026).
// Defecto: los chips «8 % franja fronteriza», «16 % nacional» y «Exento» guardaban el valor
// en data-val, pero el manejador «setnum» lee data-v: parseFloat(undefined) = NaN se
// escribía en S.quote.iva, el total quedaba mal y al autoguardar el rótulo decía «IVA 0 %».
// Arreglo: los chips usan data-v (como los demás botones setnum) y el manejador ya no
// escribe un valor que no sea número.
// Uso: node iva-botones.mjs <index.html entrada> <index.html salida>
//      node iva-botones.mjs --banco <pruebas.mjs entrada> <pruebas.mjs salida>
import fs from "node:fs";

const banco = process.argv[2] === "--banco";
const [entrada, salida] = banco ? process.argv.slice(3) : process.argv.slice(2);
let src = fs.readFileSync(entrada, "utf8");
const fallos = [];
function una(nombre, buscar, reemplazo) {
  const partes = src.split(buscar);
  if (partes.length !== 2) { fallos.push(`${nombre}: el ancla aparece ${partes.length - 1} veces`); return; }
  src = partes[0] + reemplazo + partes[1];
}

if (!banco) {
  for (const v of ["0.08", "0.16", "0"])
    una(`chip ${v}`, `data-act="setnum" data-path="quote.iva" data-val="${v}"`, `data-act="setnum" data-path="quote.iva" data-v="${v}"`);
  una("manejador setnum",
    'case "setnum": { setPath(b.dataset.path, parseFloat(b.dataset.v)); projAutosave(); render(); break; }',
    'case "setnum": { const v = parseFloat(b.dataset.v); if (!Number.isFinite(v)) break; setPath(b.dataset.path, v); projAutosave(); render(); break; }');
  const mRev = src.match(/const REV = "(\d+\.\d+\.\d+)(\.(\d+))?";/);
  if (mRev) {
    const sig = (mRev[3] ? +mRev[3] : 0) + 1;
    una("REV", mRev[0], `const REV = "${mRev[1]}.${sig}";`);
    una("REV_NOTA", 'const REV_NOTA = "', `const REV_NOTA = "Rev ${mRev[1]}.${sig}: botones de IVA de la cotizacion corregidos (escribian NaN en lugar de 8 %, 16 % o exento). · `);
  } else fallos.push("REV: no se encontró");
} else {
  una("sección I", "/* ============================== resultado =============================== */",
`/* ===== I. Botones de IVA de la cotización (14-sep-2026) ================ */
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

/* ============================== resultado =============================== */`);
}

if (fallos.length) { console.error("NO SE APLICÓ:\n  " + fallos.join("\n  ")); process.exit(1); }
fs.writeFileSync(salida, src);
console.log((banco ? "banco" : "index") + " parchado → " + salida);
