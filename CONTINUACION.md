# CONTINUACIÓN · 28-sep-2026, corte de las 22:20 UTC

Documento único de retome. La próxima sesión arranca leyendo SÓLO este archivo: aquí están las reglas vigentes, el estado,
dónde me quedé, lo que quedó a medias, los pendientes en orden y el siguiente paso con sus comandos. Manda sobre `PAUSA.md`,
`RELEVO.md` y las versiones anteriores de este archivo (en git). `CLAUDE.md` sigue vigente (resumen en §0.3).

---

## 0. Reglas vigentes (mandan sobre todo lo demás)

### 0.1 Decisiones del dueño sobre la arquitectura (28-sep-2026)
1. **Cada motor de cálculo es independiente.** No se comparten estado, funciones ni resultados entre motores y no se crean
   dependencias nuevas entre ellos. **Única excepción: los motores de HVAC ya identificados como acoplados en el cálculo de
   cargas** (núcleo térmico: Carga térmica + Cuartos limpios; y el ventilador seleccionado en Ventilación que entra a una zona de
   Carga como misceláneo, H-263). Todos los demás, incluido el resto de los de HVAC, aislados. **Si un cambio rompe esta regla,
   avisar al dueño ANTES de continuar.**
2. **Las propuestas aceptadas se permiten sólo como datos de entrada congelados:** una copia con origen y fecha, que el dueño
   (el usuario) aprueba, que **nunca se actualiza sola** (si el origen cambia, la propuesta sale «desactualizada» y el usuario
   decide) y **sin la cual el motor receptor sigue funcionando** (sin copia: «pendiente» o «Por cotizar», nunca un valor supuesto).
3. **Selección de Equipo no tiene ningún vínculo con Ductos, en ninguna dirección:** ni lectura en vivo ni propuesta aceptada
   (hecho en H-274). Las demás propuestas existentes hacia Eléctrico, Soportería y Selección se mantienen, siempre que ninguna
   venga de Ductos (ver la pregunta abierta en §4, punto 5).

### 0.2 Otras decisiones del dueño vigentes
- **«Calcular»** en cualquier pestaña también genera y descarga la memoria de cálculo en PDF de esa pestaña, cada vez; y re-sella
  (no hay re-sello automático al abrir).
- **D1** sitio, altitud y diversidad: cada pestaña captura el suyo o acepta una propuesta; sin captura, «pendiente».
- **D2** Kaizen y Valor: con instantáneas aceptadas. **D3** semillas sin fuente (2.85 MXN/kWh, 3500 h, cobre 1350 MXN/m, 30 m):
  proyectos guardados conservan la cifra rotulada «semilla sin fuente (migración)»; proyectos nuevos, «pendiente».
  **D4** difusores capturados en Cotización. **D5** corregir kwTRde (hecho, H-286).
- Operación: dos tareas en segundo plano (las más críticas), máxima velocidad (paralelo, poca lectura, publicar cada hallazgo en
  cuanto está en verde). Mensajes cortos al dueño.

### 0.3 Reglas de `CLAUDE.md` (resumen; el archivo manda)
- Prueba primero, con ID `S.nn (H-nnn) …`, que FALLE con el código actual por la conducta; luego se corrige.
- Un commit por hallazgo: encabezado `H-nnn · motor · qué`; cuerpo con norma/criterio, antes → después, prueba y bancos.
- Si mueve números: sube `MOTOR_VER[motor]`, agrega `MOTOR_CAMBIOS`, actualiza `CHANGELOG-motores.md` y regenera el esperado
  (`node parches/regresion-motores/genera.mjs`; ya NO reescribe el fixture salvo con `--fixture`).
- Nada de memoria (norma sin texto en `parches/normas-texto/` = BLOQUEADO). Nada se estima. Espejo ES/EN con `L(es, en)`.
  Los entregables dicen de dónde sale cada valor.
- Los dos bancos en verde antes de CADA commit. Identidad `EMP Suite <suite@emdelpacifico.local>`; mensajes en español; cada
  commit termina con `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` y la línea `Claude-Session: <url de la sesión>`.
- Los tags no se mueven; no se commitean respaldos ni instaladores; nada de `Date.now()` ni azar en fixtures o esperados.
- Sólo se empuja a la rama de trabajo `claude/focused-euler-f9knvw`. No se abren PR sin que el dueño lo pida.
- `index.html` es CRLF con líneas base64 enormes: editar con scripts node y texto exacto y único; comprobar «0 LF sueltos».

---

