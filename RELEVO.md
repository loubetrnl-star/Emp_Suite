# RELEVO · pausa de sesión (26-sep-2026)

Para quien retome en una sesión nueva. Léelo completo antes de tocar nada. Reglas de trabajo del repositorio: `CLAUDE.md`.

## 1. Estado
- **EMP B12 / SuiteEmp rev 2.9.24** (REV_FECHA «25-sep-2026»). Tag existente `rev-2.9.24-candidata` (en `0fd9392`; los tags no se mueven).
- **HEAD de `master`:** el commit «PAUSA: relevo de sesión», encima de `baf14c9` (H-154 · vent · la pantalla sin modelo ya no truena, integrado desde `3a60e87`).
- **Banco (`pruebas.mjs` como en `baf14c9`, sin S.89):** `node pruebas.mjs index.html` → **503/503**; con `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html` → **509/509**. Los dos en verde.
- Versiones de motor: load 5 · clean 3 · equip 1 · duct 4 · vent 3 · quote 24 · valor 1 · kaizen 1 · elec 8 · hidro 8 · fuego 3 · aire 5 · civil 5 · soporte 11.
- Nota de pruebas: la prueba de Ventilación se llama **S.88** aquí (en la rama `claude/musing-bhabha-943757` se llamaba S.86, chocaba con la de H-181).

## 2. Plan (el prompt de integración, pasos 0 a 5)
| Paso | Estado |
|---|---|
| 0 · Respaldo | **Hecho.** Commit `baf14c9` y `respaldo-rev-2.9.24/Emp_Suite-completo-20260926-183442-baf14c9.tar.gz` (617 MB, 4,020 archivos; carpeta ignorada por git). |
| 1 · Inventario | **Hecho** (ver §3). |
| 2 · Empalme | **En curso.** SoporteCalc ya es nativo desde rev 2.9.8. **StructCalc (H-90) no está empalmado:** prueba S.89 escrita y fallando a propósito; el empalme no está escrito. |
| 3 · Verificación | Pendiente: portar las 76 comprobaciones de `EMP-StructCalc-v0.1.2/structcalc/pruebas/verificar.mjs` al banco. |
| 4 · Limpieza | Pendiente. Sólo con todo en verde. |
| 5a · Quitar «HVAC» / nombre EMP B12 | Pendiente. |
| 5b · Portada (nombre, descripción, íconos grandes centrados; tablero un clic después) | Pendiente. |
| 5c · Hallazgos H-30 a H-40 en adelante | Pendiente: verificar cada uno contra el código. |
| 5d · StructCalc rev 0.2 (AISC 360, viento, sismo) | Pendiente y **BLOQUEADO por norma** (§3, punto 5). |
| 5e · Proyecto piloto con todas las disciplinas y su PDF | Pendiente. |

