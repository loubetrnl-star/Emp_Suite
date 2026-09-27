# CONTINUACIÓN · 27-sep-2026 (corte 17:45 UTC, segunda sesión del día)

Archivo de retome. Al volver: leer este archivo completo y `CLAUDE.md`, verificar el estado (§1) y ejecutar el siguiente paso
exacto (§2). Manda sobre `PAUSA.md`, `RELEVO.md` y la versión anterior de este archivo (en git, `63a2794`).

## 1. Estado al corte
- Repositorio `github.com/loubetrnl-star/emp_suite`, rama de trabajo **`claude/focused-euler-f9knvw`** (contiene todo
  `claude/pausa-desarrollo-7tz93x` más lo de esta sesión; `master` sigue en `801a326`). Último commit de código: `1393ef3`
  (H-210); este archivo va encima. Todo en origen. Árbol limpio.
- Bancos en `1393ef3`: `node pruebas.mjs index.html` → **522/522**; `--base respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`
  → **528/528**. Desde `385eb8a` pueden correr varios a la vez (probado: 4 simultáneos en verde). El semáforo
  `continuacion/turno.sh` reparte 3 lugares (deja un núcleo a los agentes).
- `MOTOR_VER`: load 6 · clean 3 · equip 2 · duct 4 · vent 4 · quote 24 · valor 1 · kaizen 1 · elec 9 · hidro 8 · **fuego 5** ·
  aire 5 · civil 6 · soporte 12.
- Nada corriendo en segundo plano: al corte se detuvieron los dos flujos (H-274 y complementos de H-266); su avance quedó como
  parches en `continuacion/parciales/` (§8).
- Contenedor nuevo (ojo: el clon llega **superficial**):
  `git fetch --unshallow origin && git checkout claude/focused-euler-f9knvw` (sin esto no existe `7d7c2d0`);
  `npm install jsdom@30.1.0`; `mkdir -p respaldo-rev-2.9.8 && git show 7d7c2d0:index.html > respaldo-rev-2.9.8/index-2.9.21-inicio-20260921-221100.html`;
  `git config user.name "EMP Suite" && git config user.email suite@emdelpacifico.local`. Con worktrees y `node_modules`
  enlazado: `echo node_modules >> .git/info/exclude`. Node 22, Python 3.11, Chromium en `/opt/pw-browsers`.

## 2. Siguiente paso exacto
1. Verificar §1 (`git log --oneline -1`, `git status` limpio, dos bancos en verde).
2. **Aquí me quedé** (sin cambios en el árbol): complemento de **H-264 · fuego · migración** (hallazgos C3/U17 y U2 de la
   revisión; detalle y reproducción en `continuacion/revision-h264-h266/fuego.md`). Un proyecto guardado antes de H-264 abre hoy
   con la altura heredada vieja (media ponderada, p. ej. 3.91 m en vez de 13 m) o con otra área (tomarArea + permiso load>fuego),
   y la memoria la llama «capturada».
   - **Prueba primero S.106 (H-264)** en `pruebas.mjs` justo después de S.105 (S.105 empieza en la línea 7719; S.101 en la 7760):
     proyecto viejo con `her["fuego.altura"]` y `her["fuego.area"]` en «heredado» (Oficinas 2000 m² × 3 m + Almacén 200 m² × 13 m,
     fuego.altura guardada 3.91, cabezal 30, montante 12) abierto con `importarRespaldo` → altura 13, estática 14, aviso de rack y
     la memoria NO dice «capturados en esta pestaña»; y un respaldo con `tomarArea: true`, permiso `load>fuego` y zonas de 800 m²
     (área capturada 600) → abre con 800 m². Hoy falla (3.91 m / 600 m²).
   - **Corrección** en `index.html`, `sanearEstado`: antes de la línea **24166**
     (`Object.keys(s.her).forEach((k) => { if (!HEREDA[k]) delete s.her[k]; });`), con `geo` de la línea **24155**: si `geo.hay` y
     `s.her["fuego.altura"].modo === "heredado"` → `s.fuego.altura = geo.alturaMax`; si `s.her["fuego.area"].modo === "heredado"`
     → `s.fuego.area = Math.max(1, Math.round(geo.area))` (lo que hacía `sincronizarHerencia` en `e0e1cf4`); si
     `s.fuego.tomarArea === true` y `s.perms["load>fuego"]` y `geo.area > 0` → `s.fuego.area = geo.area` (lo que `computeFuego`
     tomaba en vivo). Marcar `s.fuego.sinConfirmar = { altura, area }` con el valor migrado (patrón H-179: buscar
     `s.elec.sinConfirmar = sc`). En `computeFuego` (línea 10959; memoria de la trayectoria en la 11060) y `buildFuegoPdf`
     (línea 2583): mientras el valor siga igual a la marca, decir «tomada al abrir de la zona más alta de Carga térmica (proyecto
     anterior a H-264), sin confirmar» y avisar (warn) que se confirme; L(es,en) si llega a la propuesta.
   - Restaurar en `parches/regresion-motores/regresion-motores.emp.json` `fuego.altura` = 4.71 (como lo guardó `e0e1cf4`;
     `5f8dfc4` lo editó a 6) para que R.1 vigile la migración: con la corrección vuelve a dar 6 m / 39.105 (el esperado actual).
   - Mueve cifras de proyectos anteriores: `MOTOR_VER.fuego` 5 → 6, `MOTOR_CAMBIOS`, `CHANGELOG-motores.md`, `genera.mjs` (luego
     revertir el fixture reescrito y dejar sólo 6 → 4.71), mutantes `fuego.m38` en adelante. Un commit «H-264 · fuego ·
     complemento: …».
