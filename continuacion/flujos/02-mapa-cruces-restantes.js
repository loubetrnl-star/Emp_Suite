export const meta = {
  name: 'mapa-cruces-restantes',
  description: 'Inventario, verificado adversarialmente, de las lecturas en vivo entre motores que aún quedan (clean, duct, aire, hidro, equip, quote, valor, kaizen) tras H-262…H-266',
  phases: [
    { title: 'Leer', detail: 'cuatro lectores, dos motores cada uno' },
    { title: 'Verificar', detail: 'un escéptico intenta refutar cada cruce' },
    { title: 'Sintetizar', detail: 'un mapa único en el scratchpad' },
  ],
}

const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). Una sola app en index.html (~22 mil líneas,
CRLF, con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300,
o node/python para imprimir rebanadas). Banco: pruebas.mjs (jsdom). Tienes Node 22 y Python 3: úsalos para analizar el código (por
ejemplo, un script en Python que localice cada function computeX y liste los identificadores S.<otro motor>, SYS, VENT, AIRE, HIDRO,
FUEGO, CLEAN, QUOTE, EQUIP que se leen dentro). Reglas de la casa en /home/user/emp_suite/CLAUDE.md.
Contexto: el dueño decidió (27-sep-2026) que TODOS los motores son independientes: cada disciplina calcula sólo con los datos que se le
capturan en su pestaña; nada se hereda ni se lee en vivo de otra; lo de otra entra sólo como PROPUESTA aceptada (instantánea, regla 2)
y ya aceptada no se mueve sola (regla 3). Ya se independizaron vent (H-262/H-263), fuego (H-264), civil (H-265), soporte (H-266);
eléctrico (H-268) está en curso en otra rama. HEREDA está vacío. Mecanismos: PROPUESTAS/LINKS/linkAllowed/propAceptar/registrarVinculo
(regla 2/3), ENTRADAS[id]/huellaMotor/selloDe (sellos), sanearEstado/recompute.
Trabajo de SÓLO LECTURA (experimentos en /home/user/emp_suite/x15/cruces/). Español, archivo:línea. No toques el repositorio.
`

const HALLAZGOS = {
  type: 'object',
  properties: {
    cruces: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          motor: { type: 'string' },
          funcion: { type: 'string' },
          linea: { type: 'integer' },
          leeDe: { type: 'string', description: 'motor o estado ajeno que se lee (p. ej. S.load.zones, SYS.cfm, computeVent())' },
          expresion: { type: 'string', description: 'la expresión exacta, recortada' },
          tipo: { type: 'string', enum: ['vivo', 'propuesta-aceptada', 'hereda', 'solo-texto', 'solo-entregable'] },
          mueveCifras: { type: 'boolean' },
          pruebaQueLoCubre: { type: 'string' },
          comoIndependizar: { type: 'string' },
        },
        required: ['motor', 'funcion', 'linea', 'leeDe', 'expresion', 'tipo', 'mueveCifras'],
      },
    },
    resumen: { type: 'string' },
  },
  required: ['cruces', 'resumen'],
}

const VEREDICTO = {
  type: 'object',
  properties: {
    real: { type: 'boolean' },
    razon: { type: 'string' },
    tipoCorregido: { type: 'string' },
    mueveCifras: { type: 'boolean' },
  },
  required: ['real', 'razon', 'mueveCifras'],
}

const PARES = [
  { key: 'clean-duct', motores: 'clean (cuartos limpios, computeClean) y duct (ductos, computeDuct)' },
  { key: 'aire-hidro', motores: 'aire (aire comprimido, computeAire) e hidro (hidráulico/sanitario, computeHidro)' },
  { key: 'equip-quote', motores: 'equip (selección de equipo, computeEquip/EQUIP) y quote (cotización, computeQuote/QUOTE)' },
  { key: 'valor-kaizen-load', motores: 'valor (ingeniería de valor), kaizen y load (carga térmica, computeLoad: sólo cruces distintos de miscVent que ya es propuesta aceptada)' },
]

phase('Leer')
const resultados = await pipeline(
  PARES,
  p => agent(`${BASE}
