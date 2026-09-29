# SuiteEmp · reglas de trabajo (rev 2.9.24, sesión de corrección de críticos)

Aplica a cualquier agente que toque este repositorio. Las decisiones del dueño mandan sobre todo lo demás.

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

## Stack
- App: HTML+JS en `index.html`, sin build. Banco y automatización: Node (`pruebas.mjs`, `parches/*.mjs`), con
  dependencias fijadas a versión exacta en `package.json` (sin `^` ni `~` en lo que se agregue).
- Cálculo de verificación, casos a mano y validación numérica: Python, con scripts reutilizables en `scripts/`
  (nombre estable; se sobrescriben) y versiones fijadas en `scripts/requirements.txt`. Cada script imprime unidades y
  supuestos. Los resultados de Python se contrastan con el motor JS y la diferencia se reporta, no se ajusta a mano.

## Supuestos y normas
- Cada valor calculado cita su supuesto y su fuente con cláusula o tabla (por ejemplo ASHRAE Handbook Fundamentals,
  capítulo y tabla con año; ASHRAE 62.1, tabla 6-1 con edición; SMACNA; NOM con número y año).
- Un supuesto sin respaldo se marca como «criterio de la casa» o «supuesto propio», nunca como norma.
- Si dos normas se contradicen, se señala y se usa la NOM vigente, salvo que el dueño decida otra cosa y así se registre.
- Aplica la regla 4 («Nada de memoria»): lo que no esté en `parches/normas-texto/` o en una fuente pública con URL
  queda `BLOQUEADO`.

## Cómo se corre el banco
```
node pruebas.mjs index.html
node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html
```
Los dos deben quedar en verde antes de cada commit. Con rojo no se avanza. `pruebas.mjs` acepta otra ruta de
`index.html` (útil para probar contra una copia).

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
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Los tags existentes no se mueven nunca; cada candidata lleva tag nuevo (`rev-2.9.24-candidata`, `-2`, …).
- No se commitean respaldos ni instaladores (`.gitignore`). El instalador se rehace con
  `node parches/construye-instalador.mjs <index.html> <carpeta-base> <salida.zip>`.
- Trabajo por disciplina en paralelo: rama `crit/<motor>` en un `git worktree`; cada agente toca sólo su región del
  motor en `index.html`, su bloque `/* ===== CM.<motor> ===== */` en `pruebas.mjs` y sus archivos en
  `parches/casos-a-mano/`. La integración a `master` la hace el integrador, en serie, con el banco en verde.

## Lo que nunca
- No cambiar `--senal`, `--p-*` ni la identidad de PDF/Excel. No agregar nombres de clientes u obras anteriores
  (QMX, VANTIVE, Nordson, Quasar) a pantalla ni documentos.
- No tocar la lógica de un motor que no es el tuyo; si hace falta, se registra como dependencia para el integrador.
- No usar `Date.now()` ni azar en fixtures o esperados.
