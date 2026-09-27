export const meta = {
  name: 'revision-h264-h266',
  description: 'Revisión adversarial de H-264, H-265 y H-266 (EMP Suite) contra CLAUDE.md y la decisión del dueño',
  phases: [
    { title: 'Revisar', detail: 'tres lentes independientes sobre el diff' },
    { title: 'Verificar', detail: 'un refutador por hallazgo' },
  ],
}
const CONTEXTO = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x). Una sola app en index.html (~22 mil líneas, CRLF, con
líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; grep -n, sed -n con rangos y cut -c1-300).
Banco: pruebas.mjs (jsdom). Reglas obligatorias: /home/user/emp_suite/CLAUDE.md (léelo completo antes de nada).
Qué se revisa: los commits 5f8dfc4 (H-264 · fuego), 969f6d9 (H-264 complemento), 2afdd81 (H-265 · civil) y fcda936 (H-266 ·
soporte). Diff: git -C /home/user/emp_suite diff c4b2fdb..fcda936 -- index.html pruebas.mjs CHANGELOG-motores.md
pruebas-motores/ parches/ ; mensajes: git -C /home/user/emp_suite log e0e1cf4..fcda936 --format='%B'.
Decisión del dueño (27-sep-2026): todos los motores independientes; cada disciplina calcula sólo con lo que se le captura en su
pestaña; nada se hereda ni se lee en vivo de otra; lo de otra entra sólo como propuesta aceptada (instantánea) y ya aceptada no se
mueve sola. Contra incendio y obra civil autónomas («hay que dar entradas»); soportería: los metros de los otros motores entran
al aceptar su propuesta y ya cuantificados no se mueven. Un proyecto guardado debe abrir con las mismas cifras.
Después de fcda936 la rama ya integró H-267 (selección), H-268 (eléctrico), H-269 (materiales eléctricos), H-270/H-271 (diagramas) y H-272 (carga de archivos; toca civil, fuego y soportería al cargar archivos); HEAD a3803da. Un hallazgo sólo cuenta si sigue siendo cierto en el HEAD actual (compruébalo ahí); si ya lo corrigió un commit posterior, descártalo.
NO modifiques ningún archivo del repositorio (experimentos en /home/user/emp_suite/x15/). Los bancos tardan ~2 min:
cd /home/user/emp_suite && node pruebas.mjs index.html ; y con --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
`
const LENTES = [
  { key: 'reglas', prompt: `${CONTEXTO}
Tu lente: CUMPLIMIENTO DE CLAUDE.md: prueba primero con ID que pruebe conducta (S.100, S.101, S.102: ¿fallaban por la conducta?
¿alguna prueba reescrita perdió cobertura sin sustituto?); versionado completo (MOTOR_VER fuego 4, civil 6, soporte 12;
MOTOR_CAMBIOS; CHANGELOG; esperado regenerado sólo de esos motores; fixture sin cambios salvo fuego.altura 6); nada estimado
(¿quedó algún valor por omisión que parezca cálculo? p. ej. civil altura 2.8, soporte alturas, bases); espejo ES/EN en textos que
llegan a propuesta/Excel; regla 8 (procedencia en pantalla, memoria, PDF); mutantes (fuego.m33, load.m87, soporte.m55/m56) y
casos a mano; dependencias registradas. Hallazgos con archivo:línea, escenario y severidad (alta/media/baja).` },
  { key: 'codigo', prompt: `${CONTEXTO}
Tu lente: CORRECCIÓN Y CASOS LÍMITE. Reproduce en jsdom (x15/) lo que afirmes:
- Migraciones al abrir proyectos anteriores: civil (migrarCivilAutonoma: zonas sin área, cuartos limpios con nombre repetido,
  perímetros capturados, proyecto sin clean, proyecto ya migrado abierto dos veces, ¿se duplican?), soporte (tomarInstantanea /
  tomarBases en recompute: ¿corre antes de los motores que necesita? ¿qué pasa si recompute corre antes de que DUCT/HIDRO
  existan? ¿un proyecto abierto y guardado dos veces?), fuego (her.* retirado).
- ¿Queda alguna lectura en vivo de otra disciplina en computeCivil, computeSoporte, computeSoporteGobernado, computeFuego,
  snapshotSoporte (que sí puede leer motores al TOMAR la instantánea), ENTRADAS, semáforos, trazaHerencia, PDFs, Excel, tablero,
  matriz de validación (validateAll), Kaizen/Valor?
- Contratos (selfCheck / 16.4), huellas de sello (¿abrir un proyecto viejo marca «la captura cambió» sin cambio?), deshacer,
  autosave, ids únicos de civil.areas/cuartos, civil con usarZonas=false y cuartos capturados, soportería a mano con snap viejo.
