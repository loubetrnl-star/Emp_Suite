export const meta = {
  name: 'h266-complementos',
  description: 'Complementos de H-266 (soportería) hallados por la revisión adversarial: migración, anclaje sin altura, propuesta y textos (worktree /home/user/wt-soporte, rama claude/h266-complementos)',
  phases: [
    { title: 'Implementar', detail: 'un hallazgo por commit, prueba primero' },
    { title: 'Revisar', detail: 'un revisor adversarial de los commits' },
  ],
}
const BASE = `
Repositorio principal: /home/user/Emp_Suite (rama claude/focused-euler-f9knvw, HEAD b186ac8). NO trabajes ahí: ahí trabaja el integrador.
Tu worktree YA ESTÁ PREPARADO: /home/user/wt-soporte (rama claude/h266-complementos en b186ac8; node_modules enlazado; respaldo del
banco copiado). Haz TODO dentro de él. index.html es una sola app (~24 mil líneas, CRLF: respétalo; líneas base64 ENORMES: nunca
imprimas el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300; edita con scripts node que busquen
texto exacto y único y conserven \\r\\n).
Reglas de CLAUDE.md que más pesan aquí: prueba primero con ID «S.nn (H-266) …» que FALLE hoy por la conducta (no por un símbolo
inexistente) y pase después; UN COMMIT POR HALLAZGO con encabezado «H-266 · soporte · complemento: qué» y cuerpo: norma o criterio
(decisión del dueño 27-sep-2026: soportería autónoma; los metros de otros motores entran sólo al aceptar su propuesta y ya
cuantificados no se mueven; regla 6: nada se estima), antes → después, prueba, bancos; si mueve números: MOTOR_VER.soporte +1 (una
sola vez en la rama basta si varios commits mueven cifras: súbela en el primero que las mueva y anota los siguientes en
MOTOR_CAMBIOS/CHANGELOG con esa misma versión), CHANGELOG-motores.md y node parches/regresion-motores/genera.mjs (revierte el fixture si
sólo cambió por fechas: git checkout -- parches/regresion-motores/regresion-motores.emp.json); nada se estima («pendiente» / «Por
cotizar»); espejo ES/EN con L(es,en) en lo que llegue a la propuesta; los entregables dicen de dónde sale cada valor; mutantes nuevos
soporte.m57… en parches/mutantes/soporte.json que tus pruebas maten (continuacion/turno.sh node parches/mutantes/mutantes.mjs soporte
--solo soporte.m57).
Bancos (en verde antes de cada commit; ~70 s; pueden ir juntos):
  continuacion/turno.sh node pruebas.mjs index.html   → hoy 521/521
  continuacion/turno.sh node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html → hoy 527/527
Experimentos: import { cargar } from "/home/user/wt-soporte/continuacion/arnes.mjs"; const w = await cargar(); const G = (e) => w.eval(e);
scripts en /home/user/wt-soporte/x15/ (ignorado por git).
IDs de prueba tuyos: S.130 a S.137 (sólo esos). Inserta tus pruebas INMEDIATAMENTE DESPUÉS del bloque t("S.102 (H-266) …") de
pruebas.mjs, en orden (otros agentes agregan las suyas en otros lugares: no las pongas al final del archivo).
Identidad git ya configurada. Mensajes en español; cada commit termina exactamente con:
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01VqGDLbvsYVpR5UZKnMQ2jZ
git add sólo de tus archivos (nunca -A). NO hagas push. Otros agentes corrigen en paralelo contra incendio, obra civil y selección de
equipo: toca sólo soportería (y lo mínimo de otro motor si hace falta, p. ej. un pendiente en la cotización, registrado como
«dependencia» en el commit).
`
const TAREA = `${BASE}
Hallazgos (revisión adversarial de H-266 sobre 63a2794, que es igual a b186ac8 en index.html): lee /home/user/wt-soporte/x15/revision-soporte.md
completo. Son C2 (confirmado), U5, U8, U10, U13, U14, U15 y U16 (sin verificar). Hazlos en orden de severidad (C2 y U5 primero).
Para cada uno: escribe primero la prueba y comprueba que falla hoy POR LA CONDUCTA; si no falla (el hallazgo es falso o ya está
cubierto), no lo corrijas: descártalo y anota la evidencia (qué corriste y qué salió). Los que sólo cambian textos (U14, U16) pueden
ir juntos en un commit si su prueba es una sola. U10: lo que la migración copia o supone al abrir (p. ej. alturaTrabajo = zona más
alta + 1.2 m) debe quedar con su origen visible («de la migración: antes zona más alta + 1.2 m, supuesto de la casa»), no como captura
limpia, en pantalla, partida y memoria; sin cambiar la cifra al abrir. U5: sin altura de la estructura capturada no se supone z/h = 0
para cotizar anclajes como calculados: el anclaje queda «Por cotizar»/pendiente con su motivo (mueve cifras: versión).
Devuelve: rama, commits (hash · encabezado), descartados con evidencia, bancos, mutantes (MUERTO/VIVO), dependencias y dudas para el
integrador (sobre todo las que cambien cifras y deba decidir el dueño).`
phase('Implementar')
const hecho = await agent(TAREA, { label: 'implementar:H-266-compl', phase: 'Implementar' })
phase('Revisar')
const revision = await agent(`${BASE}
Eres un REVISOR ADVERSARIAL (sólo lectura: NO modifiques archivos versionados ni hagas commits). El implementador reportó:
${hecho}
Revisa los commits de la rama claude/h266-complementos sobre b186ac8 (git -C /home/user/wt-soporte log b186ac8..HEAD; diffs) contra
CLAUDE.md, /home/user/wt-soporte/x15/revision-soporte.md y la decisión del dueño. Busca: pruebas que no fallan por la conducta en
b186ac8 (compruébalo con una copia en x15/), cobertura perdida, migración que no dé la misma cifra al abrir (fixture de regresión),
valores supuestos, textos sin L(es,en) que lleguen a la propuesta, versionado incompleto, mutantes vivos, descartes mal justificados.
Reproduce lo que afirmes (scripts en x15/revision/). Devuelve una lista de defectos concretos (archivo:línea, escenario, corrección) o
«sin defectos».`, { label: 'revisar:H-266-compl', phase: 'Revisar' })
return { hecho, revision }