## 3. Preguntas 1 a 8 y de dónde salió cada respuesta
1. **Razón social:** «EMP Instalaciones, S. de R.L. de C.V.». Fuente: `PROMPT-MAESTRO-EMP-B12.md` línea 7 y decisión H-93 (rev 2.9.11). El «LLC» del prompt y del README de StructCalc no pasa. Los «LLC» que queden en `index.html` sólo están en texto histórico (`REV_NOTA`).
2. **Paleta:** ya es la del isométrico del sitio (41 tonos). Fuente: `Bitacora-rev-2.9.16.md` §6 y prueba S.33. No se cambia nada.
3. **Íconos grandes en la portada:** la decisión de rev 2.9.12 (sin cuadrícula de íconos grandes) era de la navegación de 3 columnas. La portada del bloque 5b es una pantalla nueva y se hace. Fuente: memoria `emp-suite-project` y el enunciado del prompt.
4. **Nombre «EMP B12» y quitar «HVAC»:** `PROMPT-MAESTRO-EMP-B12.md` dice «EMP B12 no es solo HVAC». «HVAC» se queda donde nombra la disciplina de clima. No tocar `--senal`, `--p-*` ni la identidad de PDF y Excel (CLAUDE.md).
5. **AISC 360, viento y sismo:** en `parches/normas-texto/` no hay texto de AISC 360, CFE MDOC ni NTC. Regla 4 de CLAUDE.md: BLOQUEADO hasta conseguir el texto o una fuente pública con URL. Dejar la prueba y la propuesta.
6. **Integrar StructCalc:** no mueve resultados existentes (hoy la suite no calcula estructura). Entra el motor v0.1.2 tal cual, con sus 76 comprobaciones. Lo que llegue de otras disciplinas entra como propuesta. Fuente: `structcalc/README.md` y el código de `index.html`.
7. **Respaldos:** sólo se borran copias de StructCalc y SoporteCalc. Los demás `respaldo-rev-*` se quedan, porque el banco usa `respaldo-rev-2.9.8/index-2.9.21-inicio-…html` como `--base`. Se borran también `respaldo-rev-2.9.8/*-soportecalc-integrado-*`.
8. **Borrado fuera del proyecto:** antes del paso 4, meter en `respaldo-rev-2.9.24/` los paquetes externos; después, con el banco en verde, borrar:
   - `C:\Users\ASUS\Desktop\Nueva carpeta (3)\EMP-StructCalc-v0.1.2`
   - `C:\Users\ASUS\Desktop\Nueva carpeta (3)\EMP-SoporteCalc-v0.1.0`
   - `C:\Users\ASUS\Downloads\EMP-SoporteCalc-v0.1.0.zip`

   Si se borra el código, además quitar de `index.html` los textos que los nombran como productos aparte (38 renglones; mapa en §7).

## 4. Decisiones y su razón
- **Prueba S.89 apartada** en `parches/casos-a-mano/H-90-prueba-S89.mjs.txt` (opción 1 del relevo). Razón: CLAUDE.md exige el banco en verde antes de cada commit y S.89 falla a propósito.
- **Viento como casos independientes W, W2; sismo ±E.** Es como lo hace StructCalc y lo exige el prompt (5d); no se niega un caso de viento.
- **Estructural entra con el catálogo IR marcado «PRELIMINAR»** (dimensiones sin filetes; A y J quedan 1–3 % bajos). Regla 4/6: nada se estima; el aviso viaja a pantalla y memoria.
- **StructCalc no calcula peso de equipos ni carga colgada solo:** esas cargas entran como propuesta (regla 2 de interoperabilidad), nunca solas.
- **SoporteCalc:** falta revisar si hoy recibe pesos y trayectorias de ductos, tubería y eléctrico como propuesta (`PROPUESTAS["motores>soporte"]` ya existe para ductos, hidro, fuego y aire; eléctrico aún no). Si pasarlo a propuesta mueve cifras, detenerse y preguntar.

## 5. Archivos
- **Modificados** (en `baf14c9`): `index.html` (`R.demand` → `VENT.demand` en `viewVent`), `pruebas.mjs` (prueba S.88).
- **Creados:** `RELEVO.md`, `parches/casos-a-mano/H-90-prueba-S89.mjs.txt`, `respaldo-rev-2.9.24/Emp_Suite-completo-20260926-183442-baf14c9.tar.gz` (ignorado por git).
- **Eliminados:** ninguno.

