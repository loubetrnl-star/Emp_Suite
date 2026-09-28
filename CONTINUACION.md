# CONTINUACIÓN · 28-sep-2026 (noche)

Archivo de retome. Al volver: leer este archivo completo y `CLAUDE.md`, verificar el estado (§1) y seguir el siguiente paso
exacto (§2). Manda sobre `PAUSA.md`, `RELEVO.md` y las versiones anteriores de este archivo (en git).

## 1. Estado
- Repositorio `github.com/loubetrnl-star/emp_suite`, rama de trabajo **`claude/focused-euler-f9knvw`** (todo en origen; `master`
  sigue en `801a326`). Se integra en serie en esta rama, con los dos bancos en verde antes de cada commit.
- Bancos al corte (después de H-288): ver el último commit (`git log -1`); los dos deben estar en verde.
- `MOTOR_VER`: **load 7** · clean 3 · **equip 4** · duct 4 · vent 4 · quote 24 · **valor 2** · kaizen 1 · elec 9 · hidro 8 ·
  **fuego 6** · aire 5 · **civil 8** · **soporte 13**. Sellos con forma de huella (`HUELLA_FORMA`: load, clean, duct, hidro, vent, fuego = 2).
- **Dos flujos en segundo plano** (worktrees preparados, `node_modules` enlazado, respaldo copiado; NO hacen push):
  - **H-278 · cotización** — `/home/user/wt-quote`, rama `claude/h278-quote` sobre `236edcd`; guion
    `continuacion/flujos/15-h278-quote.js` (trae la nota RETOMA: el trabajo a medias está SIN COMMIT en el worktree).
  - **H-279 · Kaizen** — `/home/user/wt-kaizen`, rama `claude/h279-kaizen` sobre `4832cb4`; guion `continuacion/flujos/16-h279-kaizen.js`
    (implementa y luego revisor adversarial).
  - Si el contenedor se reinicia, se detienen: relanzar con la herramienta Workflow (`scriptPath` del guion; en la misma sesión,
    `resumeFromRunId` wf_d5e2c3af-a4f / wf_128585ba-54c). En un contenedor nuevo los worktrees no existen: recrearlos desde su rama
    (`git worktree add /home/user/wt-x <rama>`, `ln -s <repo>/node_modules`, copiar el respaldo) y decirlo en el guion.
- Contenedor nuevo (el clon llega **superficial**): `git fetch --unshallow origin && git checkout claude/focused-euler-f9knvw`;
  `npm install jsdom@30.1.0`; `mkdir -p respaldo-rev-2.9.8 && git show 7d7c2d0:index.html > respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`;
  `git config user.name "EMP Suite" && git config user.email suite@emdelpacifico.local`; `echo node_modules >> .git/info/exclude`.

## 2. Siguiente paso exacto
1. Verificar §1 (`git log --oneline -3`, árbol limpio, dos bancos en verde).
2. Cuando termine cada flujo: leer su resultado, revisar el diff, `CLAUDE_SESSION=<url> continuacion/integrar.sh <rama>` (fusión sin
   fast-forward, bancos y regresión). Conflictos esperables: `MOTOR_VER`, `MOTOR_CAMBIOS`, `CHANGELOG-motores.md`, el esperado,
   `ENTRADAS`, `PROPUESTAS` y pruebas S.36/R.1. Kaizen: su instantánea `load>kaizen` toma el sitio con `siteOf(S.site)`; cuando
   Carga térmica tenga sitio propio (D1) debe tomar el de Carga.
3. Primer plano, en este orden:
   - HECHOS: H-289 (diversidad en Selección, `59534c4`; Kaizen lee `divSel()` como dependencia) y H-290 (sitio propio de Carga,
     `1d57c11`; `SITE` = sitio de Carga, `SITE_PROY` = el de Proyecto para aire, Valor, documentos y tablero). Al integrar Kaizen
     (H-279): su instantánea `load>kaizen` debe tomar el sitio de Carga (`S.sitioCarga`/`SITE`), no `S.site`, y la diversidad de
     `divSel()`.
   - **H-282 · aire** — presión atmosférica propia (D1), después de integrar la cotización (la cotización lee tanque y red).
   - **H-280 · valor** — después de H-279 (D2 instantáneas; D3 semillas).
   - HECHOS: H-283–H-285, H-291 (vent) y H-292 (fuego): huellas sin sitio, con el aviso honesto de forma de sello (`HUELLA_FORMA`).