## 1. Estado al corte
- Rama **`claude/focused-euler-f9knvw`**, HEAD = el commit que trae este archivo (el anterior de código: `1d57c11`, H-290). Todo
  en origen; árbol limpio. `master` sigue en `801a326`.
- Bancos en `1d57c11`: `node pruebas.mjs index.html` → **553/553**; `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`
  → **559/559**.
- `MOTOR_VER`: load 7 · clean 3 · equip 4 · duct 4 · vent 4 · quote 24 · valor 2 · kaizen 1 · elec 9 · hidro 8 · fuego 6 · aire 5 ·
  civil 8 · soporte 13. `HUELLA_FORMA` (sellos de forma anterior, avisan «cambió la forma del sello»): load, clean, duct, hidro,
  vent y fuego en 2.
- Globales de sitio tras H-290: `SITE` = sitio de **Carga térmica** (`S.sitioCarga`; null sin él → la carga queda pendiente);
  `SITE_PROY` = sitio de **Proyecto** (`S.site`), que sólo leen Proyecto, encabezados de documentos, el tablero, aire (hasta H-282)
  y Valor (hasta H-280). Selección usa `sitioSel()` (`S.equip.sitio`, H-288) y su diversidad `divSel()` (`S.equip.div`, H-289).
- Nada corre en segundo plano: al corte se detuvieron los flujos de Cotización (H-278) y Kaizen (H-279); su avance está en
  parches dentro de la rama (§3).

## 2. Dónde me quedé, exactamente
- **Primer plano:** terminado y publicado. El último trabajo fue H-290 (`1d57c11`) y la actualización de la continuación. No hay
  ningún archivo a medio editar en la rama.
- **Lo siguiente que iba a hacer:** integrar la **Cotización (H-278)** a la rama de trabajo. Su implementación estaba terminada
  (3 commits, bancos 537/537 y 543/543 sobre su base `236edcd`, 34 mutantes muertos) y el revisor adversarial acababa de empezar
  cuando se detuvo; el revisor no dejó cambios.
- **Kaizen (H-279):** a medio implementar, sin bancos ni commit (§3.2).

## 3. Lo que quedó a medias y en qué estado

### 3.1 H-278 · quote · cotización sólo con copias aceptadas (IMPLEMENTADO, falta revisión e integración)
- Parches: `continuacion/parciales/H-278-quote/0001…0003-*.patch` (commits `407acb0`, `a380a97`, `aa18839` de la rama local
  `claude/h278-quote`, que NO se subió). Se aplican sobre `236edcd` con **`git am --keep-cr`** (sin `--keep-cr` fallan por el CRLF).
- Qué hace: `computeQuote`, su vista, su PDF y `ENTRADAS.quote` leen sólo la captura de Cotización y las copias aceptadas
  (`S.quote.entradas`), una propuesta por origen (`load>quote`, `duct>quote` nueva, `vent>`, `clean>`, `elec>`, `hidro>`,
  `fuego>`, `civil>`, `soporte>`, `aire>`, `equip>quote` = «Traer el sistema integrado»); difusores capturados en Cotización
  (D4; migrados «sin confirmar»); migración: el proyecto fijo da las mismas cifras (directo 11,289,059.63; total 19,794,869.34).
  quote 24 → 25. Pruebas S.139–S.143; mutantes `parches/mutantes/quote.json` (34).
- Notas del implementador para integrar:
  - Conflicto seguro en `computeQuote`, partidas de soportería: la rama de trabajo (complementos de H-266) lee
    `SOPORTE.sdsCapturado`, `estructuraCapturada`, `alturaEstructuraCapturada`, `hTrabMigrada` y `origenMigradoSop(...)`.
    Conservar la versión de H-278 (lee la copia aceptada) y agregar esos campos a `DATOS_COT["soporte>quote"]`, con el texto
    ES/EN de `origenMigradoSop` armado del lado de Soportería.
  - Conflictos menores: `MOTOR_VER`/`MOTOR_CAMBIOS`, CHANGELOG, esperado (regenerar quote y comprobar mismas cifras), `ENTRADAS`,
    `PROPUESTAS` y pruebas (S.36, R.1). La rama sale de antes de H-274: su `duct>equip` desaparece al fusionar (no reintroducirlo).
  - Después de H-290, `load>quote` debe armarse con la carga calculada con el sitio de Carga (sin sitio: sin datos) y el sitio
    que imprima la propuesta es `SITE_PROY`.
  - Dudas del implementador que cambian cifras (llevar al dueño si no son obvias): la referencia interna conserva todas las copias
    aceptadas (antes perdía las que dependían de permiso); en proyectos nuevos la lámina no entra hasta aceptar su propuesta y los
    difusores quedan «pendiente»; en proyectos migrados el semáforo de Cotización dice «Propuesta sin decidir: partidas de equipo».

