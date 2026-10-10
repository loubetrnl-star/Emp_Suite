# PAUSA

## Estado al 10-oct-2026 (vigente)
Pausa pedida por el dueño. Todo en `master` y en `origin/master` (sin commits pendientes); árbol limpio; nada corriendo.
- Bancos: `node pruebas.mjs index.html` → **613/613**; con `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html` →
  **619/619**. Versiones: load 7, clean 3, equip 4, duct 7, vent 4, quote 24, valor 2, kaizen 1, elec 11, hidro 11, fuego 7,
  aire 8, civil 8, soporte 14. Etiqueta local `pre-H170` en 7460461 (no subida).
- Hecho del 9 al 10-oct (detalle en `bitacora.md`): fusión de H-170 (a8d2582) y verificación de sus 38 mutantes; rótulo del
  Addendum No. 1; firma Opus 5.5; herramientas de verificación (Pint, fluids, pdfplumber, openpyxl en `.venv-verificacion`;
  c8, fast-check, eslint); cobertura por motor; verificación independiente en Python; S.227 (fast-check, soportería);
  S.228 (longitud inválida en calcularTramo, 503ec74); S.230, S.231 (vivos de soportería); H-275 (`parches/mutantes/civil.json`)
  y S.235 (fast-check, civil); reanclaje de mutantes inválidos en soporte, equip, aire, fuego, hidro y elec; CHANGELOG ordenado.
- **Mutantes vivos que piden prueba** (siguiente tarea, archivo `pruebas.mjs`): equip.m15 (rama «hour» de editarZonaEquip) e
  hidro.m21 (HP al más cercano: falta un caso con fracción < 0.5). civil.m09 es valor por omisión (no bloquea).
- **Sin corrida completa tras el reanclaje:** hidro, aire, fuego, elec y equip (sólo se verificaron los 29 cambiados); load,
  vent, clean y duct no se revisaron en esta ronda.
- **Esperan decisión del dueño:** retiro de soporte.m70, m72, m73 y m74 (conducta retirada en H-307; logica false); filas
  «(sin cambio)» del CHANGELOG para cambios de huella y arrastre a Cotización; las propuestas que mueven números de
  `continuacion/auditoria-2026-09-28/PROPUESTAS-PENDIENTES.md` (equip A14, duct masa con zinc, elec reactancia, claros de
  soporte, familia por omisión de soporte, AUD-12, AUD-19, H-282); AUD-17 (c) y AUD-20 siguen bloqueadas por documentos.
- Equipo y entorno: límite de subagentes en `~/.claude/settings.json` = 18 (rige al reiniciar); semáforo de bancos para
  programadores en `%TEMP%\emp-turno\turno.mjs` (temporal, fuera del repo). Cuatro worktrees de agentes quedaron bloqueados por
  su proceso en `.claude/worktrees/agent-*` (ramas ya integradas): retirarlos con `git worktree remove --force` al reiniciar.
- Para retomar: leer este bloque y las últimas filas de `bitacora.md`; correr los dos bancos; seguir con los vivos de arriba.

## Estado al 7-oct-2026 (histórico)
Cierre de la auditoría externa del 28-sep-2026 (`continuacion/auditoria-2026-09-28/`). Todo en `master`, sin push.
- Bancos al cierre: `node pruebas.mjs index.html` → **604/604**; con `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`
  → **610/610**. Versiones: load 7, clean 3, equip 4, duct 4, vent 4, quote 24, valor 2, kaizen 1, elec 11, hidro 11, fuego 7,
  aire 8, civil 8, soporte 14.
- **Cerrado** (detalle en `bitacora.md` y en la tabla de `PROPUESTAS-PENDIENTES.md`): AUD-01 a 06, 09, 11, 14 (salvo
  soportería), 15, 16, 18, 19, 21 (retirada con evidencia), 22, 23 (por H-306), 24 (24.1, 24.2 y 24.3 opción a); AUD-02(a)
  ratificada; AUD-04 sin piso de 1 m²; AUD-12 en lo que sólo agrega renglones a R.1/R.4; AUD-20 (a) y (b), y (c) y (d)
  declaradas como fuente secundaria.
- **Espera decisión del dueño**: AUD-17 opción (c) (cambia el esperado de la Cotización general congelada: autorizar regenerar
  sólo ese esperado o esperar a descongelarla); familia por omisión en soportería (la orden de no tocar Estructural ni
  Soportería, más abajo, sigue vigente); partes de AUD-12 que cambiarían valores de los proyectos fijos.
- **Espera documentos**: tabla de corrección del fabricante del secador (temperatura de entrada y presión) y tabla de capacidad
  del compresor por presión (AUD-17); ANSI Z358.1-2014 (lavaojos, AUD-20 e); texto base de ICC de la Tabla 604.3 del IPC 2015
  (AUD-20 d); ASTM B88 y ASME B36.10 con edición (AUD-20 c); NFPA 13 (umbral de 12 m para rack, AUD-19).
