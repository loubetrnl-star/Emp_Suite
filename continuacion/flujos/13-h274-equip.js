export const meta = {
  name: 'h274-equip',
  description: 'H-274 · equip · la presión de ductos entra a la selección sólo como propuesta duct>equip aceptada; huella y memoria sin lecturas vivas (worktree /home/user/wt-h274, rama claude/h274-equip)',
  phases: [
    { title: 'Implementar', detail: 'prueba primero, corrección, versión, bancos, commit' },
    { title: 'Revisar', detail: 'un revisor adversarial del commit contra CLAUDE.md y la decisión del dueño' },
  ],
}
const BASE = `
Repositorio principal: /home/user/Emp_Suite (rama claude/focused-euler-f9knvw, HEAD b186ac8). NO trabajes ahí: ahí trabaja el integrador.
Tu worktree YA ESTÁ PREPARADO: /home/user/wt-h274 (rama claude/h274-equip en b186ac8; node_modules enlazado; respaldo del banco
copiado). Haz TODO dentro de él. index.html es una sola app (~24 mil líneas, CRLF: respétalo; líneas base64 ENORMES: nunca imprimas
el archivo completo ni una línea sin recortar; usa grep -n, sed -n 'a,bp' | cut -c1-300; edita con scripts node que busquen texto
exacto y único y conserven \\r\\n).
Reglas de CLAUDE.md que más pesan aquí: prueba primero con ID «S.nn (H-274) …» que FALLE hoy por la conducta (no por un símbolo
inexistente) y pase después; commit «H-274 · equip · qué» con cuerpo: norma o criterio (decisión del dueño 27-sep-2026: todos los
motores independientes), antes → después, prueba, bancos; si mueve números: MOTOR_VER.equip 2 → 3, MOTOR_CAMBIOS.equip,
CHANGELOG-motores.md y node parches/regresion-motores/genera.mjs (revierte el fixture si sólo cambió por fechas: git checkout --
parches/regresion-motores/regresion-motores.emp.json); nada se estima («pendiente»); espejo ES/EN con L(es,en) en lo que llegue a la
propuesta; los entregables dicen de dónde sale cada valor; mutantes nuevos equip.m5… en parches/mutantes/equip.json que tu prueba mate
(continuacion/turno.sh node parches/mutantes/mutantes.mjs equip --solo equip.m5).
Bancos (en verde antes de cada commit; ~70 s; pueden ir juntos):
  continuacion/turno.sh node pruebas.mjs index.html   → hoy 521/521
  continuacion/turno.sh node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html → hoy 527/527
Experimentos: import { cargar } from "/home/user/wt-h274/continuacion/arnes.mjs"; const w = await cargar(); const G = (e) => w.eval(e);
scripts en /home/user/wt-h274/x15/ (ignorado por git).
IDs de prueba tuyos: S.126 a S.129 (sólo esos). Inserta tus pruebas INMEDIATAMENTE DESPUÉS del bloque t("S.104 (H-267) …") de
pruebas.mjs (otros agentes agregan las suyas en otros lugares: no las pongas al final del archivo).
Identidad git ya configurada. Mensajes en español; cada commit termina exactamente con:
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01VqGDLbvsYVpR5UZKnMQ2jZ
git add sólo de tus archivos (nunca -A). NO hagas push. Otros agentes corrigen en paralelo contra incendio, obra civil y soportería:
toca sólo selección de equipo (y lo mínimo de otro motor si hace falta, registrado como «dependencia» en el commit).
`
const TAREA = `${BASE}
Especificación: lee /home/user/wt-h274/x15/mapa-cruces-restantes.md, secciones «0. Confirmación de lo ya sabido» (puntos 1 y 2),
«1. equip» y «### H-274». Resumen: hoy requisitoFam/selPorFamilia leen DUCT.path EN VIVO con el permiso duct>equip (esp, fit y
«limita» se mueven solos al cambiar ductos); ENTRADAS.equip anida ENTRADAS.duct() (renombrar un tramo marca «desactualizado» la
selección); buildSeleccionPdf §8 imprime LOADS[i].eq en vivo; la trazabilidad de los PDF de selección y cédula imprime el sello de
carga; SYS_HOUR_HINT es código muerto. Corrige así:
- PROPUESTAS['duct>equip'] (origen duct, destino equip, permisos ["duct>equip"]): firma con la trayectoria de ductos, aplicar guarda
  S.equip.espDucto = { inwg, pathPa, cota, ts, rev }; requisitoFam lee SÓLO S.equip.espDucto (o una captura propia opcional
  S.equip.espCaptura en in.wg, con su campo en la pestaña de selección); sin ninguna de las dos, la esp queda «pendiente» y no castiga
  ni se supone. La tarjeta propuestaHtml("duct>equip") en la vista de selección sustituye el aviso de permiso.
- ENTRADAS.equip sin ENTRADAS.duct(): con espDucto/espCaptura.
- §8 de la memoria de selección: desde las zonas de selección aceptadas (S.equip.zonas con su origen y fecha), no desde LOADS; la
  trazabilidad imprime el sello de selección y la fecha de la instantánea load>equip, no el de carga.
- Migración «misma cifra al abrir» (como S.equip.tomarDeCarga): un proyecto con el permiso duct>equip y DUCT.path > 0 toma UNA vez
  la instantánea al abrirlo (bandera en sanearEstado que recompute consume después de calcular ductos), con registrarVinculo y
  origen «(migración H-274)»: mismo esp, mismo fit y mismo modelo recomendado. Sin permiso no hay nada que migrar.
- Pruebas viejas a reescribir (sin perder cobertura): 22.6 (conceder y además aceptar la propuesta), O.1, S.104 (trazabilidad).
Prueba nueva S.126 (H-274) que falla hoy: con el permiso concedido y la propuesta aceptada, alargar el troncal de 20 a 400 m no
cambia selPorFamilia("rtu").fit ni la esp (hoy 0.246 → 1.703 in.wg, fit 100 → 94); con duct>equip negado, renombrar un tramo no
cambia huellaMotor('equip'); buildSeleccionPdf no imprime «Preseleccion por zona (motor de carga» desde LOADS; y un proyecto con el
permiso abre con la misma esp y el mismo recomendado (migración). Si algo del mapa resulta falso al probarlo, no lo «corrijas»:
descártalo con la evidencia.
Devuelve: rama, commits (hash · encabezado), bancos, mutantes (MUERTO/VIVO), dependencias y dudas para el integrador (sobre todo las
que cambien cifras y deba decidir el dueño).`
phase('Implementar')
const hecho = await agent(TAREA, { label: 'implementar:H-274', phase: 'Implementar' })
phase('Revisar')
const revision = await agent(`${BASE}
Eres un REVISOR ADVERSARIAL (sólo lectura: NO modifiques archivos versionados ni hagas commits). El implementador reportó:
${hecho}
Revisa el/los commit(s) de la rama claude/h274-equip sobre b186ac8 (git -C /home/user/wt-h274 log b186ac8..HEAD; diff) contra
CLAUDE.md, la especificación de H-274 en /home/user/wt-h274/x15/mapa-cruces-restantes.md y la decisión del dueño. Busca: prueba que
no falla por la conducta en b186ac8 (compruébalo con git stash o una copia en x15/), cobertura perdida en pruebas reescritas, lectura
en vivo que quede (DUCT en requisitoFam/selPorFamilia/viewSeleccion/PDF/ENTRADAS), migración que no dé la misma cifra al abrir
(fixture de regresión y un proyecto con el permiso), valor supuesto, texto sin L(es,en) que llegue a la propuesta, versionado
incompleto (MOTOR_VER, MOTOR_CAMBIOS, CHANGELOG, esperado), mutantes vivos. Reproduce lo que afirmes (scripts en x15/revision/).
Devuelve una lista de defectos concretos (archivo:línea, escenario, corrección) o «sin defectos».`, { label: 'revisar:H-274', phase: 'Revisar' })
return { hecho, revision }
