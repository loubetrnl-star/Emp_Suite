# CONTINUACIÓN · 27-sep-2026 (corte 14:45 UTC)

Archivo de retome. Al volver: leer este archivo completo y `CLAUDE.md`, verificar el estado (§1) y ejecutar el
siguiente paso exacto (§2). Donde contradiga a `PAUSA.md` o `RELEVO.md`, manda éste (la regla 1 de herencia quedó
retirada, §4).

## 1. Estado al corte
- Repositorio `github.com/loubetrnl-star/emp_suite`, rama de trabajo `claude/pausa-desarrollo-7tz93x` (`master` sigue en
  `801a326`, PAUSA). Último commit de trabajo: `6b31f85` (H-277); este archivo va encima. Árbol limpio, todo en origen.
- Bancos en `6b31f85`: `node pruebas.mjs index.html` → **521/521**; `node pruebas.mjs index.html --base
  respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html` → **527/527**.
- **No correr más de dos bancos a la vez:** con cuatro procesos simultáneos fallan 18.10 y 18.16 (almacenamiento de
  proyectos, estado compartido); solas pasan.
- `MOTOR_VER`: load 6 · clean 3 · equip 2 · duct 4 · vent 4 · quote 24 · valor 1 · kaizen 1 · elec 9 · hidro 8 ·
  fuego 4 · aire 5 · civil 6 · soporte 12.
- Ningún flujo en segundo plano corriendo. La revisión de H-264…H-266 se detuvo al corte (sólo lectura: no dejó cambios).
- Contenedor nuevo: clonar el repositorio en `/home/user/emp_suite` y cambiar a la rama; `npm install jsdom@30.1.0`
  (`package.json` está en `.gitignore`); recrear el respaldo del banco:
  `mkdir -p respaldo-rev-2.9.8 && git show 7d7c2d0:index.html > respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`.
  Node 22, Python 3.11; Playwright en `/opt/node22/lib/node_modules/playwright`, Chromium en `/opt/pw-browsers`.

## 2. Siguiente paso exacto
1. Verificar §1: `git log --oneline -1`, `git status` limpio y los dos bancos en verde.
2. Relanzar la revisión adversarial de H-264 (fuego), H-265 (civil) y H-266 (soportería) con
   `continuacion/flujos/01-revision-h264-h266.js` (sólo lectura; poner el HEAD actual en el texto). Cada hallazgo
   confirmado se corrige como commit complemento en la rama: prueba primero, un commit por hallazgo, dos bancos en verde,
   push.
3. Seguir la cola (§6) de una en una, por criticidad; al terminar cada una, integrar y arrancar la siguiente.

## 3. Qué se hizo el 27-sep-2026 (todo en origen)
| Hallazgo | Motor | Qué | Commits |
|---|---|---|---|
| H-262 | vent | Ventilación calcula con sus propios datos (área, altura, ocupantes); se retiró la propuesta load>vent; vent 3 → 4 | `c95c093`, `990b9de` |
| H-263 | load | El ventilador seleccionado entra a la zona que el usuario elige como «Misceláneos · Ventilación» (HP × 745.7 W, sensible; HP declarado ESTIMADO de catálogo); load 5 → 6 | `c4b2fdb`, `e0e1cf4` |
| H-264 | fuego | Contra incendio autónomo: área y altura propias, sin cruce load>fuego; fuego 3 → 4 | `5f8dfc4`, `969f6d9` |
| H-265 | civil | Obra civil autónoma: áreas de obra y cuartos propios; civil 5 → 6 | `2afdd81` |
| H-266 | soporte | Soportería autónoma: alturas y bases capturadas; metros de otros motores sólo con instantánea aceptada; soporte 11 → 12 | `fcda936` |
| H-268 | elec | Eléctrico autónomo: cargas de otros motores sólo como propuesta `cedula>elec` aceptada; sin modo en vivo; proyectos guardados abren con la misma cifra; elec 8 → 9 | `bd86822` (merge `0154b27`) |
| H-272a–f | archivos | La carga de archivos alimenta la captura propia de cada disciplina: espacios del plano/Excel a obra civil; reprocesar no duplica; nada se supone; un levantamiento alimenta varias disciplinas; catálogos como referencia consultable; los entregables distinguen lo que entró solo de lo aceptado | `71ae636`…`4ba009e` (merge `f6992a8`) |
| H-270 / H-271 | elec | Diagramas unifilar y trifilar en pantalla y memoria PDF, descritos desde computeElec; lo que falta queda «pendiente» | `ef7a41e`, `e1bbab8` (merge `ded0180`) |
| H-267 | equip | Selección autónoma: zonas de selección propias o aceptadas de carga térmica como instantánea; mismas cifras en los 14 motores al abrir; equip 1 → 2 | `2d953a9` (merge `c7b846d`) |
| H-269a / b | elec | Cuantificación de materiales propia (conductores, canalización, protecciones, tablero, transformador) y consideraciones de cálculo (NOM-001-SEDE-2012 por sección y página; sin texto → BLOQUEADO); no mueve cifras | `12a1146`, `c28ddeb` (merge `a3803da`) |
| H-277 | elec | Memoria, PDF y libro dicen la temperatura ambiente con la que se calculó (sin captura 30 °C, antes decían 40 °C); no mueve cifras | `6b31f85` |

