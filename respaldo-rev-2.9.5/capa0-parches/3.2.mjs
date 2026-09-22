// Caso 3.2 · Memoria HVAC con 35/24 °C fijos.
// Uso: node casos/3.2.mjs <html>
// Proyecto de referencia (proyectoBase: 2 zonas) medido en dos sitios:
//   A) Mexicali (tabla SITES: 46 °C BS / 23 °C BH, 3 m, rango 17 K)
//   B) Personalizado: 42 °C BS / 26 °C BH, 1200 m, rango 14 K
// Para cada uno se lee lo que la suite entregaría al cliente:
//   - Memoria de cálculo HVAC suelta (buildMemoriaPdf), sección "2. Bases de diseño"
//   - Memoria integral (buildMemoriaIntegralPdf), capítulo de carga térmica
// y se compara el exterior impreso contra el que usó el motor (SITE.db / SITE.wb).
import { cargar, proyectoBase, imprime } from "./_carga.mjs";

const w = await cargar(process.argv[2]);
const G = (e) => w.eval(e);
const S = proyectoBase(w);
const dec = (b) => Array.from(b).map((c) => String.fromCharCode(c)).join("");
// Texto del PDF: une los fragmentos (...) Tj de cada renglón para que un párrafo partido se lea seguido.
const texto = (b) => (dec(b).match(/\((?:\\.|[^\\)])*\) Tj/g) || []).map((s) => s.slice(1, -4)).join(" ").replace(/\s+/g, " ");
// Tolera que la corrección nombre el sitio entre "Exterior" y la cifra (p. ej. "Exterior (Mexicali, B.C., 3 m) 46 °C ...").
const RX = /Exterior[^°]*?(-?\d+(?:\.\d+)?) °C de bulbo seco y (-?\d+(?:\.\d+)?) °C de bulbo húmedo/g;

const escenarios = {
  mexicali: { key: "mexicali" },
  personalizado: { key: "custom", db: 42, wb: 26, alt: 1200, range: 14 },
};

const detalle = {};
const valor = {};
for (const [nombre, site] of Object.entries(escenarios)) {
  S.site = JSON.parse(JSON.stringify(site));
  G("recompute")();
  const SITE = G("SITE");
  const suelta = texto(G("buildMemoriaPdf")());
  const integral = texto(G("buildMemoriaIntegralPdf")());
  const impresos = (t) => [...t.matchAll(RX)].map((m) => `${m[1]}/${m[2]}`);
  const enSuelta = impresos(suelta), enIntegral = impresos(integral);
  const motor = `${SITE.db}/${SITE.wb}`;
  // La memoria de zona del mismo PDF sí imprime el sitio: sirve de contraste.
  const zona = (suelta.match(/Sitio [^:]+: -?[\d.]+ °C BS \/ -?[\d.]+ °C BH ext/) || [""])[0];
  const LOADS = G("LOADS");
  valor[nombre] = enSuelta[0] || null;
  detalle[nombre] = {
    motor_SITE_db_wb: motor,
    memoria_suelta_bases: enSuelta,
    memoria_integral_bases: enIntegral,
    coincide: enSuelta.concat(enIntegral).every((x) => x === motor) && enSuelta.length > 0,
    memoria_zona_mismo_pdf: zona,
    sitio: { label: SITE.label, alt: SITE.alt, range: SITE.range, pAtm: +SITE.pAtm.toFixed(2) },
    hora_pico_zonas: LOADS.map((r) => r.hour),
    // Secundario (no es la instrucción del dueño): hora solar que declara el mismo párrafo de bases.
    hora_solar_en_bases: ((suelta.match(/mes de julio, hora solar (\d+)/) || [])[1]) || null,
    tons_total: +G("totals")().tons.toFixed(3),
  };
}

imprime({ caso: "3.2", valor, detalle });
