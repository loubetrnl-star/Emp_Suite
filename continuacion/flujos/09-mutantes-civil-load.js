export const meta = {
  name: 'mutantes-civil-load',
  description: 'Corre la barrida completa de mutantes de EMP Suite, reporta sobrevivientes y agrega mutantes para obra civil autónoma (H-265) y misceláneos de ventilación en carga térmica (H-263) en un worktree propio (rama claude/civil-mutantes)',
  phases: [{ title: 'Mutar', detail: 'un agente: barrida, sobrevivientes, mutantes nuevos, commits' }],
}

const BASE = `
Repositorio principal: /home/user/emp_suite (rama claude/pausa-desarrollo-7tz93x, HEAD fcda936). NO trabajes ahí. Crea tu worktree:
  git -C /home/user/emp_suite worktree add -b claude/civil-mutantes /home/user/wt-mutantes /home/user/wt-mutantes fcda936 2>/dev/null ||
  git -C /home/user/emp_suite worktree add -b claude/civil-mutantes /home/user/wt-mutantes fcda936
  ln -s /home/user/emp_suite/node_modules /home/user/wt-mutantes/node_modules   (si no existe)
y trabaja SÓLO en /home/user/wt-mutantes. Una sola app en index.html (~22 mil líneas, CRLF, con líneas base64 ENORMES: nunca imprimas el
archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300). Banco: node pruebas.mjs index.html (y con
--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html; si falta el respaldo: git show 7d7c2d0:index.html > ese archivo).
Mutantes: parches/mutantes/*.json y mutantes.mjs (lee su cabecera para saber cómo se corre por motor y cómo se define un mutante:
cadena a buscar en index.html, reemplazo, prueba que debe matarlo). Reglas de la casa OBLIGATORIAS: lee /home/user/wt-mutantes/CLAUDE.md
completo (un commit por hallazgo con encabezado «H-nnn · motor · qué»; identidad git EMP Suite <suite@emdelpacifico.local>; mensajes en
español terminados en «Co-Authored-By: (la que fija CLAUDE.md) <noreply@anthropic.com>»; ambos bancos en verde antes de cada commit). NO hagas
push. Tienes Node 22 y Python 3 (útil para correr la barrida en paralelo por motor con subprocess y resumir el log).
Contexto: H-265 hizo obra civil autónoma (C.areas {id,nombre,area,altura,perimetro} y C.cuartos capturados en su pestaña, funciones
computeCivil, civilListaHtml, migrarCivilAutonoma) y H-263 hizo que el ventilador seleccionado entre a una zona de carga térmica como
misceláneos (z.miscVent.W = HP × 745.7; computeLoad: miscS). Otro agente ya agrega mutantes de VENTILACIÓN (H-273) en otra rama: no
toques parches/mutantes/vent.json.
`

const r = await agent(`${BASE}
Eres el mutador. Pasos:
1. Corre la barrida COMPLETA de mutantes de todos los motores (como diga mutantes.mjs; en paralelo por motor con Python subprocess si
   tarda). Anota cada mutante VIVO (motor, id, qué cambia, qué prueba debía matarlo). Escribe el resumen en
   /tmp/claude-0/-home-user-H1/8ecf4688-1415-58de-88cd-6505b3ae1775/scratchpad/mutantes-sobrevivientes.md (ese archivo sí puedes
   escribirlo): tabla de sobrevivientes con la prueba que habría que endurecer (no endurezcas pruebas de otros motores en esta rama:
   sólo repórtalo, salvo civil y load).
2. H-275 · civil · mutantes de la obra civil autónoma: agrega a parches/mutantes/civil.json al menos 6 mutantes sobre computeCivil y
   la migración (p. ej. área de un espacio ignorada, perímetro sumado dos veces, altura no multiplicada en muros, cuarto clasificado
   contado como área de obra, migrarCivilAutonoma que no copia perimetro, civilNuevoId repetido). Cada uno debe MORIR con el banco
   actual; si alguno sobrevive, ésa es una prueba que falta: escríbela en pruebas.mjs con ID S.16n (H-275) y comprueba que falla con el
   mutante y pasa sin él. Commit.
3. H-276 · load · mutantes del misceláneo de ventilación: en parches/mutantes/load.json agrega al menos 4 mutantes (745.7 → 746;
   miscS sumado como latente; miscVent de una zona aplicado a todas; quitar la selección no borra miscVent). Misma regla: cada uno debe
   morir; si sobrevive, prueba nueva S.16n (H-276). Commit.
4. Vuelve a correr la barrida de civil y load y ambos bancos; nada de MOTOR_VER (los mutantes no mueven cifras).
Devuelve: commits (hash y encabezado), bancos (n/n), tabla de sobrevivientes por motor y las pruebas nuevas.`,
  { label: 'mutar:civil-load', phase: 'Mutar' })
return { r }