- **Congelados** (CLAUDE.md): Cotización general, Kaizen e Ingeniería de valor; AUD-07 (decidida: suma de cotizaciones
  aceptadas), AUD-08, AUD-10 y AUD-13 esperan que se descongelen.

## Estado al 27-sep-2026 (histórico)
El dueño dijo «continúa» y se trabajó la independencia de motores. **Para retomar: leer `CONTINUACION.md`, que manda**
sobre este archivo y sobre `RELEVO.md`. Detalle por hallazgo: `Bitacora-independencia-motores.md`.

- Último commit: `63a2794` «CONTINUACIÓN: punto de retome del 27-sep-2026». Rama de trabajo:
  `claude/focused-euler-f9knvw` (mismo HEAD que `origin/claude/pausa-desarrollo-7tz93x`, donde se hizo el trabajo);
  `master` sigue en `801a326` (esta PAUSA).
- Bancos en `63a2794`: `node pruebas.mjs index.html` → **521/521**; con `--base
  respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html` → **527/527**. No correr más de dos bancos a la vez
  (`/home/user/turno.sh`): con más fallan 18.10 y 18.16 sin razón.
- `MOTOR_VER`: load 6 · clean 3 · equip 2 · duct 4 · vent 4 · quote 24 · valor 1 · kaizen 1 · elec 9 · hidro 8 ·
  fuego 4 · aire 5 · civil 6 · soporte 12.
- Decisión del dueño (27-sep-2026): todos los motores independientes; cada disciplina calcula sólo con lo capturado en
  su pestaña; lo de otra entra sólo como propuesta aceptada (instantánea) que no se mueve sola; la regla 1 de herencia
  queda RETIRADA (`HEREDA` vacío). Ventilación → carga térmica sólo por el ventilador seleccionado (HP × 745.7 W, como
  misceláneos, en la zona que elige el usuario).
- **Terminado:** H-262 (vent), H-263 (load), H-264 (fuego), H-265 (civil), H-266 (soporte), H-268 (elec), H-267 (equip),
  con sus complementos; H-272a–f (carga de archivos a la captura propia de cada disciplina); H-270 y H-271 (unifilar y
  trifilar); H-269a/b (materiales y consideraciones de cálculo del eléctrico); H-277 (temperatura ambiente en los
  documentos del eléctrico). Los proyectos guardados abren con las mismas cifras.
- **Punto exacto de lo pendiente:** tarea 1 de la cola de `CONTINUACION.md` §6, la revisión adversarial de H-264, H-265
  y H-266 (`continuacion/flujos/01-revision-h264-h266.js`, sólo lectura; se detuvo al corte sin dejar cambios); cada
  hallazgo confirmado, commit complemento con prueba primero. Luego la cola en orden, una tarea a la vez. Decisiones del
  dueño abiertas: `CONTINUACION.md` §5.
- Lo de abajo (26-sep-2026) queda como **histórico**: H-134 sigue abierto con sus 5 decisiones, pero el punto de retome y
  el estado del repositorio ya no son los de ese día.

---

## Histórico · PAUSA del 26-sep-2026

Punto de archivo antes de decidir si se continúa. Nada se relanza hasta que el dueño diga «continúa».

### Estado del repositorio
- Último commit de trabajo: `5b3d903` «PAUSA: relevo de sesión» (sobre `baf14c9` H-154 y `0fd9392` rev 2.9.24).
- Etiqueta: `pausa-2026-09-26` (apunta a `5b3d903`; este archivo se commitea encima).
- Rama: `master`. Árbol limpio al etiquetar. Sin remoto configurado (el dueño creará `loubetrnl-star/emp-suite-hvac`
  privado en GitHub; GitHub CLI no está instalado, el push se hará con `git remote add origin … && git push -u origin HEAD`
  cuando el dueño confirme que el repo vacío existe).
- Bancos en verde en `5b3d903`: `node pruebas.mjs index.html` y `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`.
- Respaldo completo: `respaldo-rev-2.9.24/Emp_Suite-completo-20260926-183442-baf14c9.tar.gz` (ignorado por git).

### Hitos terminados
- Rev 2.9.24: corrección de los críticos de la auditoría (`0fd9392`, tag `rev-2.9.24-candidata`), REPORTE-CRITICOS.md, bitácora.
- H-154 · vent: la pantalla sin modelo ya no truena (`baf14c9`, prueba S.88).
- H-224 · soporte: red contra incendio soportada con su material (parte no bloqueada).
- RELEVO.md: respuestas 1–8 del plan de integración, receta de empalme, pendientes.
- Prueba S.89 (H-90, Estructural nativo) estacionada en `parches/casos-a-mano/H-90-prueba-S89.mjs.txt` (no se inserta:
  orden del dueño de no tocar Estructural ni Soportería).
- Regla imperativa del dueño registrada: cada disciplina es independiente (motor, selección, memoria y cotización propios;
  cruces sólo como propuesta).

### H-134 (Cuartos limpios → zona de Carga térmica): punto exacto
Decisión del dueño (AskUserQuestion): «Mover el cálculo a la zona». Flujo `wf_8451851d-a14`
(script `…\40f3f4c9-…\workflows\scripts\h134-limpios-a-zona-wf_8451851d-a14.js`, fases Especificación → Prueba primero →
Implementación → Verificación → Corrección).