## 6. Qué estaba haciendo y siguiente paso concreto
Terminado el análisis para el empalme de StructCalc y con la prueba S.89 escrita (falla por «Estructural sigue como módulo externo»). **Siguiente paso:**
1. Reincorporar S.89 a `pruebas.mjs` (insertarla antes del bloque `/* ===== R. Regresión por motor …`; el script de inserción usó el marcador exacto de esa línea) y confirmar que falla.
2. Escribir el empalme de StructCalc hasta que S.89 pase en verde. Resumen de lo que hay que tocar en `index.html` (números de renglón aproximados):
   - **Motor:** inlinear en una IIFE (como se hizo con SoporteCalc, memoria `emp-soportecalc-integracion`) los archivos de `structcalc/motor/*.mjs`, quitando `export`/`import`, y `catalogo/perfiles-ir.json` como objeto en lugar de `readFileSync`. Sin nombres repetidos entre sus archivos; **falta comprobar colisiones con `index.html`** (`GDL`, `IDX`, `Modelo`, `analizar`, `modal`, `pandeo`, `MATERIALES`, `LONGITUD`, `g`…). Exponerlo como un objeto (p. ej. `STRUCTCALC`).
   - **Estado y motor de la suite:** `S.estr` en `defaultState()` (~11203, campos de la prueba S.89: claro, alturaHombro, pendiente, separacion, perfilColumna, perfilTrabe, material, apoyo, rodilla, cumbrera, pesoPropio, pDelta, segC, segT, cmCubierta, cvCubierta, vientoMuro, vientoCubierta, sismoCortante, colgadaKgm2, equipos), global `ESTR` con `ok`, `filas[].nombre/reacciones`, `pendientes[]`; correr en `recompute()` (~11425) después de civil/soporte. Sin carga muerta capturada: `ok:false` con pendiente, nunca un valor por omisión.
   - **Registro:** `DISCIPLINAS` (~17371, quitar `grupo: "externo"`), `DOMAINS` (~4119), `MOTOR_ACC.estr` (~18186), `ENTRADAS` (~18244), `MOTOR_VER`/`MOTOR_CAMBIOS`/`resumenMotor`/`cifrasMotor` (~18268–18350; sube la versión, `CHANGELOG-motores.md` y `parches/regresion-motores/genera.mjs`), `capturaReal` y `semaforoDisciplina` (~17804 y ~17836), `viewEstructural` (~18639), `GUIA.estructural` (~21353), etiqueta de alcance (~5377), `PROPUESTAS` para cargas de equipo y colgadas, PDF de memoria.
   - **Pruebas existentes que suponen «externo» y hay que reescribir con su H-90:** P.1 (~4539), S.4 (~5184), 12.9 (~1389, el total pasa de 12 a 13), 18 (~5456–5457), 2.0.x del diagrama (~247, ~258), ~899, GC.* de Estructural (~8144–8240).
   - **Comprobación a mano de S.89:** 30 kgf/m² × 9.80665 = 294.1995 Pa; × 6 m de separación = 1,765.197 N/m; trabe de longitud √(10² + 1²) = 10.04988 m; 2 trabes → 35,480 N; con 1.4D → 49,672 N, **24,836 N por apoyo** (marco simétrico, peso propio apagado).
3. Portar las 76 comprobaciones de StructCalc al banco (paso 3), luego paso 4.
4. Al cerrar: nuevo tag `rev-2.9.24-candidata-2` (o el que corresponda a la versión nueva) con instalador rehecho (`node parches/construye-instalador.mjs`); no se mueve ningún tag existente.

