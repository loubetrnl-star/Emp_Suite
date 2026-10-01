export const meta = {
  name: 'h266-complementos-2',
  description: 'Soportería: corregir los dos defectos del revisor en la rama claude/h266-complementos (migración con metros a mano; bases migradas sin origen) en /home/user/wt-soporte',
  phases: [{ title: 'Corregir', detail: 'prueba primero, commit por defecto, bancos y mutantes' }],
}
const TAREA = `
Repositorio principal: /home/user/Emp_Suite (rama claude/focused-euler-f9knvw). NO trabajes ahí. Tu worktree: /home/user/wt-soporte, rama
claude/h266-complementos (commits c3b746b…204f87b sobre d8f8b5e: complementos de H-266, soporte v13, pruebas S.130–S.136, mutantes
soporte.m57–m78). index.html es una sola app (CRLF: respétalo; líneas base64 ENORMES: nunca imprimas el archivo completo; grep -n, sed -n
'a,bp' | cut -c1-300; edita con scripts node con texto exacto y único). Reglas de CLAUDE.md: prueba primero que falle hoy por la conducta;
un commit por defecto, encabezado «H-266 · soporte · complemento: qué» (formato exacto); bancos en verde antes de cada commit
(continuacion/turno.sh node pruebas.mjs index.html → 529/529 hoy; con --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
→ 535/535); mutantes con continuacion/turno.sh node parches/mutantes/mutantes.mjs soporte --solo <id> --dir <carpeta existente>, y el
mutante que se rompa con tu cambio se reapunta EN EL MISMO commit; soporte ya va en v13 en esta rama (si mueves cifras, anótalo en
MOTOR_CAMBIOS/CHANGELOG con la 13; esperado con node parches/regresion-motores/genera.mjs y luego git checkout --
parches/regresion-motores/regresion-motores.emp.json). Mensajes en español; cada commit termina exactamente con:
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01VqGDLbvsYVpR5UZKnMQ2jZ
git add sólo de tus archivos. NO hagas push. Arnés: import { cargar } from "/home/user/wt-soporte/continuacion/arnes.mjs". Pruebas nuevas
con S.137 (libre) o extendiendo S.132/S.133. Ritmo: directo.

El revisor adversarial halló (reproducciones en /home/user/wt-soporte/x15/revision/u8manual.mjs y u10bases.mjs):
1. U8 (33c77a5) cambia cifras al abrir cuando hay metros capturados a mano: un respaldo anterior a H-266 que contaba en vivo
   (usarMotores:true) sin tramos en los motores, pero con ductoM:30 (400×300) y tubHidroM:20 (Ø50, acero) guardados de cuando estuvo
   en «valores propios» (en vivo computeSoporte los ignoraba), antes abría con 0 m y 0 MXN; hoy abre con 30 + 20 m, 22 soportes y
   41,454 MXN. Corrección: abrir «a mano» sólo si tampoco hay metros capturados a mano (ductoM, tubHidroM, tubFuegoM, tubAireM); si los
   hay, hacer lo que hacía d8f8b5e (instantánea: 0 m, las mismas cifras de antes). Agrega el caso a S.132 (hoy daría 30 en vez de 0).
2. U10 incompleto: las bases que copia la migración (tomarBases, ~index.html:11727-11732) salen como captura: la memoria dice «Bases de
   equipo: 2 (capturadas; H-266)» y el aviso de lo migrado sólo menciona las alturas. Corrección: tomarBases guarda
   soporte.sinConfirmar.basesEquipo = { valor, origen: "conteo de equipos de la cotización al abrir" }; memoria, aviso y pantalla dicen
   «de la migración, sin confirmar» mientras la cifra sea esa; setPath("soporte.basesEquipo") quita la marca. Prueba que exija la marca
   y un mutante que la quite.
Devuelve: commits (hash · encabezado), bancos, mutantes (MUERTO/VIVO) y dudas que cambien cifras.`
phase('Corregir')
return await agent(TAREA, { label: 'corregir:H-266-compl-2', phase: 'Corregir' })
