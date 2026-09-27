export const meta = {
  name: 'implementar-cascada',
  description: 'Implementa el bloque «cascada de módulos» (acordeón en la ventana principal, sin paneles laterales) en un worktree propio (rama claude/cascada-modulos)',
  phases: [{ title: 'Implementar', detail: 'un implementador en su worktree' }],
}
const P = `
Repositorio principal: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). NO trabajes ahí. Crea tu worktree:
git -C /home/user/emp_suite worktree add /home/user/wt-cascada -b claude/cascada-modulos claude/pausa-desarrollo-7tz93x y haz TODO
dentro de /home/user/wt-cascada (ln -s /home/user/emp_suite/node_modules /home/user/wt-cascada/node_modules; mkdir -p
/home/user/wt-cascada/respaldo-rev-2.9.8 && cp /home/user/emp_suite/respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
/home/user/wt-cascada/respaldo-rev-2.9.8/). index.html es una sola app (~22 mil líneas, CRLF: respétalo; líneas base64 enormes:
nunca imprimas el archivo completo; edita con scripts node que busquen texto exacto y único, o sed por rango).
Reglas obligatorias: CLAUDE.md del repo (léelo completo): prueba primero con ID que falle por la CONDUCTA; commits «Bloque · …» o
«H-nnn · …»; los motores NO cambian (ningún MOTOR_VER sube; R.1 y el esperado intactos); paleta idéntica (no tocar --senal, --p-*
ni la identidad de PDF/Excel; prueba S.33); nada de nombres de clientes; ambos bancos en verde antes de cada commit (node pruebas.mjs
index.html y --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html, ~2 min cada uno); el commit termina con
Co-Authored-By: (la que fija CLAUDE.md) <noreply@anthropic.com>. NO hagas push. Chromium/Playwright disponibles para verte el resultado:
require("/opt/node22/lib/node_modules/playwright") (chromium.launch(), page.goto("file://…/index.html")); guarda capturas en
/home/user/wt-cascada/x15/ (ignorada por git) y revísalas (claro/oscuro con emulateMedia, y celular 390 px).

Pedido del dueño (RELEVO.md §7, «Cascada de módulos en la ventana principal (acordeón)»): cada módulo se despliega hacia abajo en
la misma columna; sin paneles laterales, ventanas flotantes, modales ni pestañas nuevas para el contenido de los módulos; varios
abiertos a la vez; transición suave; al abrir, la vista deja visible su encabezado; el encabezado lleva ícono, nombre, semáforo y
una flecha que gira; recordar qué módulos estaban abiertos al volver al proyecto; abrir o cerrar no altera datos ni cálculos; se
ve bien en computadora y celular; misma paleta y estado único con historial y deshacer. Agregar una prueba de que ningún módulo
abre en panel lateral, subir la versión de la suite en la bitácora (no MOTOR_VER) y anotarlo en el changelog de la revisión
(Bitacora-*.md; crea Bitacora-cascada-modulos.md si no hay una de esta revisión).
Primero UBICA cómo se navega hoy: TABS/tabsDeVista, render(), viewOf(tab), S.tab, irATab, el menú lateral (menuDisciplinasHtml,
barraModuloHtml), el módulo HVAC con sus subpestañas (carga, selección, ventilación, limpios, ductos), #modal/openModal (¿qué usa
modal hoy: permisos entre motores, proyectos, hallazgos de archivos, submittals? esos diálogos de confirmación pueden seguir como
modal si no son «contenido de módulo»), reopenSegment y las tarjetas de propuesta, y qué pruebas del banco dependen de S.tab/
render (muchas: 2.0.x, 13.x, 18, S.1 barra de acciones en 16 pantallas, GB/GC guías, selfCheck recorre tabsDeVista). Diseña la
cascada para que S.tab siga funcionando (la pestaña «activa» = módulo abierto y enfocado) y las pruebas existentes sigan en verde
o se reescriban con su justificación. Mantén PDF/Excel/memorias intactos.
Entrega por commits pequeños (p. ej. 1) estado S.abiertos + encabezados de acordeón, 2) render en cascada + transición, 3) recordar
abiertos por proyecto + deshacer no los mezcla, 4) sin paneles laterales: prueba, 5) celular). Devuelve: rama, hashes, resumen,
capturas revisadas, bancos, y dudas para el integrador (sobre todo conflictos previsibles con index.html de otras ramas: H-268
eléctrico y H-272 carga de archivos se trabajan en paralelo en viewElec y en el módulo de archivos cx/cxz; evita tocar esas
regiones más allá de lo indispensable).
`
phase('Implementar')
const r = await agent(P, { label: 'implementar:cascada', phase: 'Implementar' })
return { resultado: r }