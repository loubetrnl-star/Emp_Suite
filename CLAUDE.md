# SuiteEmp · reglas de trabajo (rev 2.9.24, sesión de corrección de críticos)

Aplica a cualquier agente que toque este repositorio. Las decisiones del dueño mandan sobre todo lo demás.

Este archivo incorpora las instrucciones globales del dueño (`~/.claude/CLAUDE.md`) para que también rijan en sesiones
en la nube, donde ese archivo no existe. Si una instrucción general contradice una regla específica de este
repositorio, manda la del repositorio.

## Idioma
- Responde siempre en español, aunque el código, los archivos o la documentación estén en inglés.
- Deja identificadores, comandos y nombres de archivo tal cual.

## Qué es esto
- Una sola aplicación en `index.html` (HTML+JS, sin build). Banco de pruebas: `pruebas.mjs` (jsdom).
- Documentos de referencia: `AUDITORIA.md` (155 hallazgos, H-107 a H-261), `PLAN-CRITICOS.md` (plan de corrección),
  `CHANGELOG-motores.md` (versión por motor), `Bitacora-rev-*.md`, `PROMPT-MAESTRO-EMP-B12.md`.
- Textos de norma disponibles: `parches/normas-texto/` (ver su README). Lo que no está ahí, está «de memoria».

## Alcance de la suite
- Objetivo: unificar en `index.html` las tres apps que antes estaban separadas: CargaTermica/LoadCalc (motor `load`),
  VentCalc (motor `vent`) y DuctCalc (motor `duct`). La meta es que compartan captura de proyecto, unidades, catálogos
  y entregables, y que cada una conserve su motor, su versión en `MOTOR_VER` y su bloque de pruebas.
- Las copias sueltas de las apps viejas (`Desktop\DuctCalc`, `Desktop\VentCalc`, `EMP BIBLIO\APP\...`, los Excel
  `CARGA_TERMICA_*`, `Ductolador_*`) son sólo referencia de conducta. Se lee de ellas y no se editan.
- Fuera de alcance: QMX, Safran/SSCA, cotizaciones de obra, ADMIN, VERTIV y cualquier otra carpeta fuera de este
  directorio. Esta sesión no las lee ni las modifica.

## Método de trabajo
- Para explorar el código o el problema, lanza subagentes en paralelo con el modelo claude-sonnet-5-5, uno por área o
  hipótesis, máximo seis a la vez (decisión del dueño, 9-oct-2026). Además, un programador (claude-opus-5-5,
  esfuerzo alto) escribe código y pruebas en su propio worktree y rama; sólo el hilo principal escribe en `master`.
- Reserva el modelo principal para la consolidación.
- Consolida los hallazgos en un análisis profundo con rigor científico e ingenieril antes de proponer cambios, e indica
  el nivel de confianza de cada conclusión.
- No concluyas con un solo subagente si el problema tiene más de un frente.

## Stack
- App: HTML+JS en `index.html`, sin build. Banco y automatización: Node (`pruebas.mjs`, `parches/*.mjs`), con
  dependencias fijadas a versión exacta en `package.json` (sin `^` ni `~` en lo que se agregue).
- Cálculo de verificación, casos a mano y validación numérica: Python, con scripts reutilizables en `scripts/`
  (nombre estable; se sobrescriben) y versiones fijadas en `scripts/requirements.txt`. Cada script imprime unidades y
  supuestos. Los resultados de Python se contrastan con el motor JS y la diferencia se reporta, no se ajusta a mano.
- Análisis de datos y generación de documentos: también Python.
- No estimes ni calcules de cabeza lo que se puede ejecutar. Escribe y corre el script, y reporta el resultado real, no
  el esperado.
- Apóyate siempre en los skills disponibles de Anthropic antes de improvisar una solución propia. Revisa primero si
  existe un skill que cubra la tarea, en especial para Excel, Word, PowerPoint y PDF. Si ningún skill aplica, dilo y
  sigue con script.
- Borra los scripts de un solo uso al terminar.

## Reparto Python / Node y herramientas de verificación (decisión del dueño, 9-oct-2026)
- Node corre todo lo que ejecuta el código de la suite: banco, mutantes, esperados, instalador, revisión estática,
  cobertura y pruebas por propiedades. Python es el verificador independiente: recalcula la fórmula desde la norma con
  otra implementación, revisa unidades, extrae y coteja tablas de norma, y abre los Excel y PDF que genera la suite. No
  se duplican: Python no corre el banco y Node no coteja contra norma. Ningún número de verificación sale de memoria.