3. **H-264 · fuego · sello** (U3/U11a): `ENTRADAS.fuego` (línea 19152) sin `perms: ePerms()` (aceptar la propuesta de soportería
   concede fuego>soporte y marcaba «la captura cambió» sin cifras distintas). Prueba S.107. No mueve cifras.
4. **H-265 · civil · complementos** (`continuacion/revision-h264-h266/civil.md`): C4 (con «De las áreas de obra» y la lista
   vacía se cotizan totales a mano ocultos), C6/U1 (área o cuarto sin altura sale de la propuesta sin pendiente), U7 (la
   migración descarta zonas sin área con tabiquería capturada), U9 (plantilla y referencia conservan nombres de áreas y
   cuartos), U4 (la prueba 2.0.6 quedó tautológica). Pruebas S.115–S.119, después de S.101.
5. **H-266 · soporte · complementos** (`continuacion/revision-h264-h266/soporte.md`): C2 hecho en rama local →
   `git am continuacion/parciales/H-266-complemento-C2.patch` (prueba S.130); U5 en curso →
   `git apply continuacion/parciales/H-266-complementos-en-curso.patch` (S.131, soporte 12 → 13; revisar, bancos, commit);
   faltan U8, U10, U13, U14, U15 y U16 (S.132–S.137). O relanzar `continuacion/flujos/14-h266-complementos.js` en un worktree
   nuevo tras aplicar los parches.
6. **H-274 · equip** (mapa §0, §1 y §10): pruebas S.126–S.128 escritas, sin implementar →
   `continuacion/parciales/H-274-equip-en-curso.patch` (hecho sobre `b186ac8`, insertadas después de S.104). Relanzar
   `continuacion/flujos/13-h274-equip.js` o seguir a mano.
7. Textos U12/U18 (`textos.md`: tablero «Heredan la geometría», libro ES/EN, diagrama) y U6 (`general.md`: `genera.mjs` reescribe
   el fixture con el estado migrado).
8. Después, en el orden del mapa (`continuacion/mapa-cruces-restantes.md` §10): H-283/H-284/H-285 (huellas sin sitio; antes,
   decisión de re-sello), H-281 (clean>load), H-278 (quote; D4), H-279/H-280 (kaizen/valor; D2, D3, D5), H-282 (aire; D1) y los
   defectos X-1…X-4.