### 3.2 H-279 · kaizen · instantáneas aceptadas (A MEDIAS: código y pruebas escritos, sin correr bancos)
- Parche: `continuacion/parciales/H-279-kaizen-en-curso.patch` (diff sin commit del worktree `claude/h279-kaizen`, base
  `4832cb4`; incluye el archivo nuevo `parches/mutantes/kaizen.json`). Se aplica sobre `4832cb4` con `git apply`.
- Contenido: `computeKaizen`/`kaizenLazy`/memoria/pantalla con instantáneas `x>kaizen` (`S.kaizen.entradas`) y captura propia de
  tarifa, horas y cobre; pruebas **S.159–S.165** escritas; kaizen 1 → 2 y valor 2 → 3 (dependencia) en `MOTOR_VER`/CHANGELOG;
  esperado tocado. El agente iba en «mutantes de Kaizen» y todavía no corría bancos: **no está verificado**.
- Al retomarlo sobre la rama de trabajo actual: la instantánea `load>kaizen` debe tomar el sitio de **Carga** (`S.sitioCarga` /
  `SITE`), no `S.site`; la diversidad sale de `divSel()` (H-289); la rama de trabajo ya cambió `kaizenLazy` (firma con el sitio
  de Carga y `divSel()`) y `computeKaizen` (`divSel()`), así que habrá conflictos en esas líneas.

## 4. Pendientes, en orden de prioridad
1. **H-278 (Cotización) · CONGELADO, no se integra.** Cotización general, Kaizen e Ingeniería de valor no se tocan hasta que
   terminen todas las demás disciplinas (`CLAUDE.md`, sección «Congelados», decisión del dueño del 28-sep-2026). Decisión del
   dueño del 6-oct-2026 (respuesta a AUD-07): la cotización general será sólo la suma de las cotizaciones aceptadas de cada
   disciplina, sin lecturas en vivo; no se implementa ahora. Ver §5.
2. **H-279 (Kaizen) · CONGELADO, no se termina ni se integra.** Mismo congelamiento de `CLAUDE.md` («Congelados», decisión del
   dueño del 28-sep-2026): su parche (§3.2) queda como está hasta que terminen todas las demás disciplinas. Ver §5.
3. **H-282 · aire** (D1): presión atmosférica propia (captura o propuesta `proyecto>aire`, copia con fecha); sin ella, tanque y
   ΔP de la red «pendiente»; FAD y compresor siguen. Aire no está congelado: se hace sin esperar a H-278. Lo que la Cotización
   general lee de tanque y red queda como dependencia en la bitácora para cuando el dueño la descongele (CLAUDE.md, «Congelados»). Hoy aire
   lee `SITE_PROY.pAtm` en vivo (`computeAire`, `buildAirePdf`) y lleva `site: S.site` en su huella. X-4 (dimRed mezcla 101.325
   con la del sitio) va con H-219.
4. **H-280 · valor** (D2, D3): medidas sólo sobre instantáneas; sin dependencia de la pestaña activa (cierra X-2); hoy lee
   `SYS`, `QUOTE.mxnTRequipo`, tarifa y horas de Cotización y `SITE_PROY`. Después de H-279.
5. **Pregunta abierta al dueño (no tocar hasta que conteste):** la propuesta existente hacia Soportería, `motores>soporte`, trae
   los metros de ducto desde Ductos (además de hidráulica, incendio y aire). Su regla dice «siempre que ninguna venga de Ductos».
   ¿Se quitan de esa propuesta los metros de ducto (Soportería los captura a mano) o se queda como está?
6. Cruces de pantalla (verificado contra el código el 6-oct-2026): resuelto. Selección cotiza con sus propios precios
   (`preciosEquip(S.equip)`, H-301): `listPrice` ya no lee la Cotización y la tarjeta «Resumen de cotización» es la cotización
   propia de Selección (`SYS.cot`). Soportería ya no cuenta partidas de la cotización: sus bases salen de lo capturado o de la
   instantánea, que cuenta las partidas de Selección (`equiposCotizados`, `S.equip.items`; H-301 y H-266). El único resto, los
   8 campos `quote.*` de la tarjeta «Bases de precio» de Selección, se quitó por decisión del dueño del 6-oct-2026 (commit
   a993b7a, prueba S.203); siguen en la pestaña Cotización.