- Python: entorno `.venv-verificacion` (ignorado por git), `requirements-verificacion.txt` con versiones exactas, sólo
  wheels de PyPI: Pint 0.26.1, fluids 1.3.1 (numpy 2.5.3, scipy 1.18.1), pdfplumber 0.11.10, openpyxl 3.1.5.
  psychrolib NO se instaló: sólo publica un sdist cuyo `setup.py` usa `distutils`, retirado de Python 3.12+.
  Verificador: `scripts/verificacion_independiente.py <valores-suite.json>` (los valores de la suite los extrae Node con
  `continuacion/arnes.mjs`).
- Node (devDependencies exactas): c8 12.0.0, fast-check 4.10.2, eslint 10.11.0; jsdom 30.1.0 sin `^`.
  Revisión estática: `node parches/revision-estatica.mjs` (node --check + no-undef con los globales de jsdom).
  Cobertura por motor: `npx c8 --temp-directory <dir> --clean=false --reporter=text-summary node pruebas.mjs index.html`
  y después `node parches/cobertura-motores.mjs <dir> index.html`.
- Nada de esto entra a `index.html` ni al instalador.
- Skills: documentos con `anthropic-skills:pdf`, `xlsx` y `docx`; antes de cada commit que toque un motor y de cada
  fusión, `engineering:code-review` (sólo hallazgos de corrección); `engineering:testing-strategy` si sobrevive un mutante;
  `engineering:debug` si un banco queda en rojo sin causa clara. No se usan HawkScan ni conectores de correo, calendario
  o Drive.

## Supuestos y normas
- Cada valor calculado cita su supuesto y su fuente con cláusula o tabla (por ejemplo ASHRAE Handbook Fundamentals,
  capítulo y tabla con año; ASHRAE 62.1, tabla 6-1 con edición; SMACNA; NOM con número y año).
- Un supuesto sin respaldo se marca como «criterio de la casa» o «supuesto propio», nunca como norma.
- Si dos normas se contradicen, se señala y se usa la NOM vigente, salvo que el dueño decida otra cosa y así se registre.
- Aplica la regla 4 («Nada de memoria»): lo que no esté en `parches/normas-texto/` o en una fuente pública con URL
  queda `BLOQUEADO`.
- No entregues un número sin su fuente.

## Cómo se corre el banco
```
node pruebas.mjs index.html
node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
```
Los dos deben quedar en verde antes de cada commit. Con rojo no se avanza. `pruebas.mjs` acepta otra ruta de
`index.html` (útil para probar contra una copia).

Velocidad (decisión del dueño, 7-oct-2026; medido ese día en esta PC):
- Los dos bancos completos se corren **a la vez** (son dos, el tope de `turno.sh` se respeta): 57 s contra 101 s en serie
  (49.4 s + 51.9 s). En PowerShell: dos `Start-Job` y `Wait-Job`.
- Durante el ciclo rojo/verde de una tarea se corre sólo lo del motor tocado con `--solo <regex>` (aire: 4.4 s). El
  filtrado NO vale como banco: las comprobaciones comparten estado y una omitida puede dejar sin preparar a otra (con
  `--solo "aire|S\.222"` cae S.188 por falta de un tramo de ductos). Antes de cada commit, los dos completos.
- Las aprobaciones del dueño se piden juntas, en un solo mensaje por bloque, no una por hallazgo.

## Reglas por hallazgo (obligatorias)
1. **Prueba primero.** La prueba lleva el ID (`S.nn (H-nnn) …`), se escribe antes y debe FALLAR con el código actual
   por la conducta que corrige (no por un símbolo inexistente). Luego se corrige y debe pasar.
2. **Un commit por hallazgo**, con este encabezado: `H-nnn · motor · qué`. En el cuerpo: norma con edición y año (o
   «criterio de la casa» / «decisión del dueño»), valor antes → después, prueba que lo cubre, resultado del banco.
3. **Si mueve números, sube `MOTOR_VER[motor]`** (index.html, `const MOTOR_VER`), agrega el hallazgo en
   `MOTOR_CAMBIOS`, actualiza `CHANGELOG-motores.md` y regenera el esperado de ese motor en el mismo commit:
   `node parches/regresion-motores/genera.mjs` (sólo regenera motores cuya versión subió; NO lo uses para
   «arreglar» R.1 sin subir versión). Revierte el fixture si sólo cambió por timestamps
   (`git checkout -- parches/regresion-motores/regresion-motores.emp.json`).
4. **Nada de memoria.** Si la norma no está en `parches/normas-texto/` ni en una fuente pública citada con URL, el
   hallazgo queda `BLOQUEADO: requiere texto de norma`: se deja la prueba y la corrección propuesta, no se cierra.
5. **Falsos positivos** se retiran con evidencia (renglón, página, cita), no se «corrigen».
6. **Nada se estima.** Sin dato capturado: «pendiente» o «Por cotizar», nunca un valor por omisión que parezca cálculo.
   Sin longitud: «pendiente de longitud». Precios sin fuente y fecha: «Por cotizar».