| Fase | Estado |
|---|---|
| Especificación «limpieza» | TERMINADA y cacheada en `journal.jsonl` (campos de zona dp/crackLen/oaFraction/migrado, motor load, consumidores quote/elec/civil/kaizen/CAD, migración `migrarCleanAZonas`, mapeo de permisos clean>* → load>quote / equip>elec / load>civil, lista de eliminación, versiones load 5→6, equip 1→2, elec 8→9, quote 24→25, civil 5→6, kaizen 1→2, valor 1→2, clean retirado, pruebas S.89–S.97 + CM.load.14.a-e + mutantes, pruebas a reescribir/retirar, riesgos). |
| Especificación «fidelidad» | El agente terminó su salida estructurada pero el resultado NO quedó en el journal (sesión cortada): se vuelve a correr al reanudar. |
| Juez (funde las dos) | PENDIENTE |
| Prueba primero (S.89+ que fallan hoy) | PENDIENTE |
| Implementación | PENDIENTE (no hay ningún cambio de H-134 en el árbol) |
| Verificación / Corrección | PENDIENTE |

Decisiones que la especificación deja al dueño (cambian resultados o autorizaciones; preguntar antes de implementar):
1. `clean>elec` → `equip>elec` amplía la autorización (equip>elec también mete la cédula HVAC al cuadro). Alternativa: nuevo cruce `load>elec`.
2. Proyectos viejos con cuarto real cambian de cifras al abrir (fixture S.20: tons, cfm, sysTarget, quote, elec, civil); se registraría en `MOVIDOS_H134`.
3. ΔP o rendijas sin capturar = aviso `warn` (sigue calculando carga con aire exterior de cota inferior) o `err` (bloquea como sinACH).
4. Arista «FFU de cuartos limpios» del diagrama: renombrar (propuesto) o eliminar (13.6 baja de 3 a 2).
5. Duplicidad al migrar un cuarto sin `zonaId` junto a una zona limpia capturada a mano: aviso y borrado manual (propuesto) o fusión por nombre+área+altura.

### Flujos interrumpidos
- `wf_8451851d-a14` (H-134): detenido en Especificación; reanudable con `resumeFromRunId` (la espec «limpieza» se reutiliza de caché).
- Tarea de fondo `task_ad8fd733` («Fix viewVent crash») fue borrada: su contenido ya está en `baf14c9` (H-154), nada pendiente.
- Plugin `security-guidance` 2.0.8: su hook `security_reminder_hook.py` no abre y genera avisos en bucle. No se toca desde aquí
  (orden del dueño / bloqueo del clasificador). Remedio manual: renombrar `hooks.json` → `hooks.json.bak` en
  `…\AppData\Roaming\Claude\local-agent-mode-sessions\64f7dde2-…\c8bbd2b5-…\rpm\plugin_01YBNfaNwQztYsnUydt8m47G\hooks\`
  y reiniciar la app, o quitar el plugin en Configuración → Plugins.

### Pendientes fuera de H-134 (sin tocar)
- Estructural / Soportería: el dueño ordenó borrar «esas dos disciplinas»; falta confirmar si sólo Estructural (no calcula nada) o
  también Soportería (calcula sola y alimenta la sección G de cotización). Hasta entonces, ninguna se toca.
- Cascada de módulos (acordeón en la ventana principal, sin paneles laterales), con prueba de que ningún módulo abre en panel lateral.
- Bloques 5a (nombre EMP B12, quitar «HVAC» salvo la disciplina), 5b (portada con íconos grandes), 5c (H-30..H-40 contra código),
  5d (BLOQUEADO: faltan textos AISC 360 / CFE viento / NTC sismo), 5e (proyecto piloto + PDF).
- Paquetes externos StructCalc / SoporteCalc en `Desktop\Nueva carpeta (3)` y `Downloads`: no se borran hasta que el dueño decida.

### Cómo retomar
1. `git status` limpio y `git log --oneline -1` = commit de PAUSA.md sobre `5b3d903`; bancos en verde.
2. Si el dueño ya creó el repo: `git remote add origin https://github.com/loubetrnl-star/emp-suite-hvac.git` y `git push -u origin HEAD --tags`.
3. Resolver con el dueño las 5 decisiones de H-134 listadas arriba.
4. Reanudar el flujo: `Workflow({ scriptPath: "<script de arriba>", resumeFromRunId: "wf_8451851d-a14" })`; o, si se prefiere sin
   agentes, seguir la especificación «limpieza» del journal en el orden: pruebas S.89–S.97 (deben fallar por conducta) → motor load →
   consumidores → migración y permisos → eliminación de la pestaña → versiones/CHANGELOG → `node parches/regresion-motores/genera.mjs`
   → mutantes → dos bancos en verde → un commit «H-134 · load · …».
5. Después: decisión Estructural/Soportería, cascada de módulos, bloques 5a–5e.
