export const meta = {
  name: 'revision-h264-h266',
  description: 'Revisión adversarial de H-264, H-265 y H-266 (EMP Suite, HEAD 63a2794) contra CLAUDE.md y la decisión del dueño; cada lente se verifica en cuanto termina',
  phases: [
    { title: 'Revisar', detail: 'tres lentes independientes sobre el diff' },
    { title: 'Verificar', detail: 'un refutador por hallazgo principal, en cuanto termina su lente' },
  ],
}
const CONTEXTO = `
Copia de SÓLO LECTURA: /home/user/wt-lectura (worktree en 63a2794, idéntico a la rama de trabajo claude/focused-euler-f9knvw). NO modifiques
ningún archivo versionado; tus experimentos van en /home/user/wt-lectura/x15/rev/ (ignorado por git). Una sola app en index.html (~22 mil
líneas, CRLF, con líneas base64 ENORMES: nunca imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300).
Arnés listo (carga en 2.6 s): import { cargar } from "/home/user/wt-lectura/x15/arnes.mjs"; const w = await cargar(); const G = (e) => w.eval(e);
const S = G("S");  — el proyecto de prueba del banco está en pruebas.mjs (function proyectoDePrueba; aceptarSoporte).
Los bancos ya están en verde en 63a2794 (521/521 y 527/527): NO los corras completos; reproduce con scripts pequeños en x15/rev/. Si de
verdad necesitas un banco, sólo con el semáforo: cd /home/user/wt-lectura && /home/user/turno.sh node pruebas.mjs index.html
Qué se revisa: 5f8dfc4 (H-264 · fuego), 969f6d9 (H-264 complemento), 2afdd81 (H-265 · civil) y fcda936 (H-266 · soporte).
Diff: git -C /home/user/wt-lectura diff e0e1cf4..fcda936 -- index.html pruebas.mjs CHANGELOG-motores.md pruebas-motores/ parches/
Mensajes: git -C /home/user/wt-lectura log e0e1cf4..fcda936 --format='%h %s%n%b'
Decisión del dueño (27-sep-2026): todos los motores independientes; cada disciplina calcula sólo con lo que se le captura en su pestaña;
nada se hereda ni se lee en vivo de otra; lo de otra entra sólo como propuesta aceptada (instantánea) y ya aceptada no se mueve sola.
Contra incendio y obra civil autónomas («hay que dar entradas»); soportería: los metros de los otros motores entran al aceptar su
propuesta y ya cuantificados no se mueven. Un proyecto guardado debe abrir con las mismas cifras.
Después de fcda936 la rama integró H-267 (selección), H-268 (eléctrico), H-269 (materiales eléctricos), H-270/H-271 (diagramas),
H-272 (carga de archivos: toca civil, fuego y soportería al cargar archivos) y H-277. Un hallazgo sólo cuenta si sigue siendo cierto en
63a2794 (compruébalo ahí); si ya lo corrigió un commit posterior, descártalo.
Ritmo: directo al grano; nada de estilo; cada hallazgo con escenario concreto (entrada → salida incorrecta) y archivo:línea en 63a2794.
Devuelve a lo sumo 8 hallazgos, de mayor a menor severidad.
`
const LENTES = [
  { key: 'reglas', prompt: `${CONTEXTO}
Tu lente: CUMPLIMIENTO DE CLAUDE.md: prueba primero con ID que pruebe conducta (S.100, S.101, S.102: ¿fallaban por la conducta?
¿alguna prueba reescrita perdió cobertura sin sustituto?); versionado completo (MOTOR_VER fuego 4, civil 6, soporte 12;
MOTOR_CAMBIOS; CHANGELOG; esperado regenerado sólo de esos motores; fixture sin cambios salvo fuego.altura 6); nada estimado
(¿quedó algún valor por omisión que parezca cálculo? p. ej. civil altura 2.8, soporte alturas, bases); espejo ES/EN en textos que
llegan a propuesta/Excel; regla 8 (procedencia en pantalla, memoria, PDF); mutantes (fuego.m33, load.m87, soporte.m55/m56) y
casos a mano; dependencias registradas.` },
  { key: 'codigo', prompt: `${CONTEXTO}
Tu lente: CORRECCIÓN Y CASOS LÍMITE. Reproduce en jsdom (x15/rev/codigo/) lo que afirmes:
- Migraciones al abrir proyectos anteriores: civil (migrarCivilAutonoma: zonas sin área, cuartos limpios con nombre repetido,
  perímetros capturados, proyecto sin clean, proyecto ya migrado abierto dos veces, ¿se duplican?), soporte (tomarInstantanea /
  tomarBases en recompute: ¿corre antes de los motores que necesita? ¿qué pasa si recompute corre antes de que DUCT/HIDRO
  existan? ¿un proyecto abierto y guardado dos veces?), fuego (her.* retirado).
- ¿Queda alguna lectura en vivo de otra disciplina en computeCivil, computeSoporte, computeSoporteGobernado, computeFuego,
  snapshotSoporte (que sí puede leer motores al TOMAR la instantánea), ENTRADAS, semáforos, trazaHerencia, PDFs, Excel, tablero,
  matriz de validación (validateAll), Kaizen/Valor?
- Contratos (selfCheck / 16.4), huellas de sello (¿abrir un proyecto viejo marca «la captura cambió» sin cambio?), deshacer,
  autosave, ids únicos de civil.areas/cuartos, civil con usarZonas=false y cuartos capturados, soportería a mano con snap viejo.
- Textos que sigan diciendo «hereda», «zona más alta», «de las zonas» en pantalla, guía, PDF, Excel, tablero.` },
  { key: 'dueno', prompt: `${CONTEXTO}
Tu lente: FIDELIDAD A LA DECISIÓN DEL DUEÑO Y EXPERIENCIA DE USO. Recorre las pantallas (viewFuego, viewCivil, viewSoporte, tablero,
permisos entre motores, memorias PDF de cada una, memoria integral, Excel) leyendo el código de las vistas y renderizando en
jsdom (x15/rev/dueno/): ¿queda claro qué captura cada disciplina y qué pasa si falta (pendiente, aviso)? ¿La propuesta de soportería
se ofrece, se acepta, muestra instantánea/desactualizada y se puede volver a capturar a mano? ¿Obra civil permite agregar/quitar
áreas y cuartos, y el PDF dice de dónde sale cada cantidad? ¿Algún flujo dejó al usuario sin forma de capturar algo que antes se
heredaba (p. ej. altura de la estructura, bases)? ¿Español correcto, sin nombres de clientes ni «HVAC» fuera de clima?` },
]
const FINDINGS = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: {
  titulo: { type: 'string' }, archivo: { type: 'string' }, linea: { type: 'integer' }, severidad: { type: 'string', enum: ['alta', 'media', 'baja'] },
  escenario: { type: 'string' }, detalle: { type: 'string' } }, required: ['titulo', 'archivo', 'linea', 'severidad', 'escenario', 'detalle'] } },
  resumen: { type: 'string' } }, required: ['findings', 'resumen'] }
