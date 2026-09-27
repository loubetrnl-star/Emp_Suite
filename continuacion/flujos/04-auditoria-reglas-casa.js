export const meta = {
  name: 'auditoria-reglas-casa',
  description: 'Auditoría, verificada adversarialmente, del estado actual de EMP Suite (HEAD fcda936) contra las reglas de la casa: espejo ES/EN, nombres de clientes, Date.now/aleatorios en fixtures, sellos y contrato selfCheck, coherencia MOTOR_VER/MOTOR_CAMBIOS/CHANGELOG/esperado, procedencia en entregables',
  phases: [
    { title: 'Revisar', detail: 'tres lentes independientes sobre los cambios desde 7d7c2d0' },
    { title: 'Verificar', detail: 'un escéptico por hallazgo' },
  ],
}

const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). Una sola app en index.html (~22 mil líneas, CRLF,
con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300, git
diff 7d7c2d0..HEAD -- index.html | cut -c1-300, o python3 para analizar). Banco: pruebas.mjs (jsdom); regresión en
parches/regresion-motores/. Reglas de la casa: /home/user/emp_suite/CLAUDE.md (léelo completo; audita contra su texto, no contra tu
memoria). Trabajo de SÓLO LECTURA (experimentos en /home/user/emp_suite/x15/auditoria/). Español, archivo:línea.
Contexto: desde 7d7c2d0 (PAUSA) se hicieron H-262…H-266 (independencia de vent, load↔vent como propuesta aceptada, fuego, civil,
soporte) con migración de proyectos guardados. Se audita TODO el estado actual, con énfasis en lo cambiado.
`

const HALLAZGOS = {
  type: 'object',
  properties: {
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          regla: { type: 'string', description: 'la regla de CLAUDE.md que se viola, citada' },
          donde: { type: 'string', description: 'archivo:línea' },
          evidencia: { type: 'string', description: 'fragmento recortado o salida de comando' },
          impacto: { type: 'string', enum: ['mueve-cifras', 'pantalla', 'entregable', 'proceso'] },
          arreglo: { type: 'string' },
        },
        required: ['titulo', 'regla', 'donde', 'evidencia', 'impacto', 'arreglo'],
      },
    },
    resumen: { type: 'string' },
  },
  required: ['hallazgos', 'resumen'],
}

const VEREDICTO = {
  type: 'object',
  properties: { real: { type: 'boolean' }, razon: { type: 'string' }, arregloCorregido: { type: 'string' } },
  required: ['real', 'razon'],
}

const LENTES = [
  { key: 'espejo-y-textos', que: `ESPEJO ES/EN Y TEXTOS: en el código agregado o cambiado desde 7d7c2d0 (git diff), toda cadena visible debe pasar por L(es,en) con
las dos versiones (busca literales en español fuera de L(), L() con un solo argumento o con EN igual al ES, avisos/etiquetas nuevas de
vent/load/fuego/civil/soporte). Nombres de clientes prohibidos en pantalla, docs, fixtures y pruebas: los nombres vetados (lista VETADOS de pruebas.mjs)
(grep -i en todo el repo, incluidos parches/ y pruebas). Textos de guía dentro de la vista (deben ir en la guía, no en la pantalla).` },
  { key: 'sellos-y-estado', que: `SELLOS Y ESTADO: cada campo que lee computeX debe estar en ENTRADAS[id] (o excluido a propósito con sinClaves con razón) para que el
sello (huellaMotor/selloDe) cambie cuando cambia la entrada; verifica con un experimento en jsdom para load (miscVent), vent
(seleccion), fuego, civil (areas/cuartos), soporte (alturas, usarMotores, snap). Contrato selfCheck 16.4: campos leídos deben estar
declarados en defaultState/sanearEstado (null, no delete). Date.now()/Math.random()/new Date() en fixtures o en datos que entran a
sellos o a la regresión. histSnap (deshacer) en cada acción nueva. Migraciones: la bandera de sanearEstado se consume una sola vez y no
deja el proyecto «sucio» al abrir (prueba: abrir el fixture de regresión, sin tocar nada, no debe marcar cambios).` },
  { key: 'versiones-y-entregables', que: `VERSIONES Y ENTREGABLES: coherencia entre MOTOR_VER, MOTOR_CAMBIOS (una entrada por versión con rev y qué), CHANGELOG-motores.md
(una fila por versión) y parches/regresion-motores/*.esperado.json (regenerado con genera.mjs: córrelo en x15/auditoria/ y compara con
el esperado del repo; cualquier diferencia es hallazgo). Procedencia (regla 8) en las memorias/Excel/PDF de los cinco motores tocados:
cada cifra que viene de otra pestaña o de una instantánea debe decir de dónde y cuándo (miscVent en load; instantánea en soporte).
Pruebas del banco que hoy pasan sin ejercer la conducta que dicen probar (aserciones vacías, try/catch que traga). Sin Date.now en
pruebas de identidad de PDF/Excel.` },
]

phase('Revisar')
const revisados = await pipeline(
  LENTES,
  l => agent(`${BASE}
Eres el revisor con la lente ${l.key}. ${l.que}
Sólo hallazgos con evidencia (comando + salida recortada o archivo:línea). Devuelve el objeto estructurado.`,
    { label: `revisar:${l.key}`, phase: 'Revisar', schema: HALLAZGOS }),
  (r, l) => r ? parallel((r.hallazgos || []).slice(0, 8).map(h => () =>
    agent(`${BASE}
Eres el escéptico. Un revisor (lente ${l.key}) afirma:
${JSON.stringify(h, null, 2)}
Intenta REFUTARLO con el código real y, si aplica, un experimento en jsdom (x15/auditoria/). Lee la regla citada en CLAUDE.md tal
cual está escrita: si la regla no dice lo que el revisor afirma, real=false. Devuelve el veredicto estructurado.`,
      { label: `verificar:${h.titulo.slice(0, 40)}`, phase: 'Verificar', schema: VEREDICTO })
      .then(v => ({ ...h, lente: l.key, veredicto: v }))
  )).then(vs => ({ lente: l.key, resumen: r.resumen, hallazgos: vs.filter(Boolean) })) : null,
)

const limpio = revisados.filter(Boolean)
const confirmados = limpio.flatMap(r => r.hallazgos.filter(h => h.veredicto && h.veredicto.real))
const refutados = limpio.flatMap(r => r.hallazgos.filter(h => !(h.veredicto && h.veredicto.real)))
log(`${confirmados.length} hallazgos confirmados, ${refutados.length} refutados`)
return { resumenes: limpio.map(r => ({ lente: r.lente, resumen: r.resumen })), confirmados, refutados: refutados.map(h => ({ titulo: h.titulo, razon: h.veredicto && h.veredicto.razon })) }