## 7. Pendientes abiertos
- **Cascada de módulos en la ventana principal (acordeón):** cada módulo se despliega hacia abajo en la misma columna; sin paneles laterales, ventanas flotantes, modales ni pestañas nuevas; varios abiertos a la vez; transición suave; al abrir, la vista deja visible su encabezado; el encabezado lleva ícono, nombre, semáforo y una flecha que gira; recordar qué módulos estaban abiertos al volver al proyecto; que abrir o cerrar no altere datos ni cálculos; que se vea bien en computadora y celular; misma paleta y estado único con historial y deshacer. Agregar una prueba de que ningún módulo abre en panel lateral, subir la versión y anotarlo en el changelog. **Sin empezar; hay que ubicar dónde están hoy los paneles laterales** (por ejemplo `#modal`, `reopenSegment`, y las tarjetas de propuesta).
- **Quitar la pestaña «Cuartos limpios» (pedido del dueño):** los GMP (EU GMP Anexo 1) y los faltantes de información pasan a Carga térmica; la pestaña como tal se elimina. Sin empezar. **Hay que detenerse a preguntar si mover esto altera cifras:** el motor `CLEAN` alimenta la reposición de aire de carga térmica (`CLEAN.sum.makeup`), el cuadro de cargas eléctrico (FFU) y civil (`cleanRooms()`), y tiene tests (`pruebas-motores`, mutantes, casos a mano de `clean`). Se lanzó un mapa de acoplamientos (agente Explore) y **se interrumpió antes de completarlo**: repetirlo si hace falta. Referencias: `DISCIPLINAS` (~17346), `DOMAINS.clean` (~4123), `MOTOR_ACC.clean` (~18158), `capturaReal("clean")` (~17807), `computeCleanAll`, `viewLimpios`.
- **Plugin `security-guidance` (2.0.8):** el dueño pidió que yo eliminara las entradas de su `hooks.json` (`AppData/Roaming/Claude/local-agent-mode-sessions/…/plugin_01YBNfaNwQztYsnUydt8m47G/hooks/hooks.json`). **Yo no lo hago:** es una configuración de seguridad y no la modifico. Lo debe desactivar el dueño (desde la app, o en una terminal interactiva con `claude plugin disable security-guidance@inline`, sin garantía de que ese nombre exacto exista) o editar él mismo el archivo. Sus avisos llegan vacíos porque `python.exe` no abre `security_reminder_hook.py`; el script sí existe y es visible desde bash. Hasta entonces, **ignorar esos avisos por completo, sin mencionarlos**.
- **Sin remoto en git:** el dueño tiene GitHub. Pedirle la URL y confirmar antes de cualquier push.
- **Textos de norma que el dueño debe pasar:** SMACNA DCS (H-168, H-227), NFPA 13 T17.4.2.1(a) (CPVC de H-224), NFPA 96 (ratifica H-165), Carrier Parte 1 Tabla 20A (ratifica H-120 y H-141), ANSI Z358.1 (ratifica H-195). Más AISC 360, CFE MDOC y NTC para 5d.
- **H-233** (tabla «MSS SP-58 / IMC 305.4» de acero, alto): decisión del dueño, no está en el plan.
- **Dependencias registradas:** Kaizen estima cobre extra con 1,350 MXN/m y 30 m; eléctrico sigue listando «Bomba de agua» aunque la presión alcance (H-196).
- **Instalador:** `SuiteEmp-2.9.24-instalador.zip` (raíz, ignorado) es de `0fd9392`, no incluye el arreglo de Ventilación.

## 8. Reglas vigentes
**Regla de operación (del dueño):** avanzar bloque por bloque sin volver a lo ya hecho, sin revisar lo cerrado; contestar tú las preguntas con lo que haya en la carpeta y mostrarlas en un bloque; detenerse sólo si una decisión cambia resultados de cálculo. Usar Node, no Python.

**Nunca borrar antes de integrar y verificar.** Los borrados fuera del proyecto se respaldan antes.

**CLAUDE.md (resumen):** prueba primero con el ID `S.nn (H-nnn)` y debe fallar por la conducta; un commit por hallazgo con encabezado `H-nnn · motor · qué` (norma con edición y año, antes → después, prueba, resultado del banco); si mueve números sube `MOTOR_VER`, agrega `MOTOR_CAMBIOS`, `CHANGELOG-motores.md` y regenera el esperado del motor; nada de memoria (sin texto de norma o URL: BLOQUEADO); nada se estima («pendiente», «Por cotizar»); espejo ES/EN con `L()`; los entregables dicen de dónde sale cada valor; ambos bancos en verde antes de cada commit; commits en español con `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; tags nuevos, nunca mover los existentes; no commitear respaldos ni instaladores; no tocar la lógica de un motor ajeno (se registra la dependencia); sin `Date.now()` ni azar en fixtures; sin nombres de clientes o de obras anteriores.

**Paleta idéntica al sitio publicado** (isométrico de emdelpacifico.netlify.app, 41 tonos; `--senal`, `--p-*` y la identidad de PDF y Excel no cambian; prueba S.33).

**Tres reglas de interoperabilidad:**
1. La geometría y la ocupación (área, altura, volumen, personas) se heredan solas, sin recalcular.
2. Un resultado calculado de otra disciplina nunca entra solo: se ofrece como propuesta que el usuario acepta o sustituye, con origen y fecha.
3. Si cambia el dato de origen, el destino no se recalcula: se marca desactualizado y el usuario decide.

**Comandos:** `node pruebas.mjs index.html` y `node pruebas.mjs index.html --base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html` (ambos en verde antes de commitear). El instalador: `node parches/construye-instalador.mjs <index.html> <carpeta-base> <salida.zip>`.