const VEREDICTO = { type: 'object', properties: { real: { type: 'boolean' }, razon: { type: 'string' }, correccion: { type: 'string' },
  pruebaSugerida: { type: 'string', description: 'cómo escribir la prueba S.nn que falla hoy por la conducta' },
  severidad: { type: 'string', enum: ['alta', 'media', 'baja'] } }, required: ['real', 'razon', 'correccion', 'severidad'] }
const ORDEN = { alta: 0, media: 1, baja: 2 }
const POR_LENTE = 2

phase('Revisar')
const res = await pipeline(
  LENTES,
  l => agent(l.prompt, { label: `revisar:${l.key}`, phase: 'Revisar', schema: FINDINGS }),
  (r, l) => {
    if (!r) return null
    const todos = (r.findings || []).slice().sort((a, b) => ORDEN[a.severidad] - ORDEN[b.severidad])
    const top = todos.slice(0, POR_LENTE)
    const resto = todos.slice(POR_LENTE)
    if (resto.length) log(`${l.key}: se verifican ${top.length} de ${todos.length}; sin verificar (los verifica el integrador con prueba primero): ${resto.map(f => f.titulo).join(' | ')}`)
    return parallel(top.map(f => () => agent(`${CONTEXTO}
Eres un REFUTADOR. Intenta refutar este hallazgo leyendo el código real en 63a2794 y reproduciendo en jsdom (x15/rev/verif-${l.key}/, sin
modificar el repo). Si no se reproduce o el código ya lo cubre, real=false. Si es real, di la corrección mínima que respeta CLAUDE.md y
cómo sería la prueba S.nn que falla hoy por la conducta.
Hallazgo (lente ${l.key}, severidad propuesta ${f.severidad}): ${f.titulo}
Dónde: ${f.archivo}:${f.linea}
Escenario: ${f.escenario}
Detalle: ${f.detalle}`, { label: `verificar:${l.key}:${f.titulo.slice(0, 32)}`, phase: 'Verificar', schema: VEREDICTO })
      .then(v => ({ ...f, lente: l.key, veredicto: v }))))
      .then(vs => ({ lente: l.key, resumen: r.resumen, verificados: vs.filter(Boolean), sinVerificar: resto.map(f => ({ ...f, lente: l.key })) }))
  },
)
const ok = res.filter(Boolean)
const verificados = ok.flatMap(x => x.verificados)
return {
  confirmados: verificados.filter(x => x.veredicto && x.veredicto.real).map(x => ({ lente: x.lente, titulo: x.titulo, donde: `${x.archivo}:${x.linea}`, severidad: x.veredicto.severidad, escenario: x.escenario, razon: x.veredicto.razon, correccion: x.veredicto.correccion, prueba: x.veredicto.pruebaSugerida || '' })),
  refutados: verificados.filter(x => x.veredicto && !x.veredicto.real).map(x => ({ lente: x.lente, titulo: x.titulo, razon: x.veredicto.razon })),
  sinVerificar: ok.flatMap(x => x.sinVerificar).map(f => ({ lente: f.lente, titulo: f.titulo, donde: `${f.archivo}:${f.linea}`, severidad: f.severidad, escenario: f.escenario, detalle: f.detalle })),
  resumenes: ok.map(x => ({ lente: x.lente, resumen: x.resumen })),
}