7. **Espejo ES/EN**: todo texto nuevo que llegue a la propuesta va con `L(es, en)`. Nada en USD sin `fxVigente()`.
8. **Textos de entregables** (memoria, PDF, Excel, pantalla) deben decir de dónde sale cada valor: capturado,
   catálogo (con procedencia), norma (edición, tabla) o criterio de la casa.

## Git
- Identidad local del repo: `EMP Suite <suite@emdelpacifico.local>`. Mensajes en español. Cada commit termina con
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (decisión del dueño, 9-oct-2026; los commits anteriores
  conservan la firma con la que se hicieron).
- Los tags existentes no se mueven nunca; cada candidata lleva tag nuevo (`rev-2.9.24-candidata`, `-2`, …).
- No se commitean respaldos ni instaladores (`.gitignore`). El instalador se rehace con
  `node parches/construye-instalador.mjs <index.html> <carpeta-base> <salida.zip>`.
- Trabajo por disciplina en paralelo: rama `crit/<motor>` en un `git worktree`; cada agente toca sólo su región del
  motor en `index.html`, su bloque `/* ===== CM.<motor> ===== */` en `pruebas.mjs` y sus archivos en
  `parches/casos-a-mano/`. La integración a `master` la hace el integrador, en serie, con el banco en verde.

## Formato de salida
- Cierra cada respuesta sustantiva con una sección titulada Siguientes pasos.
- Incluye de dos a cuatro acciones concretas derivadas de la conversación actual, nunca genéricas.
- Empieza cada una con un verbo en imperativo.
- Nombra archivos, comandos o rutas específicas cuando apliquen.
- Agrega en la misma línea una explicación breve de por qué la recomiendas, máximo una oración.
- Omite la sección en respuestas de confirmación, respuestas de una línea o cuando no haya siguiente paso real.

## Lo que nunca
- No cambiar `--senal`, `--p-*` ni la identidad de PDF/Excel. No agregar nombres de clientes u obras anteriores
  (QMX, VANTIVE, Nordson, Quasar) a pantalla ni documentos.
- No tocar la lógica de un motor que no es el tuyo; si hace falta, se registra como dependencia para el integrador.
- No usar `Date.now()` ni azar en fixtures o esperados.

## Relación con el CLAUDE.md global (decisión del dueño, 2026-09-29)
Principio: cada motor (`load`, `vent`, `duct`) es independiente. Nada de lo que pase en uno detiene, cambia ni
versiona a otro.
- Norma sin texto: manda la regla 4. Si la norma no está en `parches/normas-texto/` ni en fuente pública con URL, el
  hallazgo queda `BLOQUEADO` sólo en su motor; los demás motores siguen. «Supuesto propio» / «criterio de la casa»
  sólo aplica a supuestos que no se presentan como norma.
- Subagentes: la exploración (sólo lectura) va con subagentes en paralelo, máximo seis a la vez, cada uno acotado a
  un motor. Un programador (`.claude/agents/programador.md`) toma una tarea a la vez, de un motor distinto al del hilo
  principal, en su worktree y rama, con un rango de IDs de prueba reservado; no mueve números, no sube `MOTOR_VER`, no
  escribe en `bitacora.md` ni toca congelados o Soportería. La integración a `master` la hace el hilo principal, un commit
  a la vez, con los dos bancos en verde (decisión del dueño, 9-oct-2026). Toda edición sigue el esquema `crit/<motor>` en su worktree; ningún agente edita fuera de su región.
- Lo compartido (captura de proyecto, unidades, catálogos, entregables) no lo toca ningún motor: se registra como
  dependencia y lo resuelve el integrador en `master`.
- Versión y esperados por motor: sólo sube `MOTOR_VER` del motor que movió números y sólo se regenera su esperado.
  Un rojo en el bloque `CM.<motor>` detiene ese motor; un rojo en lo común detiene la integración de todos.
- Firma de commits: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, como indica la sección Git.

## Congelados (decisión del dueño, 28-sep-2026)
- Kaizen, Ingeniería de valor y Cotización general (`computeQuote`, `QUOTE`, kaizen, valor, sus pestañas, PDF, Excel y
  `MOTOR_VER`) NO SE TOCAN hasta que terminen todas las demás disciplinas. Si una tarea obliga a tocarlos, se detiene
  ahí, se registra como dependencia en la bitácora y se sigue con la siguiente. La cotización propia de cada
  disciplina (H-293 a H-304, `X.cot`) sí es de su motor y sí se trabaja. Origen:
  `continuacion/auditoria-2026-09-28/PROMPT-CODE-independencia-y-criticos.md`, líneas 13-17.