7. Soportería: con «metros a mano guardados» la tarjeta dice «Desactualizada · el origen cambió» sin que cambie el origen (así
   era en `d8f8b5e`); corregirlo toca `estadoPropuestaCalc` (todas las propuestas).
8. H-273 mutantes de ventilación (PAUSADA; `continuacion/parciales/H-273-vent-mutantes.patch`). Mutantes rotos de antes:
   `elec.m139` (su texto aparece 2 veces) y `vent.m10/m11/m18/m33` (no encuentran su texto).
9. Siguen abiertas (preguntas viejas al dueño): H-268 (migración parcial; permisos), H-272 (5), H-270/H-271 (3), H-267 (4),
   H-269 (4), las 5 de H-134 (`PAUSA.md`), Estructural/Soportería, H-233 (detalle: `git show 63a2794:CONTINUACION.md`, §5).
10. Cola larga: auditoría contra las reglas de la casa; entregables PDF/Excel verificados con Python; flujos de punta a punta en
    Chromium; recorrido visual; oráculo en Python; mutantes de civil y load (H-275, H-276); cascada; normas pendientes; lector con
    archivos reales (guiones 04–12 en `continuacion/flujos/`); renglón de catálogo como equipo seleccionado; H-134;
    Estructural/Soportería; bloques 5a–5e; quitar la pestaña «Cuartos limpios» (preguntar antes).

## 5. Cotización general (H-278): congelada, no se integra
No hay paso que dar aquí mientras siga el congelamiento de `CLAUDE.md` («Congelados», decisión del dueño del 28-sep-2026):
Cotización general, Kaizen e Ingeniería de valor no se tocan hasta que terminen todas las demás disciplinas. Cuando el dueño
lo descongele, la arquitectura ya está decidida (6-oct-2026, respuesta a AUD-07): la cotización general es sólo la suma de
las cotizaciones aceptadas de cada disciplina, sin lecturas en vivo. Lo que sigue es el procedimiento de integración que se
dejó escrito el 28-sep; queda sólo como referencia y **no se ejecuta** mientras siga el congelamiento.
```bash
cd /home/user/Emp_Suite                                  # (o la ruta del clon)
git checkout claude/focused-euler-f9knvw && git status   # árbol limpio
git worktree add -b claude/h278-quote /home/user/wt-quote 236edcd   # si la rama ya existe: git worktree add /home/user/wt-quote claude/h278-quote
git -C /home/user/wt-quote am --keep-cr "$PWD"/continuacion/parciales/H-278-quote/*.patch
git merge --no-ff claude/h278-quote                      # conflictos: §3.1
# resolver; node parches/regresion-motores/genera.mjs (sube quote a v25: mismas cifras del proyecto fijo)
continuacion/turno.sh node pruebas.mjs index.html
continuacion/turno.sh node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
node parches/mutantes/mutantes.mjs quote --paralelo 3 --dir <carpeta existente>
git commit (mensaje de fusión con las líneas finales) && git push -u origin claude/focused-euler-f9knvw
```
H-279 (Kaizen) también está congelado (mismo congelamiento de `CLAUDE.md`) y **no se ejecuta**; su procedimiento, sólo como
referencia para cuando el dueño lo descongele: `git worktree add -b claude/h279-kaizen /home/user/wt-kaizen 4832cb4`, `git -C /home/user/wt-kaizen apply
"$PWD"/continuacion/parciales/H-279-kaizen-en-curso.patch`, terminar (§3.2), commit en esa rama y fusionar como H-278. Los
guiones de los flujos están en `continuacion/flujos/15-h278-quote.js` (revisor) y `16-h279-kaizen.js` (implementación + revisor):
se relanzan con la herramienta Workflow cuando el dueño pida trabajo en segundo plano (poner en el guion que retome del parche).

## 6. Cómo se trabaja
- **Contenedor nuevo** (el clon llega superficial): `git fetch --unshallow origin && git checkout claude/focused-euler-f9knvw`;
  `npm install jsdom@30.1.0`; `mkdir -p respaldo-rev-2.9.8 && git show 7d7c2d0:index.html > respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`;
  `git config user.name "EMP Suite" && git config user.email suite@emdelpacifico.local`; `echo node_modules >> .git/info/exclude`.
  Node 22, Python 3.11, Chromium en `/opt/pw-browsers`.
