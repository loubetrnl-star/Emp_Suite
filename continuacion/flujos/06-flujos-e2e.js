export const meta = {
  name: 'flujos-e2e',
  description: 'Flujos de usuario de punta a punta en Chromium (Playwright) sobre EMP Suite HEAD fcda936: ventilación→selección→carga térmica, deshacer, guardar/abrir; fuego, civil y soportería con instantánea; y apertura de un proyecto viejo (migración con la misma cifra)',
  phases: [{ title: 'Recorrer', detail: 'dos recorridos independientes en el navegador' }],
}

const BASE = `
Repositorio: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). App: index.html (sin build; ábrela con file://
o sirve la carpeta con python3 -m http.server en un puerto libre). NO modifiques el repositorio; capturas y guiones en
/home/user/emp_suite/x15/e2e/ (x15 está en .gitignore). Playwright: /opt/node22/lib/node_modules/playwright (import desde esa ruta o
NODE_PATH), Chromium en /opt/pw-browsers (executablePath si hace falta; no corras playwright install). Reglas de la casa:
/home/user/emp_suite/CLAUDE.md. Tienes Node 22 y Python 3. Español, archivo:línea.
Contexto (decisión del dueño 27-sep-2026): todos los motores son independientes; lo de otra pestaña entra sólo como propuesta aceptada
(instantánea) y ya aceptada no se mueve sola. Cambios: H-262 vent con datos propios (S.vent.area/height/occ); H-263 el ventilador
seleccionado (botón «seleccionar» en ventilación, elegir zona) entra a la zona de carga térmica como «Misceláneos · Ventilación»
(HP × 745.7 W, sensible); H-264 fuego con área/altura propias; H-265 civil con áreas de obra y cuartos propios; H-266 soportería con
alturas propias y metros de otros motores sólo por instantánea aceptada («motores>soporte»). Para saber qué selectores y acciones
existen, lee viewVent/viewLoad/viewFuego/viewCivil/viewSoporte y los case "vent-seleccionar"/"vent-quitar" en index.html, y cómo
pruebas.mjs dispara acciones (data-act o similar). Si un flujo no puede completarse por la interfaz, repórtalo como hallazgo (no lo
hagas por consola).
`

const RECORRIDOS = [
  { key: 'vent-load', que: `Recorrido 1 (ventilación → carga térmica): crea un proyecto nuevo; captura en Ventilación área, altura y ocupantes; verifica que
la cifra de CFM aparece y que NO cambia si editas el área de una zona de Carga térmica (independencia). Selecciona el ventilador
(vent-seleccionar) eligiendo una zona; ve a Carga térmica y verifica la fila «Misceláneos · Ventilación» con W = HP × 745.7 y el
texto de HP estimado de catálogo; cambia después el área en Ventilación: la fila en carga térmica NO debe moverse (regla 3). Deshacer
(histSnap) quita la selección; volver a seleccionar; «quitar» la deja en null y la fila desaparece. Guarda el proyecto (exporta .emp o
como lo haga la app), recarga la página, ábrelo y comprueba que todas las cifras coinciden (compara el JSON exportado antes y después,
con python3, ignorando ids/fechas). Tema claro, oscuro y ancho 390 px: captura de cada pantalla clave; mira las capturas (Read).` },
  { key: 'fuego-civil-soporte', que: `Recorrido 2 (fuego, civil, soportería, proyecto viejo): en un proyecto nuevo captura Contra incendio (área a proteger, altura) y verifica
que cambiar zonas de carga térmica no mueve su caudal; en Obra civil agrega dos áreas de obra y un cuarto clasificado y verifica
cantidades; en Soportería captura alturas (trabajo y estructura), verifica que sin instantánea sólo cuenta lo capturado (aviso), acepta
la propuesta «motores>soporte» (instantánea) y comprueba que después de cambiar ductos/tuberías en su motor la soportería NO se mueve
(regla 3). Luego, proyecto viejo: obtén el fixture de antes de la independencia con
git show 7d7c2d0:parches/regresion-motores/regresion-motores.emp.json > x15/e2e/viejo.emp.json y su esperado
git show 7d7c2d0:parches/regresion-motores/regresion-motores.esperado.json > x15/e2e/viejo.esperado.json; ábrelo en la app por la
interfaz (importar/abrir), y compara las cifras en pantalla de vent, fuego, civil, soporte y load con el esperado viejo: deben ser las
mismas (migración: misma cifra al abrir) salvo las que el CHANGELOG-motores.md declare que cambiaron (léelo). Cualquier diferencia no
declarada es hallazgo con la cifra exacta. Comprueba también que al abrir sin tocar nada el proyecto no queda marcado como modificado.
Tema claro, oscuro y 390 px: capturas; míralas (Read).` },
]

const informes = await parallel(RECORRIDOS.map(r => () => agent(`${BASE}
Eres el recorredor «${r.key}». ${r.que}
Escribe el informe en /tmp/claude-0/-home-user-H1/8ecf4688-1415-58de-88cd-6505b3ae1775/scratchpad/informe-e2e-${r.key}.md (ese
archivo sí puedes escribirlo): pasos, resultado de cada verificación (pasa/falla con cifras), capturas (ruta), hallazgos con
archivo:línea y la prueba del banco que habría que agregar (ID sugerido S.17n), y decisiones del dueño si las hay. Devuelve el
contenido completo.`,
  { label: `recorrer:${r.key}`, phase: 'Recorrer' })))
return { informes: informes.filter(Boolean) }