## 3. Qué se hizo en esta sesión (27-sep-2026, tarde)
| Commit | Qué |
|---|---|
| (fast-forward) | `claude/focused-euler-f9knvw` se adelantó a `claude/pausa-desarrollo-7tz93x` (`63a2794`) |
| `385eb8a` | Banco: 18.10, 18.16 y 18.19 esperan a su condición, no a un reloj fijo. Causa: el FileReader de jsdom encadena tres `setImmediate`; una pausa > 80 ms dejaba ganar al reloj de la prueba y la carga tardía caía dentro de 18.16 (no era estado compartido). Con pausa inyectada: banco viejo 518/521, nuevo 521/521; 4 bancos a la vez en verde |
| `c5b6a17` (merge `57b2519`) | Relevo: `Bitacora-independencia-motores.md`, `PAUSA.md` y `RELEVO.md` al día |
| `b186ac8` | Herramientas: `mutantes.mjs --paralelo N` (equip: 4 mutantes en 2 min 13 s contra ~5 min), `continuacion/turno.sh`, `continuacion/arnes.mjs`, `integrar.sh` sin rutas fijas |
| `1393ef3` | **H-210 · fuego**: sin altura, cabezal o montante capturados la bomba no se dimensiona (presión y potencia «pendiente», aviso err, semáforo «incompleta», pendiente en la cotización ES/EN, sin carga a eléctrico; sin 6/30/12 m ni 30 mca ocultos). fuego 4 → 5. S.105; CM.fuego.6.F10–F12 vigentes; mutantes m09/m21/m26 reapuntados y m34–m37 nuevos, todos MUERTOS |
| (este) | CONTINUACIÓN al corte; revisión y mapa guardados en `continuacion/`; parches del trabajo en curso |

- Revisión adversarial de H-264…H-266 (flujo 01): 6 confirmados (C1–C6), 0 refutados, 18 sin verificar (U1–U18) → por motor en
  `continuacion/revision-h264-h266/`. Los «U» se verifican con la prueba primero: si la prueba no falla, se descartan con evidencia.
- Inventario de cruces en vivo (flujo 02): 42 confirmados, 46 no vivos → `continuacion/mapa-cruces-restantes.md` (hallazgos
  propuestos H-274, H-278–H-285, defectos X-1…X-4 y decisiones D1–D5).
- IDs de prueba: usada S.105. Reservadas: S.106–S.109 fuego, S.110–S.114 H-273, S.115–S.119 civil, S.126–S.129 H-274 (S.126–S.128
  en parche), S.130–S.137 soporte (S.130–S.131 en parches), S.138 en adelante para H-278+; libres después de S.155. Números H:
  H-210 cerrado; H-274 en curso; H-278–H-285 propuestos (comprobar con
  `grep -oh 'H-2[0-9][0-9]' CHANGELOG-motores.md pruebas.mjs | sort -u` antes de usar).

## 4. Decisiones del dueño vigentes
- Todos los motores independientes: cada disciplina calcula sólo con lo que se captura en su pestaña; lo de otra entra sólo
  como propuesta aceptada (instantánea) y ya aceptada no se mueve sola. Regla 1 (herencia) retirada; `HEREDA` vacío.
- Ventilación → carga térmica sólo por el ventilador seleccionado (HP × 745.7 W, misceláneos). Contra incendio, obra civil,
  soportería, selección y eléctrico autónomos. La carga de archivos alimenta la captura propia de cada disciplina.
- **Operación (27-sep-2026, tarde):** dos tareas en segundo plano a la vez, las más críticas; las menos críticas se pausan y
  quedan pendientes (H-273 quedó pausada). El dueño ajusta el número de tareas: manda su último mensaje. Mensajes cortos.
- **Velocidad: el dueño pidió subir 20 % y luego 35 % la velocidad del flujo de trabajo.** Medidas ya disponibles: bancos en
  paralelo (semáforo de 3), mutantes `--paralelo 3`, arnés jsdom de 3 s para experimentos (no correr el banco completo para
  explorar), worktrees preparados de antemano, flujos con `pipeline` (sin barreras) y revisores sólo al final. Al retomar:
  menos lectura previa y menos texto; corregir en cuanto la prueba falla; integrar y publicar cada hallazgo sin esperar lotes.
- Detener el turno con el botón mata los flujos en segundo plano.

## 5. Decisiones que el dueño debe tomar (cambian resultados)
- **Re-sello:** cuando sólo cambia la forma de una huella (sin cifras), ¿re-sellar al abrir si la huella vieja coincide (sigue
  «calculado»)? Afecta H-283–H-285, H-274 y los sellos de cotización, Kaizen y Valor (U11b). Relacionado: ¿quote v25
  «(dependencia)»? (pregunta anterior de sellos, H-267/H-268).
- **D1 sitio y diversidad:** ¿dato común de Proyecto con procedencia (no mueve cifras) o captura por pestaña (sin captura,
  pendiente)? ¿La diversidad (bldDiv) se muda a Selección?
