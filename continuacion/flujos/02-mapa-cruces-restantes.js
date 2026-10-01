export const meta = {
  name: 'mapa-cruces-restantes',
  description: 'Inventario, verificado adversarialmente, de las lecturas en vivo entre motores que aún quedan (clean, duct, aire, hidro, equip, quote, valor, kaizen, load) en EMP Suite HEAD 63a2794',
  phases: [
    { title: 'Leer', detail: 'cuatro lectores, dos motores cada uno' },
    { title: 'Verificar', detail: 'un escéptico por par, en cuanto termina su lector' },
    { title: 'Sintetizar', detail: 'un mapa único con los hallazgos H-274+' },
  ],
}
const BASE = `
Copia de SÓLO LECTURA: /home/user/wt-lectura (worktree en 63a2794, idéntico a la rama de trabajo claude/focused-euler-f9knvw). NO modifiques
ningún archivo versionado; experimentos en /home/user/wt-lectura/x15/cruces/ (ignorado por git). Una sola app en index.html (~22 mil
líneas, CRLF, con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300,
o node/python para imprimir rebanadas; p. ej. un script que localice cada function computeX y liste los identificadores S.<otro motor>,
SYS, VENT, AIRE, HIDRO, FUEGO, CLEAN, QUOTE, EQUIP, DUCT, LOAD que se leen dentro).
Arnés listo (carga en 2.6 s): import { cargar } from "/home/user/wt-lectura/x15/arnes.mjs"; const w = await cargar(); const G = (e) => w.eval(e);
const S = G("S");  — proyecto de prueba del banco en pruebas.mjs (function proyectoDePrueba, aceptarSoporte, aceptarEquip).
Los bancos ya están en verde en 63a2794: NO los corras; mide con scripts pequeños.
Contexto: el dueño decidió (27-sep-2026) que TODOS los motores son independientes: cada disciplina calcula sólo con los datos que se le
capturan en su pestaña; nada se hereda ni se lee en vivo de otra; lo de otra entra sólo como PROPUESTA aceptada (instantánea, regla 2)
y ya aceptada no se mueve sola (regla 3). Ya se independizaron vent (H-262/H-263), fuego (H-264), civil (H-265), soporte (H-266),
equip (H-267: zonas de selección propias o aceptadas) y elec (H-268: cargas sólo como propuesta cedula>elec aceptada). HEREDA está
vacío. Mecanismos: PROPUESTAS/LINKS/linkAllowed/propAceptar/registrarVinculo (reglas 2/3), ENTRADAS[id]/huellaMotor/selloDe (sellos),
sanearEstado/recompute. Ya se sabe (confírmalo y detállalo): duct>equip lee la presión de ductos en vivo con permiso; la memoria de
selección §8 imprime la preselección de carga (r.eq); S.bldDiv se captura en Proyecto.
Ritmo: directo; español; archivo:línea en 63a2794.
`
const HALLAZGOS = { type: 'object', properties: { cruces: { type: 'array', items: { type: 'object', properties: {
  motor: { type: 'string' }, funcion: { type: 'string' }, linea: { type: 'integer' },
  leeDe: { type: 'string', description: 'motor o estado ajeno que se lee (p. ej. S.load.zones, SYS.cfm, computeVent())' },
  expresion: { type: 'string', description: 'la expresión exacta, recortada' },
  tipo: { type: 'string', enum: ['vivo', 'propuesta-aceptada', 'hereda', 'solo-texto', 'solo-entregable'] },
  mueveCifras: { type: 'boolean' }, pruebaQueLoCubre: { type: 'string' }, comoIndependizar: { type: 'string' } },
  required: ['motor', 'funcion', 'linea', 'leeDe', 'expresion', 'tipo', 'mueveCifras'] } }, resumen: { type: 'string' } },
  required: ['cruces', 'resumen'] }
const VEREDICTOS = { type: 'object', properties: { veredictos: { type: 'array', items: { type: 'object', properties: {
  indice: { type: 'integer' }, real: { type: 'boolean' }, razon: { type: 'string' }, tipoCorregido: { type: 'string' }, mueveCifras: { type: 'boolean' } },
  required: ['indice', 'real', 'razon', 'mueveCifras'] } } }, required: ['veredictos'] }
