export const meta = {
  name: 'entregables-contenido',
  description: 'Emite la memoria PDF y el Excel de los motores tocados por H-262…H-266 (load, vent, fuego, civil, soporte) y verifica su CONTENIDO con Python: procedencia (regla 8), campos nuevos, espejo ES/EN, sin nombres de clientes, sin fechas o aleatorios que rompan la identidad',
  phases: [{ title: 'Emitir', detail: 'un agente emite y extrae' }, { title: 'Verificar', detail: 'un escéptico revisa los hallazgos' }],
}

const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). Una sola app en index.html (~22 mil líneas, CRLF,
con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300).
Banco: pruebas.mjs (jsdom): mira cómo sus pruebas de PDF/Excel (--p-*, --senal, PdfDoc, generación de xlsx) emiten los entregables y
obtienen los bytes; imita eso en un arnés propio en /home/user/emp_suite/x15/entregables/ (x15 está en .gitignore). NO modifiques el
repositorio. Tienes Node 22 y Python 3 (biblioteca estándar: zlib para inflar los flujos del PDF y extraer el texto de los operadores
Tj/TJ; zipfile + xml.etree para leer sharedStrings y las hojas del xlsx; comprueba antes si pypdf u openpyxl están instalados con
python3 -c "import pypdf, openpyxl"; si no, la stdlib basta). Reglas de la casa: /home/user/emp_suite/CLAUDE.md (regla 8 procedencia;
espejo ES/EN; sin nombres de clientes los nombres vetados (lista VETADOS de pruebas.mjs); identidad de PDF/Excel intacta). Español, archivo:línea.
Contexto: H-262…H-266 independizaron vent, fuego, civil, soporte y llevaron el ventilador seleccionado a carga térmica como
«Misceláneos · Ventilación» (HP estimado de catálogo, procedencia declarada); soportería toma metros de otros motores sólo por
instantánea aceptada (fecha/origen en la memoria).
`

const HALLAZGOS = {
  type: 'object',
  properties: {
    emitidos: { type: 'array', items: { type: 'object', properties: { motor: { type: 'string' }, tipo: { type: 'string' }, archivo: { type: 'string' }, bytes: { type: 'integer' }, textoExtraido: { type: 'integer' } }, required: ['motor', 'tipo', 'archivo'] } },
    hallazgos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          motor: { type: 'string' },
          entregable: { type: 'string' },
          regla: { type: 'string' },
          evidencia: { type: 'string' },
          donde: { type: 'string', description: 'archivo:línea del código que emite' },
          arreglo: { type: 'string' },
        },
        required: ['titulo', 'motor', 'entregable', 'regla', 'evidencia', 'arreglo'],
      },
    },
    resumen: { type: 'string' },
  },
  required: ['emitidos', 'hallazgos', 'resumen'],
}
const VEREDICTO = { type: 'object', properties: { real: { type: 'boolean' }, razon: { type: 'string' } }, required: ['real', 'razon'] }

phase('Emitir')
const e = await agent(`${BASE}
Eres el emisor. Con el proyecto de regresión (parches/regresion-motores/regresion-motores.emp.json, que ya trae vent/fuego/civil
capturados y la instantánea de soportería; si hace falta selecciona el ventilador y asígnalo a una zona como hace la prueba S.99 en
pruebas.mjs) emite en jsdom, para load, vent, fuego, civil y soporte: la memoria PDF, el Excel y, si existe, la memoria integral.
Guarda los archivos en x15/entregables/ y extrae su texto con Python. Verifica en cada uno: (a) procedencia (regla 8): la fila de
misceláneos de ventilación en load dice de dónde viene (ventilación, modelo, HP ESTIMADO de catálogo, no dato de placa); la memoria de
soportería dice que los metros vienen de una instantánea aceptada y de qué motores; fuego/civil/vent declaran «capturado en esta
pestaña»; (b) los campos nuevos aparecen con sus cifras (áreas y cuartos de civil, alturas de soportería, área/altura de fuego,
área/altura/ocupantes de vent); (c) espejo: emite en EN (cambia el idioma como lo haga la app) y comprueba que no queden textos en
español; (d) sin nombres de clientes; (e) identidad: emite dos veces el mismo entregable y compara bytes: si difieren, localiza la
fecha/aleatorio responsable (archivo:línea) — salvo que el código declare a propósito la fecha de emisión; (f) memoria integral/tabla de
origen (trazaHerencia): que ya no diga «heredado» para vent/fuego/civil. Devuelve el objeto estructurado.`,
  { label: 'emitir:cinco-motores', phase: 'Emitir', schema: HALLAZGOS })

phase('Verificar')
const verificados = e ? await parallel((e.hallazgos || []).slice(0, 8).map(h => () =>
  agent(`${BASE}
Eres el escéptico. El emisor afirma sobre un entregable:
${JSON.stringify(h, null, 2)}
Intenta REFUTARLO: vuelve a emitir ese entregable en jsdom (x15/entregables/), extrae el texto con Python y comprueba la afirmación
letra por letra; lee la regla citada en CLAUDE.md tal cual está. Si no se sostiene, real=false. Devuelve el veredicto.`,
    { label: `verificar:${h.titulo.slice(0, 40)}`, phase: 'Verificar', schema: VEREDICTO }).then(v => ({ ...h, veredicto: v }))
)) : []
const confirmados = verificados.filter(Boolean).filter(h => h.veredicto && h.veredicto.real)
log(`${(e && e.emitidos || []).length} entregables emitidos; ${confirmados.length} hallazgos confirmados`)
return { emitidos: e && e.emitidos, resumen: e && e.resumen, confirmados, refutados: verificados.filter(Boolean).filter(h => !(h.veredicto && h.veredicto.real)).map(h => ({ titulo: h.titulo, razon: h.veredicto && h.veredicto.razon })) }