Eres el lector de los motores ${p.motores}. Localiza sus funciones de cálculo (function computeX, y las funciones auxiliares que
llaman) y sus vistas viewX/memoria PDF/Excel. Enumera CADA lectura de estado o resultado ajeno a la pestaña propia: S.<otro>, SYS,
VENT, AIRE, HIDRO, FUEGO, CLEAN, QUOTE, EQUIP, LOAD, computeOtro(), herDe(), HEREDA, y también lecturas indirectas (una función
auxiliar que lee S.load y la llama computeDuct). Clasifica: 'vivo' (entra al cálculo sin propuesta aceptada), 'propuesta-aceptada'
(entra sólo vía PROPUESTAS/propAceptar/snapshot y no se mueve sola), 'hereda', 'solo-texto' (aparece en pantalla pero no mueve cifras),
'solo-entregable' (memoria/Excel/PDF que trae cifras de otro motor). Para cada uno di si mueve cifras y qué prueba del banco lo cubre
(grep en pruebas.mjs). Comprueba con un experimento en jsdom (x15/cruces/) al menos los dos cruces que juzgues más importantes:
cambia el dato ajeno y muestra si la cifra propia se mueve. Devuelve el objeto estructurado.`,
    { label: `leer:${p.key}`, phase: 'Leer', schema: HALLAZGOS }),
  (r, p) => r ? parallel((r.cruces || []).filter(c => c.tipo === 'vivo' || c.tipo === 'hereda').map(c => () =>
    agent(`${BASE}
Eres el escéptico. Un lector afirma este cruce en vivo entre motores:
${JSON.stringify(c, null, 2)}
Intenta REFUTARLO leyendo el código real en esas líneas (y su contexto): ¿la lectura ocurre de verdad dentro del cálculo propio, o sólo
en un texto/entregable, o sólo cuando hay una propuesta aceptada (linkAllowed/propAceptar/snapshot)? Haz un experimento en jsdom
(x15/cruces/) cambiando el dato ajeno y midiendo la cifra propia. Si no puedes confirmarlo con el código o el experimento, real=false.
Devuelve el veredicto estructurado.`,
      { label: `verificar:${c.motor}:${c.funcion}`, phase: 'Verificar', schema: VEREDICTO })
      .then(v => ({ ...c, veredicto: v }))
  )).then(vs => ({ par: p.key, resumen: r.resumen, todos: r.cruces, verificados: vs.filter(Boolean) })) : null,
)

phase('Sintetizar')
const confirmados = resultados.filter(Boolean).flatMap(r => r.verificados.filter(v => v.veredicto && v.veredicto.real))
const noVivos = resultados.filter(Boolean).flatMap(r => (r.todos || []).filter(c => c.tipo !== 'vivo' && c.tipo !== 'hereda'))
log(`${confirmados.length} cruces en vivo confirmados; ${noVivos.length} cruces no vivos (propuesta/texto/entregable)`)
const mapa = await agent(`${BASE}
Eres el sintetizador. Con estos cruces en vivo CONFIRMADOS:
${JSON.stringify(confirmados, null, 2)}
y estos cruces NO vivos (propuesta aceptada, sólo texto, sólo entregable):
${JSON.stringify(noVivos, null, 2)}
y los resúmenes de los lectores:
${JSON.stringify(resultados.filter(Boolean).map(r => ({ par: r.par, resumen: r.resumen })), null, 2)}
escribe el mapa /tmp/claude-0/-home-user-H1/8ecf4688-1415-58de-88cd-6505b3ae1775/scratchpad/mapa-cruces-restantes.md (ese archivo sí
puedes escribirlo): una tabla por motor (función, línea, qué lee, tipo, mueve cifras, prueba que lo cubre, cómo independizarlo) y al
final la lista de hallazgos H-274 en adelante que harían falta, uno por motor, cada uno con: qué se retira, qué se captura en su
pestaña, si hace falta propuesta aceptada (y de quién), migración de proyectos guardados (misma cifra al abrir), pruebas viejas que se
reescribirían y la prueba nueva que debe fallar hoy. Señala las decisiones que cambian resultados y que el dueño debe tomar (pocas y
concretas). Devuelve el contenido completo del archivo.`,
  { label: 'sintetizar', phase: 'Sintetizar' })
return { confirmados: confirmados.length, noVivos: noVivos.length, mapa }