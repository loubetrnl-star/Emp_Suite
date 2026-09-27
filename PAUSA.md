# PAUSA · 26-sep-2026

Punto de archivo antes de decidir si se continúa. Nada se relanza hasta que el dueño diga «continúa».

## Estado del repositorio
- Último commit de trabajo: `5b3d903` «PAUSA: relevo de sesión» (sobre `baf14c9` H-154 y `0fd9392` rev 2.9.24).
- Etiqueta: `pausa-2026-09-26` (apunta a `5b3d903`; este archivo se commitea encima).
- Rama: `master`. Árbol limpio al etiquetar. Sin remoto configurado (el dueño creará `loubetrnl-star/emp-suite-hvac`
  privado en GitHub; GitHub CLI no está instalado, el push se hará con `git remote add origin … && git push -u origin HEAD`
  cuando el dueño confirme que el repo vacío existe).
- Bancos en verde en `5b3d903`: `node pruebas.mjs index.html` y `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`.
- Respaldo completo: `respaldo-rev-2.9.24/Emp_Suite-completo-20260926-183442-baf14c9.tar.gz` (ignorado por git).

## Hitos terminados
- Rev 2.9.24: corrección de los críticos de la auditoría (`0fd9392`, tag `rev-2.9.24-candidata`), REPORTE-CRITICOS.md, bitácora.
- H-154 · vent: la pantalla sin modelo ya no truena (`baf14c9`, prueba S.88).
- H-224 · soporte: red contra incendio soportada con su material (parte no bloqueada).
- RELEVO.md: respuestas 1–8 del plan de integración, receta de empalme, pendientes.
- Prueba S.89 (H-90, Estructural nativo) estacionada en `parches/casos-a-mano/H-90-prueba-S89.mjs.txt` (no se inserta:
  orden del dueño de no tocar Estructural ni Soportería).
- Regla imperativa del dueño registrada: cada disciplina es independiente (motor, selección, memoria y cotización propios;
  cruces sólo como propuesta).

## H-134 (Cuartos limpios → zona de Carga térmica): punto exacto
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

## Flujos interrumpidos
- `wf_8451851d-a14` (H-134): detenido en Especificación; reanudable con `resumeFromRunId` (la espec «limpieza» se reutiliza de caché).
- Tarea de fondo `task_ad8fd733` («Fix viewVent crash») fue borrada: su contenido ya está en `baf14c9` (H-154), nada pendiente.
- Plugin `security-guidance` 2.0.8: su hook `security_reminder_hook.py` no abre y genera avisos en bucle. No se toca desde aquí
  (orden del dueño / bloqueo del clasificador). Remedio manual: renombrar `hooks.json` → `hooks.json.bak` en
  `…\AppData\Roaming\Claude\local-agent-mode-sessions\64f7dde2-…\c8bbd2b5-…\rpm\plugin_01YBNfaNwQztYsnUydt8m47G\hooks\`
  y reiniciar la app, o quitar el plugin en Configuración → Plugins.

## Pendientes fuera de H-134 (sin tocar)
- Estructural / Soportería: el dueño ordenó borrar «esas dos disciplinas»; falta confirmar si sólo Estructural (no calcula nada) o
  también Soportería (calcula sola y alimenta la sección G de cotización). Hasta entonces, ninguna se toca.
- Cascada de módulos (acordeón en la ventana principal, sin paneles laterales), con prueba de que ningún módulo abre en panel lateral.
- Bloques 5a (nombre EMP B12, quitar «HVAC» salvo la disciplina), 5b (portada con íconos grandes), 5c (H-30..H-40 contra código),
  5d (BLOQUEADO: faltan textos AISC 360 / CFE viento / NTC sismo), 5e (proyecto piloto + PDF).
- Paquetes externos StructCalc / SoporteCalc en `Desktop\Nueva carpeta (3)` y `Downloads`: no se borran hasta que el dueño decida.

## Cómo retomar
1. `git status` limpio y `git log --oneline -1` = commit de PAUSA.md sobre `5b3d903`; bancos en verde.
2. Si el dueño ya creó el repo: `git remote add origin https://github.com/loubetrnl-star/emp-suite-hvac.git` y `git push -u origin HEAD --tags`.
3. Resolver con el dueño las 5 decisiones de H-134 listadas arriba.
4. Reanudar el flujo: `Workflow({ scriptPath: "<script de arriba>", resumeFromRunId: "wf_8451851d-a14" })`; o, si se prefiere sin
   agentes, seguir la especificación «limpieza» del journal en el orden: pruebas S.89–S.97 (deben fallar por conducta) → motor load →
   consumidores → migración y permisos → eliminación de la pestaña → versiones/CHANGELOG → `node parches/regresion-motores/genera.mjs`
   → mutantes → dos bancos en verde → un commit «H-134 · load · …».
5. Después: decisión Estructural/Soportería, cascada de módulos, bloques 5a–5e.