const PARES = [
  { key: 'clean-duct', motores: 'clean (cuartos limpios, computeClean) y duct (ductos, computeDuct)' },
  { key: 'aire-hidro', motores: 'aire (aire comprimido, computeAire) e hidro (hidráulico/sanitario, computeHidro)' },
  { key: 'equip-quote', motores: 'equip (selección de equipo, computeEquip/EQUIP: tras H-267 queda duct>equip y la memoria §8) y quote (cotización, computeQuote/QUOTE: agrega cantidades de todas las disciplinas; distingue lectura en vivo de instantánea aceptada)' },
  { key: 'valor-kaizen-load', motores: 'valor (ingeniería de valor), kaizen y load (carga térmica, computeLoad: sólo cruces distintos de miscVent, que ya es propuesta aceptada)' },
]
phase('Leer')
const resultados = await pipeline(
  PARES,
  p => agent(`${BASE}
Eres el lector de los motores ${p.motores}. Localiza sus funciones de cálculo (function computeX y las auxiliares que llaman) y sus
vistas viewX/memoria PDF/Excel. Enumera CADA lectura de estado o resultado ajeno a la pestaña propia: S.<otro>, SYS, VENT, AIRE, HIDRO,
FUEGO, CLEAN, QUOTE, EQUIP, DUCT, LOAD, computeOtro(), herDe(), HEREDA, y lecturas indirectas (una auxiliar que lee S.load y la llama
computeDuct). Clasifica: 'vivo' (entra al cálculo sin propuesta aceptada), 'propuesta-aceptada' (sólo vía PROPUESTAS/propAceptar/snapshot
y no se mueve sola), 'hereda', 'solo-texto' (pantalla, no mueve cifras), 'solo-entregable' (memoria/Excel/PDF con cifras de otro motor).
Para cada uno di si mueve cifras y qué prueba del banco lo cubre (grep en pruebas.mjs). Comprueba en jsdom (x15/cruces/${p.key}/) al
menos los dos cruces más importantes: cambia el dato ajeno y muestra si la cifra propia se mueve. Devuelve el objeto estructurado.`,
    { label: `leer:${p.key}`, phase: 'Leer', schema: HALLAZGOS, effort: 'high' }),
  (r, p) => {
    if (!r) return null
    const vivos = (r.cruces || []).filter(c => c.tipo === 'vivo' || c.tipo === 'hereda')
    if (!vivos.length) return { par: p.key, resumen: r.resumen, todos: r.cruces || [], verificados: [] }
    return agent(`${BASE}
Eres el escéptico del par ${p.key}. Un lector afirma estos cruces en vivo (índice = posición en la lista):
${JSON.stringify(vivos.map((c, i) => ({ indice: i, ...c })), null, 2)}
Intenta REFUTAR cada uno leyendo el código real en esas líneas y su contexto: ¿la lectura ocurre de verdad dentro del cálculo propio, o
sólo en un texto/entregable, o sólo con una propuesta aceptada (linkAllowed/propAceptar/snapshot)? Para los que muevan cifras haz un
experimento en jsdom (x15/cruces/verif-${p.key}/) cambiando el dato ajeno y midiendo la cifra propia. Si no puedes confirmarlo con el
código o el experimento, real=false. Devuelve un veredicto por índice.`,
      { label: `verificar:${p.key}`, phase: 'Verificar', schema: VEREDICTOS })
      .then(v => ({ par: p.key, resumen: r.resumen, todos: r.cruces || [],
        verificados: vivos.map((c, i) => ({ ...c, veredicto: ((v && v.veredictos) || []).find(x => x.indice === i) || null })) }))
  },
)
phase('Sintetizar')
const ok = resultados.filter(Boolean)
const confirmados = ok.flatMap(r => r.verificados.filter(v => v.veredicto && v.veredicto.real))
const sinVeredicto = ok.flatMap(r => r.verificados.filter(v => !v.veredicto))
if (sinVeredicto.length) log(`${sinVeredicto.length} cruces quedaron sin veredicto del escéptico (van al mapa como «sin verificar»)`)
const noVivos = ok.flatMap(r => (r.todos || []).filter(c => c.tipo !== 'vivo' && c.tipo !== 'hereda'))
log(`${confirmados.length} cruces en vivo confirmados; ${noVivos.length} cruces no vivos (propuesta/texto/entregable)`)
const mapa = await agent(`${BASE}
Eres el sintetizador. Con estos cruces en vivo CONFIRMADOS:
${JSON.stringify(confirmados, null, 2)}
estos SIN VERIFICAR:
${JSON.stringify(sinVeredicto, null, 2)}
y estos NO vivos (propuesta aceptada, sólo texto, sólo entregable):
${JSON.stringify(noVivos, null, 2)}
y los resúmenes de los lectores:
${JSON.stringify(ok.map(r => ({ par: r.par, resumen: r.resumen })), null, 2)}
escribe el mapa /home/user/wt-lectura/x15/cruces/mapa-cruces-restantes.md: una tabla por motor (función, línea, qué lee, tipo, mueve
cifras, prueba que lo cubre, cómo independizarlo) y al final la lista de hallazgos H-274 en adelante que harían falta (salta H-275 y
H-276, reservados; H-277 ya está usado: después de H-274 sigue H-278), uno por motor, cada uno con: qué se retira, qué se captura en su
pestaña, si hace falta propuesta aceptada (y de quién), migración de proyectos guardados (misma cifra al abrir), pruebas viejas que se
reescribirían y la prueba nueva que debe fallar hoy. Para quote, valor y kaizen (agregadores por naturaleza) di explícitamente qué
leen hoy en vivo y propón la forma de la instantánea. Señala las decisiones que cambian resultados y que el dueño debe tomar (pocas y
concretas). Devuelve el contenido completo del archivo.`,
  { label: 'sintetizar', phase: 'Sintetizar', effort: 'high' })
return { confirmados: confirmados.length, sinVerificar: sinVeredicto.length, noVivos: noVivos.length, mapa }