4. **Pregunta abierta al dueño** (no tocar hasta que conteste): la propuesta `motores>soporte` trae los metros de ducto desde
   Ductos (además de hidráulica, incendio y aire). Su regla: «las propuestas hacia Eléctrico, Soportería y Selección se mantienen,
   siempre que ninguna venga de Ductos». ¿Se quitan de esa propuesta los metros de ducto (Soportería los captura a mano) o se queda?

## 3. Hecho el 28-sep-2026
| Commit | Qué |
|---|---|
| `7f14747`, `1bcff2d` | H-264 · fuego: migración de altura y área (fuego 6) y sello sin permisos |
| `c3267ef`…`f7d41f5` | H-265 · civil: complementos C4, C6/U1, U7, U9 (civil 8) |
| `37347d2`, `95af682`, `1658072` | 2.0.6 reescrita; textos U12/U18 |
| `6208981` | genera.mjs ya no reescribe el fixture (sólo con `--fixture`) |
| `c2fb6d3` | H-281 · load: reposición de cuartos limpios sólo como propuesta `clean>load` aceptada |
| `236edcd` | «Calcular» también descarga la memoria PDF de la pestaña (decisión del dueño) |
| `c151cea` | **H-274 · equip**: Selección sin ningún vínculo con Ductos (salió `duct>equip`); presión estática externa capturada en Selección; memoria sin preselección de carga en vivo (equip 3) |
| `ce3f856` | **H-286 · valor** (X-3, D5): kW/TR de cada sistema alterno por su tecnología (valor 2) |
| `4832cb4` | **H-287 · load** (X-1): materiales faltantes se limpian en cada corrida |
| `d6aad4a` | Fusión de los complementos de H-266 (soportería 13; U8 y U10 corregidos por el flujo) |
| `c7056d2` | **H-288 · equip** (D1): sitio de diseño propio de Selección, `proyecto>equip` (equip 4) |
| `e7759ae`, `1abfd81`, `6fda7de`, `b7def7f`, `d3ed9e6` | **H-283/H-284/H-285/H-291/H-292**: el sitio sale de las huellas de clean, duct, hidro, vent y fuego (no lo usan); sello de forma anterior honesto |
| `59534c4` (+`aee4ac0`) | **H-289 · equip**: diversidad del edificio capturada en Selección |
| `1d57c11` | **H-290 · load** (D1): sitio de diseño propio de Carga térmica, `proyecto>load` (load 7); sin sitio, pendiente |

- IDs de prueba usados: S.126–S.128 (H-274), S.130–S.137 (soporte), S.138 (H-281), S.144–S.146, S.156 (H-286), S.157 (H-287),
  S.158 (H-288), S.166–S.171 (H-283–H-285, H-291, H-292), S.169 (H-289), S.172 (H-290). Reservados: S.139–S.143 (H-278, flujo),
  S.159–S.165 (H-279, flujo). Libres: S.173 en adelante.
- Números H usados hoy: H-286 (X-3), H-287 (X-1), H-288 (sitio de Selección), H-289 (diversidad), H-290 (sitio de Carga), H-291
  (vent), H-292 (fuego). Libre: H-293 en adelante. X-2 se cierra con H-280; X-4 va con H-219.

## 4. Decisiones del dueño vigentes (28-sep-2026)
- **Regla de arquitectura:** cada motor es independiente; no se comparten estado, funciones ni resultados y no se crean
  dependencias nuevas. Excepción: los motores HVAC acoplados en el cálculo de cargas (núcleo térmico load + clean; ventilador de
  ventilación → carga, H-263). Si un cambio rompe la regla, avisar antes.