- **D2 Kaizen y Valor:** ¿instantáneas aceptadas o excepción «lectores en vivo con permiso»? ¿Una sola disciplina de gestión?
- **D3 semillas sin fuente** (tarifa 2.85 MXN/kWh, 3500 h/año, cobre 1350 MXN/m, 30 m): ¿rotuladas «semilla sin fuente
  (migración)» con la misma cifra, o «pendiente»?
- **D4 difusores y lámina** en la cotización: «Por cotizar» hasta aceptar; ¿difusores de las bocas de ductos, de la carga (1 por
  400 CFM, como hoy) o capturados?
- **D5 kwTRde (X-3):** corregirlo hace aparecer el ahorro por kW en Valor (hoy siempre 0).
- Siguen abiertas: H-268 (migración parcial; permisos), H-272 (5 preguntas), H-270/H-271 (3), H-267 (4), H-269 (4), las 5 de
  H-134 (`PAUSA.md`), Estructural/Soportería, H-233. Detalle en la versión anterior de este archivo (`git show 63a2794:CONTINUACION.md`, §5).
- Mutantes rotos de antes de esta sesión: `elec.m139` («buscar» aparece 2 veces) y `vent.m10/m11/m18/m33` (H-273, en pausa).

## 6. Cola pendiente, en orden
1. Complementos: fuego (§2.2–2.3) → civil (§2.4) → soportería (§2.5) → textos y U6 (§2.7).
2. H-274 (§2.6).
3. H-281, H-283–H-285 (tras la decisión de re-sello), H-278 (D4), H-279/H-280 (D2, D3, D5), H-282 (D1), X-1…X-4.
4. H-273 mutantes de ventilación (PAUSADA; parche en `continuacion/parciales/H-273-vent-mutantes.patch`).
5. De la cola anterior: auditoría contra las reglas de la casa; entregables PDF/Excel verificados con Python; flujos de punta a
   punta en Chromium; recorrido visual claro/oscuro/celular; oráculo en Python; mutantes de civil y load (H-275, H-276); cascada
   de módulos; inventario de normas pendientes; lector de archivos con archivos reales (flujos 04–12 en `continuacion/flujos/`).
6. Después: renglón de catálogo como equipo seleccionado; H-134; Estructural/Soportería; bloques 5a–5e; quitar la pestaña
   «Cuartos limpios» (preguntar antes).

## 7. Pendientes del lado del dueño
- Hacer privado el repositorio y borrar el público creado por error (`-git-ls-remote-origin-head-Bash-completed-with-no-output-`).
- Textos de norma: SMACNA DCS, NFPA 13 T17.4.2.1(a), NFPA 96, Carrier Parte 1 Tabla 20A, ANSI Z358.1, AISC 360, CFE MDOC viento
  y sismo, NTC sismo.
- Opcional: planos DWG guardados como DXF para probar la carga con archivos reales.

## 8. Archivos de apoyo
- `continuacion/revision-h264-h266/{fuego,civil,soporte,textos,general}.md`: hallazgos con escenario, razón del refutador,
  corrección y prueba sugeridas (C = confirmado; U = sin verificar).
- `continuacion/mapa-cruces-restantes.md`: inventario de cruces en vivo sobre `63a2794` (líneas de ese commit).
- `continuacion/parciales/`: `H-266-complemento-C2.patch` (commit completo, `git am`), `H-266-complementos-en-curso.patch` (U5,
  `git apply` encima del anterior), `H-274-equip-en-curso.patch` (pruebas S.126–S.128 sobre `b186ac8`),
  `H-273-vent-mutantes.patch` (`vent.json`).
- `continuacion/flujos/`: 01 y 02 en la versión corrida hoy (leen un worktree de sólo lectura `/home/user/wt-lectura`), 03–12 de
  la cola, `13-h274-equip.js` y `14-h266-complementos.js` (esperan worktrees `/home/user/wt-h274` y `/home/user/wt-soporte`;
  recrearlos con `git worktree add -b <rama> /home/user/wt-x HEAD`, `ln -s <repo>/node_modules` y copiar el respaldo; poner el
  HEAD nuevo en el texto).
- `continuacion/turno.sh` (semáforo de bancos), `continuacion/arnes.mjs` (jsdom), `continuacion/integrar.sh <rama>` (fusiona sin
  fast-forward, corre bancos y regresión).