- Textos que sigan diciendo «hereda», «zona más alta», «de las zonas» en pantalla, guía, PDF, Excel, tablero.
Devuelve defectos con escenario concreto (entrada → salida incorrecta) y archivo:línea.` },
  { key: 'dueno', prompt: `${CONTEXTO}
Tu lente: FIDELIDAD A LA DECISIÓN DEL DUEÑO Y EXPERIENCIA DE USO. Recorre las pantallas (viewFuego, viewCivil, viewSoporte, tablero,
permisos entre motores, memorias PDF de cada una, memoria integral, Excel) leyendo el código de las vistas y renderizando en
jsdom: ¿queda claro qué captura cada disciplina y qué pasa si falta (pendiente, aviso)? ¿La propuesta de soportería se ofrece,
se acepta, muestra instantánea/desactualizada y se puede volver a capturar a mano? ¿Obra civil permite agregar/quitar áreas y
cuartos, y el PDF dice de dónde sale cada cantidad? ¿Algún flujo dejó al usuario sin forma de capturar algo que antes se
heredaba (p. ej. altura de la estructura, bases)? ¿Español correcto, sin nombres de clientes ni «HVAC» fuera de clima?
Hallazgos concretos con archivo:línea y severidad.` },
]
const FINDINGS = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  titulo: { type: 'string' }, archivo: { type: 'string' }, linea: { type: 'integer' }, severidad: { type: 'string', enum: ['alta', 'media', 'baja'] },
  escenario: { type: 'string' }, detalle: { type: 'string' } }, required: ['titulo', 'archivo', 'linea', 'severidad', 'escenario', 'detalle'] } },
  resumen: { type: 'string' } }, required: ['findings', 'resumen'] }
const VEREDICTO = { type: 'object', properties: { real: { type: 'boolean' }, razon: { type: 'string' }, correccion: { type: 'string' },
  severidad: { type: 'string', enum: ['alta', 'media', 'baja'] } }, required: ['real', 'razon', 'correccion', 'severidad'] }

phase('Revisar')
const revisiones = await parallel(LENTES.map(l => () => agent(l.prompt, { label: `revisar:${l.key}`, phase: 'Revisar', schema: FINDINGS })))
const todos = revisiones.filter(Boolean).flatMap((r, i) => r.findings.map(f => ({ ...f, lente: LENTES[i].key })))
const vistos = new Map()
for (const f of todos) { const k = `${f.archivo}:${f.linea}:${f.titulo.toLowerCase().slice(0, 40)}`; if (!vistos.has(k)) vistos.set(k, f) }
const orden = { alta: 0, media: 1, baja: 2 }
const unicos = [...vistos.values()].sort((a, b) => orden[a.severidad] - orden[b.severidad])
const TOPE = 12
if (unicos.length > TOPE) log(`Se verifican ${TOPE} de ${unicos.length}; sin verificar: ${unicos.slice(TOPE).map(f => f.titulo).join(' | ')}`)
phase('Verificar')
const verificados = await parallel(unicos.slice(0, TOPE).map(f => () =>
  agent(`${CONTEXTO}
Eres un REFUTADOR. Intenta refutar este hallazgo leyendo el código real y reproduciendo en jsdom (x15/, sin modificar el repo).
Si no se reproduce o el código ya lo cubre, real=false. Si es real, di la corrección mínima que respeta CLAUDE.md.
Hallazgo (lente ${f.lente}, severidad propuesta ${f.severidad}): ${f.titulo}
Dónde: ${f.archivo}:${f.linea}
Escenario: ${f.escenario}
Detalle: ${f.detalle}`, { label: `verificar:${f.titulo.slice(0, 40)}`, phase: 'Verificar', schema: VEREDICTO }).then(v => ({ ...f, veredicto: v }))))
const reales = verificados.filter(Boolean).filter(x => x.veredicto && x.veredicto.real)
return { confirmados: reales.map(x => ({ titulo: x.titulo, donde: `${x.archivo}:${x.linea}`, severidad: x.veredicto.severidad, escenario: x.escenario, razon: x.veredicto.razon, correccion: x.veredicto.correccion })),
  refutados: verificados.filter(Boolean).filter(x => x.veredicto && !x.veredicto.real).map(x => ({ titulo: x.titulo, razon: x.veredicto.razon })),
  resumenes: revisiones.filter(Boolean).map((r, i) => ({ lente: LENTES[i].key, resumen: r.resumen })), noVerificados: unicos.slice(TOPE).map(f => f.titulo) }