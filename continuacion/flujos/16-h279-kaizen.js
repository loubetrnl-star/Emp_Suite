export const meta = {
  name: 'h279-kaizen',
  description: 'H-279 · kaizen · Kaizen sólo con datos de entrada congelados (propuestas aceptadas x>kaizen) y su propia captura (tarifa, horas, cobre); nada en vivo (worktree /home/user/wt-kaizen, rama claude/h279-kaizen sobre 4832cb4)',
  phases: [
    { title: 'Implementar', detail: 'prueba primero, corrección, migración, versión, bancos, commits' },
    { title: 'Revisar', detail: 'revisor adversarial' },
  ],
}
const BASE = `
Repositorio principal: /home/user/Emp_Suite (rama claude/focused-euler-f9knvw). NO trabajes ahí. Tu worktree YA ESTÁ PREPARADO:
/home/user/wt-kaizen (rama claude/h279-kaizen sobre 4832cb4; node_modules enlazado; respaldo del banco copiado). index.html es una
sola app (~24 mil líneas, CRLF: respétalo; líneas base64 ENORMES: nunca imprimas el archivo completo; grep -n, sed -n 'a,bp' |
cut -c1-300; edita con scripts node con texto exacto y único que conserven \\r\\n; al final comprueba 0 LF sueltos).
Reglas de /home/user/wt-kaizen/CLAUDE.md: prueba primero con ID «S.nn (H-279) …» que FALLE hoy por la conducta (no por un símbolo
inexistente); un commit por hallazgo, encabezado «H-279 · kaizen · qué» (si partes el trabajo, cada commit con su prueba y su cuerpo:
norma o criterio, antes → después, prueba, bancos); si mueve números: MOTOR_VER.kaizen 1 → 2 (una vez en la rama), MOTOR_CAMBIOS.kaizen,
CHANGELOG-motores.md y node parches/regresion-motores/genera.mjs (NO reescribe el fixture: es un proyecto de formato anterior que
prueba las migraciones y así se queda); nada se estima («pendiente» / «Por cotizar»); espejo ES/EN con L(es,en) en lo que llegue a la
propuesta; los entregables dicen de dónde sale cada valor (capturado, instantánea aceptada con su fecha, catálogo, norma o criterio
de la casa); mutantes nuevos en parches/mutantes/kaizen.json (no existe: créalo con el formato de valor.json) que tus pruebas maten
(continuacion/turno.sh node parches/mutantes/mutantes.mjs kaizen --solo <id> --dir <carpeta existente>; varios: --paralelo 3).
Bancos (en verde antes de cada commit; ~4 min; pueden ir juntos; en 4832cb4 dan 537/537 y 543/543):
  continuacion/turno.sh node pruebas.mjs index.html
  continuacion/turno.sh node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
Arnés (carga en ~3 s, para experimentar): import { cargar } from "/home/user/wt-kaizen/continuacion/arnes.mjs"; const w = await cargar();
const G = (e) => w.eval(e). IDs de prueba tuyos: S.159 a S.165 (sólo esos); van justo antes del bloque t("R.1 regresión por motor…").
Mensajes en español; cada commit termina exactamente con:
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01VqGDLbvsYVpR5UZKnMQ2jZ
Identidad: git -c user.name="EMP Suite" -c user.email="suite@emdelpacifico.local" commit … . git add sólo de tus archivos. NO hagas push.
En paralelo: el integrador trabaja en Selección de equipo (sitio propio de Selección, H-288; después la diversidad del edificio pasa
de S.bldDiv a Selección, H-289) y otro agente rehace la Cotización (H-278). Toca sólo Kaizen (y lo mínimo de otro motor, registrado
como «dependencia» en el cuerpo del commit). Ritmo: directo (el dueño pidió más velocidad).
`
const TAREA = `${BASE}
Especificación: /home/user/wt-kaizen/continuacion/mapa-cruces-restantes.md, sección «## 3. kaizen» y «### H-279» (los números de línea
del mapa son de un commit anterior: búscalas de nuevo). Hoy computeKaizen (y kaizenLazy, buildKaizenPdf, la pantalla de Kaizen y
ENTRADAS.kaizen) leen EN VIVO S.zones/LOADS/computeLoad sobre la zona (simZone), SYS (kW/TR de planta, instPlant, instTerm, blockTons,
sumPeaks, diversity), S.bldDiv, adpLevel y MISSING_MATS, VALID.rows, DUCT.segs, QUOTE.mxnTRequipo, ELEC y S.elec.Ltablero, HIDRO.tramos
y FUEGO, algunos con permiso x>kaizen y otros sin permiso, y usa semillas sin fuente (tarifa 2.85 MXN/kWh, 3500 h/año, cobre alimM
1350 MXN/m, Ltablero 30 m).

Decisiones del dueño que mandan (28-sep-2026):
- REGLA DE ARQUITECTURA: cada motor es independiente: no se comparten estado, funciones ni resultados entre motores y no se crean
  dependencias nuevas en vivo. Lo de otro motor entra SÓLO como propuesta aceptada = DATO DE ENTRADA CONGELADO: una copia con origen
  y fecha que el usuario aprueba, que nunca se actualiza sola (si el origen cambia, la propuesta sale «desactualizada» y el usuario
  decide) y SIN la cual el motor receptor sigue funcionando (sin copia aceptada: esa oportunidad queda «pendiente» con qué falta,
  nunca error ni cero que parezca cálculo).
- D2: Kaizen con INSTANTÁNEAS ACEPTADAS: una PROPUESTA por origen hacia kaizen (load>kaizen, equip>kaizen nueva, duct>kaizen,
  quote>kaizen, elec>kaizen nueva, hidro>kaizen nueva, fuego>kaizen nueva), con la forma de S.kaizen.entradas del mapa (§3). LINKS
  queda como permiso para proponer donde ya existe; las nuevas no necesitan cruce si el patrón de PROPUESTAS con permisos: [] basta
  (mira "clean>load" y "proyecto>equip" si ya está en tu base: si no, "clean>load").
- D1 (cada pestaña con su sitio): Kaizen no lee SITE ni S.site en vivo. La instantánea load>kaizen lleva el sitio con que se calculó
  (siteOf(S.site) al aceptar: key, db, wb, alt, range, lo que computeLoad necesite) y simZone corre computeLoad sobre las zonas de la
  instantánea con ESE sitio (si computeLoad sólo lee el SITE global, sustitúyelo temporalmente dentro de simZone y restáuralo en un
  finally, o pásalo como parámetro sin cambiar lo que calcula Carga térmica; regístralo como dependencia). La diversidad del edificio
  entra en la instantánea equip>kaizen (bldDiv y diversity al aceptar), no en vivo.
- D3: semillas sin fuente. Kaizen captura en su pestaña tarifaKWh, horasAno y alimM como { valor, fuente, fecha } (y la longitud al
  tablero, si la usa, viene en la instantánea elec>kaizen; sin ella «pendiente de longitud», H-179). En un proyecto GUARDADO que no las
  capturó se conservan con la MISMA cifra y la etiqueta «semilla sin fuente (migración)»; en un proyecto NUEVO quedan «pendiente»:
  opex, retorno y la oportunidad del alimentador salen «pendiente» con qué falta.
- VALID.rows sale de Kaizen (es trabajo del semáforo). MISSING_MATS ya se limpia en cada corrida (H-287, 4832cb4): su lista va en la
  instantánea load>kaizen (faltanMat al aceptar).
- La firma de kaizenLazy (hoy S.duct.segments.length y lecturas vivas) pasa a firmar las instantáneas y la captura de Kaizen.
Migración (bandera en sanearEstado que recompute consume una vez, después de calcular los orígenes, como tomarDeCarga de H-267):
toma la instantánea de cada fuente que HOY entra (las de permiso concedido, y elec, hidro, fuego y SYS, que hoy entran sin permiso),
con registrarVinculo y origen «(migración H-279)»: al abrir salen las MISMAS oportunidades, TR, kW, capex, opex y retornos; el proyecto
fijo de regresión da las mismas cifras de kaizen (R.1). Sin permiso previo no se gana nada.
Pruebas viejas que el mapa lista para reescribir (conceder y además aceptar la propuesta; un ayudante aceptarKaizen en su bloque):
12.2, 12.2.1, 12.3, 22.12, S.14, S.21, P.3, P.7, 18.13 — reescribe sólo las que fallen, sin perder cobertura.
Pruebas nuevas S.159+ (H-279) que fallan hoy (del mapa): con load>kaizen concedido y aceptado, subir el vidrio sur de una zona de 12 a
24 m² no cambia la oportunidad de vidrio; con S.perms = {}, S.fuego.areaDiseno = 400 no hace aparecer «Contra incendio»; sin tarifa
capturada en un proyecto nuevo, KAIZEN.ops[*].mxnOpex no es un número que salga de 2.85 (queda pendiente); un proyecto guardado abre
con las mismas cifras y las semillas rotuladas; cambiar S.site no mueve Kaizen después de aceptar.
Valor (computeIngValor) lee KAIZEN.ops vía kaizenLazy: no lo rompas (H-280 lo independiza después); si una prueba de Valor cambia
porque Kaizen ya no se mueve solo, reescríbela conservando lo que cubre y dilo en el commit.
Al terminar, devuelve: commits (hash · encabezado), bancos, mutantes (MUERTO/VIVO), dependencias tocadas fuera de Kaizen y dudas que
cambien cifras.`
const REVISION = `${BASE}
Eres el REVISOR ADVERSARIAL de H-279 (Kaizen con instantáneas aceptadas) en /home/user/wt-kaizen, rama claude/h279-kaizen (commits sobre
4832cb4: git log 4832cb4..HEAD). No confíes en el resumen del implementador: lee el diff (git diff 4832cb4..HEAD -- index.html, en
partes) y comprueba con el arnés:
1. Que Kaizen ya no lee en vivo NADA de otro motor ni SITE/S.site (busca S.zones, LOADS, SYS, DUCT, QUOTE, ELEC, HIDRO, FUEGO, VALID,
   MISSING_MATS, SITE, S.site, S.bldDiv, S.elec, S.hidro, S.fuego, S.duct dentro de computeKaizen, kaizenLazy, buildKaizenPdf, la vista
   de Kaizen y ENTRADAS.kaizen).
2. Que un proyecto guardado abre con las mismas cifras (arma uno en la base 4832cb4 con git show 4832cb4:index.html a una copia en
   x15/, guárdalo con JSON.stringify(S) y ábrelo en la rama con importarRespaldo).
3. Que sin instantánea aceptada nada truena y lo que falta dice «pendiente» con qué falta (nada en cero que parezca cálculo).
4. Que las semillas se rotulan en proyectos guardados y quedan pendientes en nuevos; que los entregables dicen de dónde sale cada valor.
5. Bancos y mutantes en verde.
Si encuentras defectos CONFIRMADOS (con reproducción), corrígelos tú mismo con prueba primero y commit propio («H-279 · kaizen ·
complemento: …»); lo dudoso, sólo repórtalo. Devuelve: defectos (confirmado/dudoso, reproducción), commits nuevos, bancos, mutantes.`
phase('Implementar')
const impl = await agent(TAREA, { label: 'implementar:H-279', phase: 'Implementar' })
phase('Revisar')
const rev = await agent(REVISION, { label: 'revisar:H-279', phase: 'Revisar' })
return { impl, rev }
