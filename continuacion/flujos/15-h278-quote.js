export const meta = {
  name: 'h278-quote',
  description: 'H-278 · quote · la cotización sólo con datos de entrada congelados (propuestas aceptadas x>quote) y su propia captura; nada en vivo; difusores capturados en Cotización (worktree /home/user/wt-quote, rama claude/h278-quote sobre 236edcd)',
  phases: [
    { title: 'Implementar', detail: 'prueba primero, corrección, migración, versión, bancos, commits' },
    { title: 'Revisar', detail: 'revisor adversarial' },
  ],
}
const BASE = `
Repositorio principal: /home/user/Emp_Suite (rama claude/focused-euler-f9knvw). NO trabajes ahí. Tu worktree YA ESTÁ PREPARADO:
/home/user/wt-quote (rama claude/h278-quote sobre 236edcd; node_modules enlazado; respaldo del banco copiado). index.html es una sola
app (~24 mil líneas, CRLF: respétalo; líneas base64 ENORMES: nunca imprimas el archivo completo; grep -n, sed -n 'a,bp' | cut -c1-300;
edita con scripts node con texto exacto y único que conserven \\r\\n).
Reglas de CLAUDE.md: prueba primero con ID «S.nn (H-278) …» que FALLE hoy por la conducta; un commit por hallazgo, encabezado
«H-278 · quote · qué» (si partes el trabajo, cada commit con su prueba y su cuerpo: criterio, antes → después, prueba, bancos); si mueve
números: MOTOR_VER.quote 24 → 25 (una vez en la rama), MOTOR_CAMBIOS.quote, CHANGELOG-motores.md y node
parches/regresion-motores/genera.mjs (ya NO reescribe el fixture; el fixture es un proyecto de formato anterior y así se queda); nada
se estima («pendiente» / «Por cotizar»); espejo ES/EN con L(es,en) en todo lo que llegue a la propuesta; los entregables dicen de dónde
sale cada valor; mutantes nuevos en parches/mutantes/ (no hay quote.json: créalo con el mismo formato que los demás) que tus pruebas
maten (continuacion/turno.sh node parches/mutantes/mutantes.mjs quote --solo <id> --dir <carpeta existente>; varios: --paralelo 3).
Bancos (en verde antes de cada commit; ~70 s; pueden ir juntos; en 236edcd dan 532/532 y 538/538):
  continuacion/turno.sh node pruebas.mjs index.html
  continuacion/turno.sh node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
Arnés: import { cargar } from "/home/user/wt-quote/continuacion/arnes.mjs"; const w = await cargar(); const G = (e) => w.eval(e).
IDs de prueba tuyos: S.139 a S.143 (sólo esos). Van INMEDIATAMENTE DESPUÉS del bloque t("S.86 (H-181) …") de pruebas.mjs.
Mensajes en español; cada commit termina exactamente con:
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01VqGDLbvsYVpR5UZKnMQ2jZ
git add sólo de tus archivos. NO hagas push. El integrador trabaja en paralelo en Selección de equipo (H-274) y otro agente en
Soportería: toca sólo la cotización (y lo mínimo de otro motor, registrado como «dependencia»). Ritmo: directo (el dueño pidió más
velocidad).
`
const TAREA = `${BASE}
RETOMA (el contenedor se reinició y el agente anterior se detuvo a la mitad): en el worktree ya hay trabajo SIN COMMIT (git status,
git diff: index.html, pruebas.mjs, CHANGELOG-motores.md, parches/mutantes/quote.json, esperado, genera.mjs y pruebas-motores/fuego.mjs
y hidro.mjs). Revísalo antes de nada: consérvalo si está bien, corrige lo que no, explica por qué tocaste genera.mjs y pruebas-motores/
(si no hace falta, revierte esos cambios) y continúa desde ahí; no empieces de cero. La rama principal ya avanzó (H-274 quitó el
cruce duct>equip; H-286 valor; H-287 load; complementos de soportería): no la fusiones tú, eso lo hace el integrador.
Especificación: /home/user/Emp_Suite/continuacion/mapa-cruces-restantes.md, sección «2. quote» y «### H-278» (líneas del mapa: commit
63a2794; búscalas de nuevo). Hoy computeQuote, viewCotizacion, buildCotizacionPdf y ENTRADAS.quote leen EN VIVO DUCT (lámina), totals()
de carga (difusores y textos), VENT, CLEAN, ELEC, HIDRO, FUEGO, CIVIL, SOPORTE, AIRE, S.elec.sistema, S.fuego.fuente, S.duct.meta.material,
algunos sin permiso y otros con permiso x>quote pero sin instantánea.

Decisiones del dueño que mandan (28-sep-2026):
- REGLA DE ARQUITECTURA: cada motor es independiente: no se comparten estado, funciones ni resultados entre motores y no se crean
  dependencias nuevas en vivo. Lo de otro motor entra SÓLO como propuesta aceptada = DATO DE ENTRADA CONGELADO: una copia con origen
  y fecha que el usuario aprueba, que nunca se actualiza sola (si el origen cambia, la propuesta sale «desactualizada» y el usuario
  decide) y SIN la cual el motor receptor sigue funcionando (sin copia aceptada: «Por cotizar» o «pendiente», nunca error ni cero
  que parezca cálculo).
- D4: los DIFUSORES se capturan en Cotización (cantidad capturada por el usuario; sin captura, «pendiente»); ya no salen de los CFM
  de carga térmica (1 por 400 CFM). En un proyecto guardado, la cantidad que hoy sale se copia UNA vez a la captura, marcada «de la
  migración (antes 1 por 400 CFM de carga térmica), sin confirmar», para que abra con la misma cifra (patrón sinConfirmar de H-179).
- D3: valores semilla sin fuente en proyectos viejos se conservan con la misma cifra y etiqueta «semilla sin fuente»; en nuevos,
  «pendiente».
Diseño: S.quote.entradas = { <origen>: { ...instantánea, ts, firma, origen } } con una PROPUESTA por origen hacia quote (duct>quote
nueva también en LINKS; load>quote, vent>quote, clean>quote, elec>quote, hidro>quote, fuego>quote, civil>quote, soporte>quote,
aire>quote; equip>quote con q-fromsys y sel-modelo como su «aplicar»). computeQuote lee SÓLO S.quote (su captura + entradas
aceptadas). Los «faltan» se arman desde estadoPropuesta. Migración (bandera en sanearEstado que recompute consume una vez, después
de calcular los orígenes): toma la instantánea de cada x>quote con permiso dado y de lo que hoy entra sin permiso (lámina, y los
difusores a la captura como se dijo), con registrarVinculo y origen «(migración H-278)»: mismos renglones, importes, pendientes y
Por cotizar al abrir; el proyecto fijo de regresión debe dar las mismas cifras. Sin permiso previo no se gana nada.
Pruebas viejas que el mapa lista para reescribir (conceder y además aceptar la propuesta; un ayudante aceptarCot en su bloque): S.83,
S.85, 12.2.1, S.24, S.7, S.86, 22.11, S.57, S.39, S.41, S.59, S.61, S.72–S.74, R.11, R.12, C.7, GC.5 — reescribe sólo las que fallen,
sin perder cobertura.
Prueba nueva S.139 (H-278) que falla hoy: con S.perms = {}, alargar SA-1 de 20 a 60 m no cambia QUOTE.direct (hoy sube 175,098.24);
Producción de 400 a 800 m² no cambia los difusores (hoy de 9 a 11); con vent>quote concedido y aceptado, subir de 6 a 12 cambios/h no
mueve el directo (hoy 1,444,225 → 2,826,800); sin ninguna propuesta aceptada la cotización sigue funcionando (partidas «Por cotizar»
o pendientes, no error). Más pruebas (S.140–S.143) para los difusores capturados y la migración.
Devuelve: rama, commits (hash · encabezado), bancos, mutantes, descartes con evidencia, dependencias y dudas que cambien cifras.`
phase('Implementar')
const hecho = await agent(TAREA, { label: 'implementar:H-278', phase: 'Implementar' })
phase('Revisar')
const revision = await agent(`${BASE}
Eres un REVISOR ADVERSARIAL (sólo lectura: NO modifiques archivos versionados ni hagas commits). El implementador reportó:
${hecho}
Revisa los commits de claude/h278-quote sobre 236edcd (git -C /home/user/wt-quote log 236edcd..HEAD; diffs) contra CLAUDE.md, la
especificación de H-278 del mapa y las decisiones del dueño citadas arriba. Busca: lectura en vivo que quede en computeQuote, vistas,
PDF, Excel o ENTRADAS.quote; pruebas que no fallan por la conducta en 236edcd; cobertura perdida; migración que no dé la misma cifra
al abrir (fixture de regresión); cotización que truene o dé cero sin propuestas aceptadas; textos sin L(es,en); versionado
incompleto; mutantes vivos. Reproduce (x15/revision/). Devuelve defectos concretos (archivo:línea, escenario, corrección) o «sin
defectos».`, { label: 'revisar:H-278', phase: 'Revisar', effort: 'high' })
return { hecho, revision }