- **Propuestas aceptadas = datos de entrada congelados** (copia con origen y fecha que el dueño aprueba, que nunca se actualiza sola
  y sin la cual el motor receptor sigue funcionando). **Excepción: Selección de Equipo no tiene ningún vínculo con Ductos**, ni en
  vivo ni propuesta, en ninguna dirección (H-274).
- **«Calcular»** en cualquier pestaña genera y descarga la memoria PDF de esa pestaña, cada vez; re-sella (no hay re-sello solo).
- **D1** sitio, altitud y diversidad: cada pestaña el suyo (captura o propuesta aceptada); sin captura, «pendiente».
- **D2** Kaizen y Valor: instantáneas aceptadas. **D3** semillas sin fuente: proyectos guardados conservan la cifra rotulada
  «semilla sin fuente (migración)»; nuevos, «pendiente». **D4** difusores capturados en Cotización. **D5** corregir kwTRde (hecho).
- Operación: dos tareas en segundo plano (las más críticas); velocidad al máximo (paralelo, menos lectura, publicar cada hallazgo).

## 5. Pendientes y notas
- Del flujo de soportería: en el caso «metros a mano guardados» la tarjeta dice «Desactualizada · el origen cambió» sin que cambie
  el origen (así era en `d8f8b5e`); arreglarlo toca `estadoPropuestaCalc` (todas las propuestas).
- La pestaña de Selección muestra precios de la cotización (`listPrice`, «Bases de precio»): revisar tras H-278 (cruce de pantalla).
- La fórmula de corrección de capacidad (`capFactorEn`) es la misma para Carga y Selección, cada una con su sitio (función pura, no
  estado compartido): mencionarlo al dueño si pregunta por «funciones compartidas».
- Mutantes rotos de antes: `elec.m139` (buscar aparece 2 veces) y `vent.m10/m11/m18/m33` (H-273, en pausa).
- Siguen abiertas: H-268 (migración parcial; permisos), H-272 (5 preguntas), H-270/H-271 (3), H-267 (4), H-269 (4), las 5 de H-134
  (`PAUSA.md`), Estructural/Soportería, H-233 (detalle: `git show 63a2794:CONTINUACION.md`, §5).

## 6. Cola después de §2
1. H-273 mutantes de ventilación (PAUSADA; `continuacion/parciales/H-273-vent-mutantes.patch`).
2. Auditoría contra las reglas de la casa; entregables PDF/Excel verificados con Python; flujos de punta a punta en Chromium;
   recorrido visual; oráculo en Python; mutantes de civil y load (H-275, H-276); cascada; normas pendientes; lector con archivos
   reales (flujos 04–12 en `continuacion/flujos/`).
3. Renglón de catálogo como equipo seleccionado; H-134; Estructural/Soportería; bloques 5a–5e; quitar la pestaña «Cuartos
   limpios» (preguntar antes).

## 7. Pendientes del lado del dueño
- Hacer privado el repositorio y borrar el público creado por error (`-git-ls-remote-origin-head-Bash-completed-with-no-output-`).
- Textos de norma: SMACNA DCS, NFPA 13 T17.4.2.1(a), NFPA 96, Carrier Parte 1 Tabla 20A, ANSI Z358.1, AISC 360, CFE MDOC viento
  y sismo, NTC sismo, ASHRAE Fundamentals cap. 1 (presión barométrica por altitud).
- Opcional: planos DWG guardados como DXF para probar la carga con archivos reales.

## 8. Archivos de apoyo
- `continuacion/mapa-cruces-restantes.md` (inventario de cruces en vivo; sus números de línea son de `63a2794`),
  `continuacion/revision-h264-h266/` (revisión adversarial por motor), `continuacion/parciales/` (parches viejos; H-274 y H-266 ya
  integrados), `continuacion/flujos/` (guiones de flujos; 14b, 15 y 16 son los de hoy).
- `continuacion/turno.sh` (semáforo de bancos, 3 lugares), `continuacion/arnes.mjs` (jsdom en ~3 s),
  `continuacion/integrar.sh <rama>` (fusión, bancos y regresión), `parches/mutantes/mutantes.mjs <motor> --solo <id> --dir <carpeta>`.
