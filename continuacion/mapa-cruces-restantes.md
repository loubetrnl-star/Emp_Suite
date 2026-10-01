# Mapa de cruces restantes (127ab3f, 29-sep-2026)

Sustituye al mapa de `63a2794` (en git: `git show 63a2794:continuacion/mapa-cruces-restantes.md`). Las líneas son de
`index.html` en `127ab3f` (H-309). Tarea 8 de `PROMPT-CODE-independencia-y-criticos.md`.

**Regla que se comprueba (decisión del dueño, 28-sep-2026):** entre las disciplinas load, clean, equip, duct, vent, elec,
hidro, fuego, aire, civil y soporte, ningún motor lee a otro en vivo (estado, resultados, funciones, tablas ni constantes), y
en `ENTRADAS` ninguna disciplina anida la de otra. Única excepción: load/clean/equip. Un dato de otra disciplina sólo entra
como propuesta aceptada (copia congelada con origen y fecha).

## Cómo se obtuvo y cómo se regenera

```
node continuacion/mapa-cruces.mjs [index.html] > salida.txt      # ≈ 8 s; Node 22 (con Node 24 sólo cambian ULP, no el mapa)
```

El guion corre tres pruebas independientes y no depende de ningún agente:

- **A. Escaneo estático.** Recorre cada función raíz de un motor y, en transitivo hasta profundidad 4, las funciones y
  ayudantes en flecha que llama. Busca lecturas de la variable global de resultado de otro motor (`SYS`, `DUCT`, `VENT`,
  `CLEAN`, `ELEC`, `HIDRO`, `FUEGO`, `AIRE`, `CIVIL`, `SOPORTE`, `QUOTE`, `KAIZEN`, `VALOR`, `LOADS`, `SITE`, `SITE_PROY`,
  `VALID`) y de `S.<clave de otro motor>`. Antes de buscar quita los comentarios y el texto de las cadenas, pero conserva lo
  que va dentro de `${…}`.
- **B. Prueba dinámica** (jsdom, proyectos fijos 1 y 2 de `parches/regresion-motores/`). Para cada disciplina d prueba dos
  cosas:
  - sustituye la captura de cada otro motor por la de un proyecto nuevo (`defaultState`);
  - concede un permiso ajeno (`load>quote`).

  En cada caso recalcula y compara `cifrasMotor(d)` y `huellaMotor(d)`. Así detecta también lo que llega por argumentos o
  por `recompute`.
- **C. ENTRADAS.** Lista, por llave, qué `ENTRADAS.<otro>` anida.

Controles positivos (copias en `x15/`, no versionadas): inyectar en `computeHidro` una lectura de `DUCT` y de `S.fuego`, o un
ayudante en flecha que lee `VENT`. El escaneo los marca como CRUCE.

## 1. Confirmación entre disciplinas

| Comprobación | Resultado | Confianza |
|---|---|---|
| A. Ningún `compute*` de disciplina lee la global o el estado de otra | **Confirmado.** Las 11 disciplinas salen «sin lecturas de otros motores», salvo aire → `SITE_PROY` (§2.1), que es dato de Proyecto | Alta: el escaneo lleva control positivo. Es heurístico, pero la prueba B lo respalda |
| B. Vaciar la captura de otro motor o conceder un permiso ajeno no mueve cifras ni sello de ninguna disciplina | **Confirmado** en los dos proyectos fijos. Sólo aire cambia su sello al vaciar `S.site` (Proyecto, §2.1) | Alta dentro de lo que ejercitan los proyectos fijos |
| C. En `ENTRADAS` (19715–19747) ninguna disciplina anida la de otra | **Confirmado.** Sólo anidan los congelados: quote (las 11), kaizen (load, duct, equip, quote, elec, hidro, fuego) y valor (equip, quote) | Alta: lectura directa del objeto, revisada a mano |
| Acoplamiento permitido load/clean/equip | No hay ni siquiera lecturas en vivo dentro del trío. `buildSystem` trabaja con `zonasSel()`, las zonas de selección capturadas o aceptadas (H-267) | Alta |

**Corregido en esta tarea:** H-309 (127ab3f). `ENTRADAS.elec` llevaba `ePerms()`, los permisos de todo el proyecto, y
conceder uno ajeno marcaba el sello del eléctrico «la captura cambió» con las cifras idénticas. Lo encontró la prueba B.

## 2. Lo que queda en disciplinas (no es cálculo cruzado; cada punto tiene su dueño)

1. **aire ← sitio de Proyecto (pendiente H-282, decisión D1).** Hay dos lecturas:
   - `computeAire` (7087) lee `SITE_PROY.pAtm` en vivo;
   - `ENTRADAS.aire` lleva `site: S.site`.

   No es otra disciplina: Proyecto no está en `MOTOR_VER`. Aun así, la regla D1 pide que aire capture su propia presión
   atmosférica o acepte la propuesta `proyecto>aire`. Sin ella, el tanque y la ΔP de la red quedan «pendiente».
