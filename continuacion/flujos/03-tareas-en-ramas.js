export const meta = {
  name: 'tareas-en-ramas',
  description: 'Dos tareas con cambios, cada una en su propio worktree y rama: mutantes de ventilación y documentación de relevo',
  phases: [{ title: 'Hacer', detail: 'mutantes de ventilación y documentación, en worktrees separados' }],
}
const BASE = `
Repositorio principal: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). NO trabajes ahí: otros agentes lo
están leyendo. Crea tu propio worktree y rama con git -C /home/user/emp_suite worktree add <carpeta> -b <rama> claude/pausa-desarrollo-7tz93x
y haz TODO dentro de esa carpeta (cd allí; npm no hace falta: enlaza node_modules con ln -s /home/user/emp_suite/node_modules
<carpeta>/node_modules, y el respaldo del banco con mkdir -p <carpeta>/respaldo-rev-2.9.8 && cp
/home/user/emp_suite/respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html <carpeta>/respaldo-rev-2.9.8/).
Reglas obligatorias: CLAUDE.md del repositorio (léelo): prueba primero con ID y que falle por la conducta; un commit por hallazgo
con encabezado «H-nnn · motor · qué» o el que corresponda; ambos bancos en verde antes de commitear (node pruebas.mjs index.html y
con --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html; tardan ~2 min cada uno); identidad git del repo (EMP Suite
<suite@emdelpacifico.local>, ya configurada); mensajes en español; el commit termina con la línea
Co-Authored-By: (la que fija CLAUDE.md) <noreply@anthropic.com>. NO hagas push. Al terminar devuelve: rama, hash del commit, resumen de
lo hecho, resultado de los bancos y cualquier duda para el integrador. index.html usa CRLF: respétalo si lo editas.
`
const T = [
  { key: 'mutantes-vent', prompt: `${BASE}
Worktree: /home/user/wt-vent, rama claude/vent-mutantes.
Tarea: en parches/mutantes/vent.json, los mutantes vent.m10, vent.m11, vent.m18 y vent.m33 tienen un «buscar» que aparece 0 veces
en index.html (ya estaban así en 801a326). parches/mutantes/mutantes.mjs exige exactamente una coincidencia; los reporta INVÁLIDO
y los cuenta como vivos, así que la compuerta de ventilación nunca cierra. Para cada uno: lee su «que» (conversión m → ft del largo
de campana ×3.0; conversión m → ft del alto de rejilla ×3.0; piso de velocidad de rejilla 600 fpm en vez de 100; los modelos que
cubren ±5 % dejan de ir primero), ubica en computeVent / la selección Greenheck la línea vigente (H-154/H-155/H-156 cambiaron
selección y modos por medidas), reapunta buscar/reemplazar a un texto único y corre node parches/mutantes/mutantes.mjs vent
--solo <id>: debe salir MUERTO; si sale VIVO falta una prueba: escríbela en pruebas.mjs con ID nuevo (S.103 está reservado para
eléctrico: usa S.110, S.111…) y que falle con el mutante. Si la lógica ya no existe, retira el mutante y anótalo en
parches/casos-a-mano/vent.pendientes.md con su razón (como fuego.m14 → m33). Respeta el formato del JSON (una mutación por par
de renglones). Al final node parches/mutantes/mutantes.mjs vent debe cerrar sin INVÁLIDOS ni vivos vigentes; ambos bancos en
verde; un commit «H-273 · vent · compuerta de mutantes: m10/m11/m18/m33 reapuntados o retirados».` },
  { key: 'documentacion', prompt: `${BASE}
Worktree: /home/user/wt-docs, rama claude/docs-independencia.
Tarea (sólo documentación; no toques index.html ni pruebas.mjs): deja el relevo al día con lo hecho en esta sesión. Lee PAUSA.md,
RELEVO.md, CHANGELOG-motores.md y los mensajes de commit desde 801a326: git log 801a326..HEAD --format='%h %s%n%n%b'.
1. Escribe Bitacora-independencia-motores.md (mismo estilo que Bitacora-rev-2.9.24.md): decisión del dueño del 27-sep-2026 (todos
   los motores independientes; el usuario captura las entradas; cruces sólo como propuesta aceptada e instantánea; ventilación →
   carga térmica vía ventilador seleccionado como misceláneos), qué se hizo por hallazgo (H-262, H-263, H-264, H-265, H-266 con sus
   complementos), versiones de motor al cierre, migraciones de proyectos guardados, textos de norma que siguen bloqueados, y lo que
   sigue (H-267 selección, H-268 eléctrico, H-269–H-271 entregables y unifilar/trifilar, H-272 carga de archivos, H-134 cuartos
   limpios, Estructural/Soportería, cascada, bloques 5a–5e).
2. Actualiza PAUSA.md: sección nueva «Estado al 27-sep-2026» (último commit, rama, bancos en verde, qué quedó terminado, punto
   exacto de lo pendiente, cómo retomar: git fetch origin claude/pausa-desarrollo-7tz93x …). No borres lo anterior: márcalo como
   histórico.
3. Actualiza RELEVO.md §1 Estado y §7 Pendientes: las reglas de interoperabilidad quedan: regla 1 (herencia) RETIRADA por decisión del
   dueño; reglas 2 y 3 vigentes.
Sin nombres de clientes ni obras. Un commit «Relevo: bitácora de la independencia de motores, PAUSA y RELEVO al día (27-sep-2026)».
Los bancos no cambian, pero córrelos una vez para confirmar el estado que documentas.` },
]
phase('Hacer')
const r = await parallel(T.map(t => () => agent(t.prompt, { label: `hacer:${t.key}`, phase: 'Hacer' })))
return { mutantesVent: r[0], documentacion: r[1] }