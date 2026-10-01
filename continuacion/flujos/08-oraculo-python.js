export const meta = {
  name: 'oraculo-python',
  description: 'Oráculo en Python: reimplementa las fórmulas de vent, fuego, civil y soporte leídas del código, las corre sobre el proyecto de regresión y compara con el esperado; cada discrepancia se verifica antes de reportarla',
  phases: [
    { title: 'Reimplementar', detail: 'un agente por motor escribe el oráculo en Python y compara' },
    { title: 'Verificar', detail: 'un escéptico decide si la discrepancia es del oráculo o del motor' },
  ],
}

const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). Una sola app en index.html (~22 mil líneas,
CRLF, con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300).
Tienes Node 22 y Python 3 (comprueba con python3 -c "import json,math"; no instales paquetes de red sin necesidad; la biblioteca
estándar basta). Regresión: parches/regresion-motores/genera.mjs construye el proyecto, parches/regresion-motores/regresion-motores.emp.json
es el proyecto guardado y parches/regresion-motores/regresion-motores.esperado.json trae los resultados esperados por motor (léelo con
python3 -m json.tool | head para ver su forma). Reglas de la casa: /home/user/emp_suite/CLAUDE.md (regla 4: nada de memoria; regla 6:
nada se estima). Contexto: los motores se independizaron (vent H-262, fuego H-264, civil H-265, soporte H-266): cada uno calcula sólo
con lo capturado en su pestaña o con una instantánea aceptada.
Trabajo de SÓLO LECTURA sobre el repositorio: escribe tu oráculo en /home/user/emp_suite/x15/oraculo/<motor>.py (x15 está en
.gitignore). No toques index.html ni el banco. Español, archivo:línea.
`

const DISCREPANCIAS = {
  type: 'object',
  properties: {
    motor: { type: 'string' },
    archivoOraculo: { type: 'string' },
    camposComparados: { type: 'integer' },
    coinciden: { type: 'integer' },
    discrepancias: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          campo: { type: 'string' },
          esperado: { type: 'string' },
          oraculo: { type: 'string' },
          formulaCodigo: { type: 'string', description: 'la fórmula tal como está en index.html, con línea' },
          formulaOraculo: { type: 'string' },
          sospecha: { type: 'string', enum: ['error-del-motor', 'error-del-oraculo', 'redondeo', 'sin-decidir'] },
          explicacion: { type: 'string' },
        },
        required: ['campo', 'esperado', 'oraculo', 'formulaCodigo', 'sospecha', 'explicacion'],
      },
    },
    resumen: { type: 'string' },
  },
  required: ['motor', 'archivoOraculo', 'camposComparados', 'coinciden', 'discrepancias', 'resumen'],
}

const VEREDICTO = {
  type: 'object',
  properties: {
    culpable: { type: 'string', enum: ['motor', 'oraculo', 'redondeo', 'sin-decidir'] },
    razon: { type: 'string' },
    normaOCriterio: { type: 'string', description: 'norma con edición y año o criterio de la casa declarado en el código; BLOQUEADO si el texto no está en parches/normas-texto/' },
    hallazgoPropuesto: { type: 'string' },
  },
  required: ['culpable', 'razon'],
}

const MOTORES = [
  { key: 'vent', fn: 'computeVent', que: 'ventilación: CFM por área/ocupantes/renovaciones, presión estática, BHP/HP, selección' },
  { key: 'fuego', fn: 'computeFuego', que: 'contra incendio: densidad/área de diseño, caudal, rociadores, tubería, red' },
  { key: 'civil', fn: 'computeCivil', que: 'obra civil: áreas, perímetros, cuartos, muros/losas/acabados y cantidades' },
  { key: 'soporte', fn: 'computeSoporte', que: 'soportería: metros de ductos/tuberías capturados o de instantánea, soportes, bases, viento/sismo' },
]

phase('Reimplementar')
const resultados = await pipeline(
  MOTORES,
  m => agent(`${BASE}
Eres el oráculo del motor ${m.key} (${m.que}). Lee function ${m.fn} en index.html completa (con sus auxiliares) y reimplementa en
Python puro (biblioteca estándar) exactamente las mismas fórmulas, sin corregir nada que te parezca raro: el oráculo debe reflejar el
código tal cual y las diferencias se reportan, no se arreglan. Entrada: el proyecto guardado regresion-motores.emp.json (la parte del
motor ${m.key} y, si el motor toma una instantánea aceptada, la instantánea guardada en el proyecto). Salida: los mismos campos que el
esperado guarda para ${m.key} en regresion-motores.esperado.json. Corre python3 x15/oraculo/${m.key}.py, compara campo por campo
(tolerancia: igualdad exacta tras el mismo redondeo que aplica el código) e informa cuántos coinciden y cada discrepancia con la fórmula
del código (archivo:línea) y la del oráculo. Si un campo del esperado no puedes reproducirlo porque depende de datos que no están en
el proyecto guardado, repórtalo como discrepancia 'sin-decidir' con la explicación. Devuelve el objeto estructurado.`,
    { label: `oraculo:${m.key}`, phase: 'Reimplementar', schema: DISCREPANCIAS }),
  (r, m) => r ? parallel((r.discrepancias || []).filter(d => d.sospecha !== 'redondeo').slice(0, 6).map(d => () =>
    agent(`${BASE}
Eres el escéptico del motor ${m.key}. El oráculo en Python (${r.archivoOraculo}) discrepa del esperado en este campo:
${JSON.stringify(d, null, 2)}
Decide quién tiene razón leyendo el código real (function ${m.fn} y auxiliares, archivo:línea), corriendo el oráculo y, si hace falta,
un experimento en jsdom (node, x15/oraculo/) que imprima el valor intermedio del motor. Si el culpable es el motor, di qué norma o
criterio de la casa declarado en el código se está violando (con edición y año; BLOQUEADO si su texto no está en
parches/normas-texto/) y redacta el hallazgo H-nnn propuesto en una línea (motor · qué). Devuelve el veredicto estructurado.`,
      { label: `verificar:${m.key}:${d.campo}`, phase: 'Verificar', schema: VEREDICTO })
      .then(v => ({ ...d, veredicto: v }))
  )).then(vs => ({ motor: m.key, archivo: r.archivoOraculo, comparados: r.camposComparados, coinciden: r.coinciden, resumen: r.resumen, discrepancias: vs.filter(Boolean) })) : null,
)

const limpio = resultados.filter(Boolean)
const delMotor = limpio.flatMap(r => r.discrepancias.filter(d => d.veredicto && d.veredicto.culpable === 'motor').map(d => ({ motor: r.motor, ...d })))
log(`${limpio.length} oráculos; ${delMotor.length} discrepancias atribuidas al motor`)
return { oraculos: limpio.map(r => ({ motor: r.motor, archivo: r.archivo, comparados: r.comparados, coinciden: r.coinciden, resumen: r.resumen })), delMotor, todas: limpio.flatMap(r => r.discrepancias.map(d => ({ motor: r.motor, ...d }))) }