export const meta = {
  name: 'pruebas-visuales',
  description: 'Recorrido visual con Chromium de las pantallas cambiadas (H-262 a H-266) en tema claro/oscuro y celular, más emisión de entregables',
  phases: [{ title: 'Recorrer', detail: 'dos recorridos en paralelo: pantallas y entregables' }],
}
const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x). App: index.html (sin build). NO modifiques el repositorio;
escribe capturas y scripts sólo en /home/user/emp_suite/x15/visual/ (carpeta ignorada por git). Reglas: /home/user/emp_suite/CLAUDE.md.
Chromium está en /opt/pw-browsers y Playwright en /opt/node22/lib/node_modules/playwright (require con esa ruta; no instales nada).
Ejemplo de arranque: const { chromium } = require("/opt/node22/lib/node_modules/playwright"); const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1600 } }); p.on("pageerror", …); await p.goto("file://" + ruta);
await p.waitForTimeout(1200); luego p.evaluate(() => { reemplazarEstado(defaultState()); …; recompute(); S.tab = "civil"; render(); }).
La suite tiene tema claro/oscuro por prefers-color-scheme (usa p.emulateMedia({ colorScheme: "dark" })) y se usa en celular
(viewport 390×844). Contexto: se independizaron ventilación (H-262/H-263: selección del ventilador hacia una zona de carga
térmica), contra incendio (H-264), obra civil (H-265: listas de áreas y cuartos) y soportería (H-266: instantánea o captura).
Devuelve un informe en español con: lista de capturas (ruta), errores de página (pageerror) por pantalla, textos «undefined»/
«NaN»/«[object» encontrados, elementos fuera del ancho en celular (scrollWidth > clientWidth), textos ilegibles o tarjetas vacías,
y cualquier cosa que un usuario notaría rota. Archivo:línea de la vista cuando puedas.
`
const R = [
  { key: 'pantallas', prompt: `${BASE}
Recorre con un proyecto armado (dos zonas de carga térmica 400 m²×6 m y 100 m²×3 m; ventilación general 400×6×6 c/h y el
ventilador seleccionado hacia la zona 2 vía seleccionarVent; contra incendio 500 m², 6 m, ord2, 30+12 m; civil con dos áreas y un
cuarto (S.civil.areas / S.civil.cuartos); soportería con ductos [defaultSegment("TR-1", 3000) length 20] y la instantánea aceptada
(S.soporte.snap = snapshotSoporte(); usarMotores = true) y alturas 7.2 / 6; todos los permisos concedidos) las pestañas:
carga (zona 2), ventilacion, fuego, civil, soporte, tablero, inicio (diagrama de disciplinas) y proyecto (permisos entre motores).
Captura cada una en claro y oscuro a 1280 px y en celular 390 px (claro). Revisa además el estado vacío (defaultState sin capturas)
de ventilacion, fuego, civil y soporte. Reporta lo pedido en BASE.` },
  { key: 'entregables', prompt: `${BASE}
Con el mismo proyecto armado (ver el otro recorrido: dos zonas, ventilador seleccionado, contra incendio, civil con listas,
soportería con instantánea) emite en jsdom o en Chromium: memoria integral (buildMemoriaIntegralPdf o la función que exista;
búscala), memoria de cada disciplina (buildVentPdf, buildFuegoPdf, buildCivilPdf, buildSoportePdf, memoria de carga), el libro de
la propuesta (buildPropuestaXlsx) y la cotización (buildLicitacionPdf si aplica, con importación capturada como hace el banco:
S.quote.importacion = { monto: 1000, moneda: "MXN", fuente: "…", fecha: "2026-09-25" }). Guarda cada PDF/XLSX en x15/visual/ y
extrae su texto (para PDF: los operadores Tj; para XLSX: descomprime el zip y lee sharedStrings/sheets con node) y busca:
«undefined», «NaN», «heredad», «hereda», «zona más alta», «de las zonas» (en civil/soporte), «Heredado», textos que contradigan la
independencia de los motores, y confirma que aparezcan: el trazado de origen con la fila del ventilador seleccionado y su espejo EN
en el libro, la nota de que ninguna disciplina hereda, el origen de cada cantidad en el PDF de civil, «pendiente» donde falte
captura. Reporta con la ruta de cada archivo y las frases encontradas.` },
]
phase('Recorrer')
const inf = await parallel(R.map(r => () => agent(r.prompt, { label: `recorrer:${r.key}`, phase: 'Recorrer' })))
return { pantallas: inf[0], entregables: inf[1] }