2. **La huella de soportería del proyecto 1 no es determinista al abrir.** La migración de H-307 toma la instantánea con la
   hora de apertura (`S.soporte.snap.ts`), y un proyecto de formato anterior que no se guarda la retoma en cada apertura. Las
   cifras son idénticas y sólo cambia el sello. Es una observación, no una violación: ya guardado, el proyecto no vuelve a
   migrar. Si el dueño quiere que tampoco cambie el sello, basta con sacar `snap.ts` de `ENTRADAS.soporte` (renglón aparte).
3. **Migraciones de una sola vez dentro de `recompute`.** Leen otros motores, pero sólo al abrir un proyecto anterior o al
   pulsar un botón; desde ahí el dato es captura o copia propia y no se mueve solo.

   | Dónde | Qué toma | Llave de una vez |
   |---|---|---|
   | 11958–11963 | difusores de Ductos desde `totals().cfm` (H-300) | `S.duct.tomarDifusores` |
   | 11972–11974 | zonas de Selección desde la carga, vía `zonasPropuestasEquip` (load→equip, permitido) | `S.equip.tomarDeCarga` |
   | 12003–12005 | cargas eléctricas de otros motores, vía `propuestaElecFilas` y `cargasOtrosMotoresElec` (H-306) | `S.elec.tomarPropuesta` |
   | 12039 | instantánea de metros de soportería, vía `snapshotSoporte` (H-307) | `S.soporte.tomarInstantanea` |
   | 12057–12059 | bases de soportería, vía `equiposCotizados` y `AIRE.totalUnidades` | `S.soporte.tomarBases` |

## 3. Congelados: lo que quote, kaizen y valor todavía leen en vivo (SIN TOCAR; siguiente etapa, AUD-08/AUD-13)

Por orden del dueño (28-sep-2026) no se modifican. Aquí sólo se listan. El detalle por línea está en el apéndice (salida del
guion).

- **Cotización general** (`computeQuote`, 8813–8967). Resultados en vivo de las 10 disciplinas, cada uno con su `cot`:
  `SYS`, `DUCT`, `VENT`, `CLEAN`, `ELEC`, `HIDRO`, `FUEGO`, `AIRE`, `CIVIL` y `SOPORTE` (también `COT_MOT`, 8938). Lee
  además la carga, `LOADS` y `SITE`, vía `totals()` (TR del proyecto y m² con `load>quote`), y los permisos (`linkAllowed`).
  `ENTRADAS.quote` anida las 11 disciplinas.
- **Kaizen** (`computeKaizen` 17815–18112; `kaizenLazy` 17775–17796). Lee en vivo:
  - `SYS`, `LOADS`, `SITE`, `S.zones`, `S.sitioCarga`, `S.peakScan` y `S.forceTech`, vía `simZone > computeLoad`;
  - `DUCT` y `S.duct`, `ELEC` y `S.elec` (`Ltablero`), `HIDRO` y `S.hidro`, `FUEGO` y `S.fuego`, `S.soporte`;
  - `QUOTE` y `S.quote`, `VALID`, `S.equip` (`divSel`), `S.perms`, `S.vinculos` y `S.tab`.

  `ENTRADAS.kaizen` anida load, duct, equip, quote, elec, hidro y fuego.
- **Ingeniería de valor** (`computeIngValor` 20588–20748; `valorLazy` 20832–20843). Lee en vivo:
  - `SYS`, `S.sysForce` y `S.equip`;
  - `QUOTE` y `S.quote`, `KAIZEN`;
  - `SITE_PROY` y `S.site`;
  - `S.her`, `S.vinculos` y `S.perms` (vía `desviacionesVivas` y `linkAllowed`), y `S.tab`.

  `ENTRADAS.valor` anida equip y quote.
- Dependencias ya registradas en la bitácora para esa etapa:
  - los hilos «3F4H-220» por omisión (AUD-14);
  - el rótulo «IPC 2015 Tabla 604.3» del libro de la propuesta (AUD-15/16);
  - la marca SEMILLA por renglón de Selección, que exige capturar fuente en Selección y tocar `computeQuote` 8929 (H-304,
    tarea 7);
  - `alimM` 1,350 MXN/m y `Ltablero` 30 m sin fuente (AUD-13).

## 4. Límites del método (qué NO cubre este mapa)

- Sólo funciones de **cálculo** (`compute*` y lo que llaman) y la huella. No revisa las **vistas, PDF ni Excel**. Por ejemplo,
  `viewSeleccion` captura `quote.fx`, `quote.indirect` y otros campos de la Cotización en su tarjeta «Bases de precio», y
  Soportería cuenta partidas de la cotización en pantalla (pendiente 6 de `CONTINUACION.md`). Esos cruces de pantalla quedan
  para un barrido aparte.
- La prueba B cubre las ramas que ejercitan los dos proyectos fijos. Una lectura cruzada en una rama que ninguno recorre sólo
  la vería el escaneo A.
- El escaneo A es léxico: no ve un acceso indirecto (`window["SYS"]`, `COT_RESULTADO()[mot]`). Por eso la prueba B va aparte.
  `cotizacionDeMotor` usa `COT_RESULTADO`, pero sólo lee el `cot` de SU motor.

## Apéndice: salida de `node continuacion/mapa-cruces.mjs` en 127ab3f

Ver `continuacion/mapa-cruces-127ab3f.txt`.