- **Bancos:** los dos comandos de §5 (≈4–5 min cada uno; pueden ir juntos: `continuacion/turno.sh` es un semáforo de 3 lugares).
  Pruebas que leen `index.html` del disco a media corrida: no editar mientras corre un banco.
- **Arnés** para experimentar sin banco (≈3 s): `import { cargar } from "./continuacion/arnes.mjs"; const w = await cargar();
  const G = (e) => w.eval(e);` (scripts en `x15/`, ignorado por git).
- **Mutantes:** `continuacion/turno.sh node parches/mutantes/mutantes.mjs <motor> --solo <id> --dir <carpeta existente>`; un
  mutante que tumba la app «muere» sin probar nada: revisar que lo maten pruebas con nombre.
- **Fusiones:** `continuacion/integrar.sh <rama>` (sin fast-forward, corre bancos y regresión). Al resolver, que el mensaje de
  fusión termine con las dos líneas de autoría (sin «# Conflicts»).
- **Pruebas de proyecto nuevo** que calculan carga llaman `aceptarSitioCarga()` (H-290) y las de Selección `aceptarEquip()`
  (acepta zonas y sitio). IDs de prueba libres: **S.173** en adelante (S.139–S.143 son de H-278 y S.159–S.165 de H-279).
  Números H libres: **H-293** en adelante (H-275/H-276 reservados para mutantes de civil y load).

## 7. Hecho el 28-sep-2026 (todo en la rama, en este orden)
| Commit | Qué |
|---|---|
| `7f14747`, `1bcff2d` | H-264 · fuego: migración de altura y área (fuego 6); sello sin permisos |
| `c3267ef`…`f7d41f5` | H-265 · civil: complementos (civil 8) · `37347d2`, `95af682`, `1658072`: prueba 2.0.6 y textos U12/U18 |
| `6208981` | genera.mjs ya no reescribe el fixture |
| `c2fb6d3` | H-281 · load: reposición de cuartos limpios sólo como propuesta `clean>load` |
| `236edcd` | «Calcular» descarga la memoria PDF de la pestaña |
| `c151cea` | **H-274 · equip**: Selección sin ningún vínculo con Ductos; presión estática externa capturada en Selección (equip 3) |
| `ce3f856` | **H-286 · valor** (X-3, D5): kW/TR de cada sistema alterno por su tecnología (valor 2) |
| `4832cb4` | **H-287 · load** (X-1): materiales faltantes se limpian en cada corrida |
| `d6aad4a` | Fusión de los complementos de H-266 (soportería 13) |
| `c7056d2` | **H-288 · equip** (D1): sitio de diseño propio de Selección, `proyecto>equip` (equip 4) |
| `e7759ae`, `1abfd81`, `6fda7de`, `b7def7f`, `d3ed9e6` | **H-283/H-284/H-285/H-291/H-292**: el sitio sale de las huellas de clean, duct, hidro, vent y fuego (no lo usan); sello de forma anterior con aviso honesto |
| `59534c4`, `aee4ac0` | **H-289 · equip**: diversidad del edificio capturada en Selección; mutante equip.m4 reapuntado |
| `1d57c11` | **H-290 · load** (D1): sitio de diseño propio de Carga térmica, `proyecto>load` (load 7); sin sitio, pendiente |

## 8. Pendientes del lado del dueño
- Contestar la pregunta de §4, punto 5 (metros de ducto en la propuesta hacia Soportería).
- Hacer privado el repositorio y borrar el público creado por error (`-git-ls-remote-origin-head-Bash-completed-with-no-output-`).
- Textos de norma: SMACNA DCS, NFPA 13 T17.4.2.1(a), NFPA 96, Carrier Parte 1 Tabla 20A, ANSI Z358.1, AISC 360, CFE MDOC viento
  y sismo, NTC sismo, ASHRAE Fundamentals cap. 1 (presión barométrica por altitud).
- Opcional: planos DWG guardados como DXF para probar la carga con archivos reales.

## 9. Archivos de apoyo
- `continuacion/parciales/`: `H-278-quote/` y `H-279-kaizen-en-curso.patch` (§3); los de H-266, H-273 y H-274 son históricos
  (ya integrados, salvo H-273).
- `continuacion/mapa-cruces-restantes.md` (inventario de cruces en vivo; sus números de línea son de `63a2794`),
  `continuacion/revision-h264-h266/` (revisión adversarial por motor), `continuacion/flujos/` (guiones de flujos).
- `CHANGELOG-motores.md` (versión por motor), `AUDITORIA.md`, `PLAN-CRITICOS.md`, `parches/normas-texto/` (textos de norma).