- Pruebas nuevas: S.98–S.104, S.120–S.125, S.150–S.154. Libres: S.105–S.119, S.126–S.149, S.155 en adelante.
- Números H usados: H-262…H-272 y H-277. Reservados en flujos de la cola: H-273 (mutantes de ventilación), H-275 y
  H-276 (mutantes civil/load). El inventario de cruces numera desde H-274 saltando los reservados; lo nuevo, desde H-278.
  Comprobar antes de usar: `grep -oh 'H-2[0-9][0-9]' CHANGELOG-motores.md pruebas.mjs | sort -u`.

## 4. Decisiones del dueño vigentes (27-sep-2026)
- **Todos los motores independientes:** cada disciplina calcula sólo con lo que se captura en su pestaña; nada se hereda
  ni se lee en vivo de otra; lo de otra entra sólo como propuesta que el usuario acepta (instantánea, regla 2) y, ya
  aceptada, no se mueve sola (regla 3: si el origen cambia, se marca desactualizada). La regla 1 (herencia automática de
  geometría y ocupación, RELEVO §8) queda RETIRADA; `HEREDA` está vacío.
- Ventilación ↔ carga térmica: sólo el calor del motor del ventilador seleccionado (HP × 745.7 W, sensible) entra, como
  misceláneos, a la zona que el usuario elige al seleccionar.
- Contra incendio y obra civil autónomas («hay que dar entradas»). Soportería: los metros de ductos y tuberías entran al
  aceptar la propuesta y, ya cuantificados, no se mueven. Selección de equipo también independiente.
- Eléctrico independiente: el usuario da cargas, parámetros y consideraciones; el motor entrega alimentadores,
  transformador, cuantificación de materiales y diagramas unifilar y trifilar (hecho).
- Carga de archivos (planos, Excel, bases de datos de planos o dibujos, catálogos): su metadata inicia el cálculo
  alimentando la captura propia de cada disciplina (hecho).
- Operación: una tarea en segundo plano a la vez, la más crítica; al terminar se integra con los dos bancos en verde y se
  arranca la siguiente. El dueño ajusta el número de tareas con frecuencia: manda su último mensaje. Mensajes cortos;
  actuar cuando hay resultados. Interrumpir el turno con el botón de detener mata los flujos en segundo plano.

## 5. Decisiones que el dueño debe tomar (cambian resultados)
**Sellos (H-268 y H-267):** un proyecto sellado antes abre con cotización, Kaizen e ingeniería de valor en
«desactualizado · la captura cambió» aunque ninguna cifra se mueve. ¿Se sube quote a v25 «(dependencia)» para que diga
«el motor cambió»?

**H-268 · eléctrico**
1. Proyecto guardado con cruces parciales: se migraron sólo las filas de los cruces que estaban autorizados (mismas
   cifras). Alternativa: aceptar las seis al abrir (p. ej. 83.46 → 165.70 kVA).
2. Los permisos X>elec ya no mueven el cuadro; sólo quitar la carga aceptada la saca. ¿Conforme?

**H-272 · carga de archivos**
1. Aire comprimido sin columna de cantidad = 1 consumidor por renglón. ¿O «pendiente»?
2. Cuarto limpio sin clase ISO escrita: se ofrece sin marcar con «clase ISO pendiente». ¿Exigir la clase antes de aplicar?
3. Una planta suelta con dos o más espacios alimenta a varias disciplinas a la vez (con un solo espacio, sólo a carga
   térmica). ¿Conforme?
4. Eléctrico desde archivo: tensión y fases faltantes se ofrecen como 220 V sin marcar, «pendiente de confirmar». ¿O
   «pendiente» estricto sin valor?
5. Quitar un archivo no retira sus datos (avisa dónde quedaron). ¿Retirarlos?

**H-270 / H-271 · diagramas**
1. ¿`selConductor` devuelve polos, hilos y neutro para quitar el «N/F?» del trifilar? (no mueve cifras)
2. Carga monofásica a 220 V: asignar segunda fase y repartir el balance a la mitad (mueve cifras de balanceo).
3. Cargas repartibles (alumbrado, contactos, UPS): ¿dibujar N circuitos derivados o uno solo?

**H-267 · selección**
1. Zona capturada a mano sin perfil horario: simultaneidad «pendiente», bloque = suma de picos. ¿Capturar un perfil de
   8 a 18 h?
2. Sin sensible ni latente, la calificación de rooftop usa SHF 0.85 (criterio de la casa declarado). ¿Obligatorios o
   «pendiente»?
