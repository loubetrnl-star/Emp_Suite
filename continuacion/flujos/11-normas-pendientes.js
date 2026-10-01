export const meta = {
  name: 'normas-pendientes',
  description: 'Inventario de todas las normas y criterios citados por los motores de EMP Suite, con o sin texto en parches/normas-texto/, y la lista exacta de textos que el dueño debe suministrar',
  phases: [
    { title: 'Leer', detail: 'dos lectores: código y parches/documentos' },
    { title: 'Sintetizar', detail: 'una lista única para el dueño' },
  ],
}

const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). Una sola app en index.html (~22 mil líneas, CRLF,
con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300, o
python3 para extraer citas con expresiones regulares). Reglas de la casa: /home/user/emp_suite/CLAUDE.md, en particular la regla 4
(nada de memoria: el texto de la norma debe estar en parches/normas-texto/ o el cálculo se marca BLOQUEADO) y la regla 6 (nada se
estima: «pendiente»). Trabajo de SÓLO LECTURA (experimentos en /home/user/emp_suite/x15/normas/). Español, archivo:línea.
`

const CITAS = {
  type: 'object',
  properties: {
    citas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          norma: { type: 'string', description: 'p. ej. NOM-001-SEDE-2012, NFPA 13 (2022), SMACNA HVAC Duct Construction Standards 2005, ASHRAE 62.1-2019' },
          seccionOTabla: { type: 'string' },
          motor: { type: 'string' },
          donde: { type: 'string', description: 'archivo:línea' },
          cifraQueDepende: { type: 'string' },
          estado: { type: 'string', enum: ['con-texto', 'bloqueado-marcado', 'citada-sin-texto-ni-marca', 'criterio-de-la-casa'] },
          archivoTexto: { type: 'string' },
        },
        required: ['norma', 'motor', 'donde', 'estado'],
      },
    },
    resumen: { type: 'string' },
  },
  required: ['citas', 'resumen'],
}

phase('Leer')
const lecturas = await parallel([
  () => agent(`${BASE}
Eres el lector del CÓDIGO. Con python3 (re) recorre index.html y lista cada cita de norma o criterio: NOM-, NFPA, SMACNA, ASHRAE,
AISC, ACI, CFE, NTC, ANSI, ISO, IEC, UL, ASME, Carrier, ASPE, IAPMO, «criterio de la casa», y las marcas BLOQUEADO/bloqueado. Para
cada una: motor (por la function computeX o vista que la contiene), archivo:línea, la cifra o tabla que depende de ella (p. ej.
ampacidad del calibre, densidad de rociado, coeficiente sísmico), y su estado: 'con-texto' si el archivo correspondiente existe en
parches/normas-texto/ (lista esa carpeta y ábrelos para confirmar que traen la sección/tabla citada), 'bloqueado-marcado' si el
código marca BLOQUEADO al usuario, 'citada-sin-texto-ni-marca' si se usa un valor citando la norma sin texto ni marca (violación de la
regla 4: repórtala), 'criterio-de-la-casa' si el código lo declara así. Devuelve el objeto estructurado.`,
    { label: 'leer:codigo', phase: 'Leer', schema: CITAS }),
  () => agent(`${BASE}
Eres el lector de PARCHES Y DOCUMENTOS. Revisa parches/normas-texto/ (qué hay, de qué norma, edición/año, secciones/tablas que trae),
parches/casos-a-mano/*.pendientes.md, CHANGELOG-motores.md, CLAUDE.md, PAUSA.md, RELEVO*.md y cualquier *.md del repo: lista cada norma
o tabla que se declara pendiente de que el dueño la suministre (p. ej. SMACNA DCS, NFPA 13 T17.4.2.1(a), NFPA 96, Carrier Parte 1 Tabla
20A, ANSI Z358.1, AISC 360, CFE MDOC viento/sismo, NTC sismo), quién la pidió (documento:línea), qué motor y qué cifra se desbloquearía.
Verifica contra el código con grep que el bloqueo sigue vigente. Devuelve el objeto estructurado (usa donde=documento:línea).`,
    { label: 'leer:documentos', phase: 'Leer', schema: CITAS }),
])

phase('Sintetizar')
const limpio = lecturas.filter(Boolean)
log(`${limpio.flatMap(l => l.citas).length} citas recogidas`)
const lista = await agent(`${BASE}
Eres el sintetizador. Con estas citas:
${JSON.stringify(limpio, null, 2)}
escribe /tmp/claude-0/-home-user-H1/8ecf4688-1415-58de-88cd-6505b3ae1775/scratchpad/normas-pendientes.md (ese archivo sí puedes
escribirlo): (1) tabla «Textos que el dueño debe suministrar» ordenada por motor: norma, edición/año, sección o tabla EXACTA, formato
esperado del archivo en parches/normas-texto/ (nombre sugerido), qué cifra y qué pantalla se desbloquea, y cuánto del motor queda
BLOQUEADO mientras falte; (2) tabla «Violaciones de la regla 4» (valores usados citando norma sin texto ni marca) con archivo:línea y el
hallazgo H-nnn propuesto (marcar BLOQUEADO o traer el texto); (3) tabla «Con texto» para constancia; (4) nota sobre derechos: el texto
lo aporta el dueño desde su ejemplar; la suite no lo descarga. Sé concreto: el dueño usará esta lista para ir a buscar los textos.
Devuelve el contenido completo.`,
  { label: 'sintetizar', phase: 'Sintetizar' })
return { citas: limpio.flatMap(l => l.citas).length, lista }