3. La preselección por zona (`r.eq` con `S.forceTech`) vive en carga térmica: ¿moverla a selección o retirarla de su
   memoria?
4. Volver a aceptar la propuesta reemplaza zonas editadas por el usuario (marcadas «editada aquí»). ¿Conservar las
   ediciones, como eléctrico conserva longitud y hp?

**H-269 · materiales eléctricos**
1. Renglón con cantidad mayor que 1: ¿cada unidad lleva su propio ramal? Hoy sus materiales quedan pendientes.
2. Circuitos monofásicos: ¿deducir polos y neutro por la tensión (V de fase = 1 polo + neutro; V de línea = 2 polos)?
3. Neutro en cargas trifásicas balanceadas y en sistemas 3F3H: computeElec lo cuenta y la cuantificación lo suma.
   Quitarlo cambia el tubo (mueve cifras, sube elec).
4. Espacios del tablero y accesorios (soportería, zapatas, terminales): ¿criterio de la casa o captura?

**Anteriores, siguen abiertas:** las 5 de H-134 (`PAUSA.md`); Estructural/Soportería (`PAUSA.md`); H-233 (`RELEVO.md`).

## 6. Cola pendiente, en orden (una a la vez)
| # | Tarea | Flujo en `continuacion/flujos/` |
|---|---|---|
| 1 | Revisión adversarial de H-264…H-266 → complementos | `01-revision-h264-h266.js` |
| 2 | Inventario de lecturas en vivo que quedan (clean, duct, aire, hidro, quote, valor, kaizen, load) → hallazgos H-274+. Ya se sabe: duct>equip lee la presión de ductos en vivo con permiso; la memoria de selección §8 imprime la preselección de carga (`r.eq`); `S.bldDiv` se captura en Proyecto | `02-mapa-cruces-restantes.js` |
| 3 | H-273 mutantes de ventilación + documentación de relevo. Trabajo parcial de H-273 en `continuacion/parciales/H-273-vent-mutantes.patch` (sin commit; aplicar con `git apply` y verificar) | `03-tareas-en-ramas.js` |
| 4 | Auditoría contra las reglas de la casa | `04-auditoria-reglas-casa.js` |
| 5 | Contenido de entregables PDF/Excel verificado con Python | `05-entregables-contenido.js` |
| 6 | Flujos de usuario de punta a punta en Chromium | `06-flujos-e2e.js` |
| 7 | Recorrido visual claro/oscuro/celular | `07-pruebas-visuales.js` |
| 8 | Oráculo en Python de vent, fuego, civil y soporte | `08-oraculo-python.js` |
| 9 | Mutantes de civil y load (H-275, H-276) | `09-mutantes-civil-load.js` |
| 10 | Cascada de módulos (acordeón en la ventana principal, sin paneles laterales) | `10-implementar-cascada.js` |
| 11 | Inventario de normas pendientes para el dueño | `11-normas-pendientes.js` |
| 12 | Lector de archivos probado con archivos reales del Drive | `12-archivos-reales.js` |

Después: ofrecer un renglón de catálogo como equipo seleccionado (H-272e lo dejó esperando a H-267, ya hecho); aislar el
estado de 18.10/18.16 para poder correr bancos en paralelo; H-134; decisión Estructural/Soportería; bloques 5a–5e;
quitar la pestaña «Cuartos limpios» (preguntar antes).

## 7. Pendientes del lado del dueño
- Hacer privado el repositorio Emp_Suite y borrar el repositorio público creado por error
  `-git-ls-remote-origin-head-Bash-completed-with-no-output-`.
- Textos de norma: SMACNA DCS, NFPA 13 T17.4.2.1(a), NFPA 96, Carrier Parte 1 Tabla 20A, ANSI Z358.1, AISC 360,
  CFE MDOC viento y sismo, NTC sismo.
- Opcional: guardar planos DWG como DXF para probar la carga con archivos reales.

## 8. Archivos de apoyo
- `continuacion/flujos/NN-*.js`: los flujos de la cola (JavaScript de la herramienta Workflow). Traen rutas de la sesión
  anterior (scratchpad en `/tmp/claude-0/…`, HEAD `fcda936` u otro): actualizarlas antes de lanzar. Si una rama o
  worktree que el flujo crea ya existe, reutilizarla o quitarla antes.
- `continuacion/integrar.sh <rama>`: fusiona la rama sin fast-forward, corre los dos bancos y la regresión. Si
  `genera.mjs` sólo cambia ids o fechas del fixture, revertirlo:
  `git checkout -- parches/regresion-motores/regresion-motores.emp.json`.
- `continuacion/parciales/H-273-vent-mutantes.patch`: cambios sin commit de `parches/mutantes/vent.json`.
- Worktrees locales `/home/user/wt-*`: sus ramas ya están integradas (salvo el parcial de `wt-vent`, guardado arriba);
  se pueden quitar con `git worktree remove`.
