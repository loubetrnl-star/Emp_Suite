# Propuestas y decisiones pendientes del dueño · cierre de la auditoría del 28-sep-2026

Lo que una tarea AUD no pudo aplicar porque mueve un número, exige regenerar un esperado o subir `MOTOR_VER`,
toca código congelado o pide una decisión del dueño. Nada de esto está aplicado. Cada renglón dice qué número se
mueve, cuánto y bajo qué norma o criterio, y la prueba que lo fijaría.

## AUD-24 · hidro

### 24.2 · `muebleDe` con un id desconocido cuenta un WC con fluxómetro (PROPUESTA · mueve números)
- Hoy: `const muebleDe = (id) => MUEBLES.find((m) => m.id === id) || MUEBLES[0];` (`index.html`, función de hidráulica).
  Un mueble con id que ya no existe (proyecto viejo, archivo editado a mano) se calcula como `wc_flux`.
- Propuesta: un id desconocido no se supone: el renglón queda fuera del cálculo con aviso de error «mueble desconocido
  «<id>»: pendiente de captura» (regla 6 de `CLAUDE.md`, «nada se estima»; criterio de la casa, no hay norma).
- Qué se mueve: sólo en proyectos con ids desconocidos. Por cada uno, las unidades mueble bajan en las que la suite
  asigna a un WC con fluxómetro (10 en uso público, 6 en privado; tabla `MUEBLES`) y la presión mínima de 24.6 m (35 psi,
  IPC 2015 Tabla 604.3) deja de regir si sólo él
  la imponía; cambian gasto probable, diámetros, carga dinámica y bomba de esos proyectos. `MOTOR_VER.hidro` 10 → 11.
- Prueba que lo fijaría: proyecto con `{ id: "no-existe", cant: 1 }` y un lavabo; esperar `umTotal` del lavabo solo y
  un aviso `err` con «mueble desconocido».

### 24.3 · el id `lavaojos` cambió de significado sin migración (DECISIÓN DEL DUEÑO)
- Antes de H-195 (hidro v6): `lavaojos` era «Lavaojos / regadera de emergencia», 6 unidades mueble dentro de Hunter.
  Hoy es «Regadera de emergencia (con o sin lavaojos)», 20 gpm fijos fuera de Hunter; el lavaojos fijo es `lavaojos_solo`.
- Un proyecto anterior con `lavaojos` abre calculando una regadera de 20 gpm por pieza. Opciones:
  a) dejarlo así y marcar esas piezas «de la migración, sin confirmar» hasta que el usuario diga si son regadera o lavaojos
     (no mueve números; precedente H-306);
  b) migrarlas a `lavaojos_solo` (0.4 gpm) — mueve números: baja el gasto de emergencia 19.6 gpm por pieza;
  c) no hacer nada.

## AUD-14 · valores por omisión que quedan (PROPUESTAS · mueven números salvo donde se dice)
- **elec · hilos por omisión** (`cotizacionElec`, `index.html`: `String((E && E.sistema) || "3F4H-220")`, y `sistemaDe` que cae a
  3F4H-220 con una clave desconocida). En la pantalla el sistema siempre se captura con su selector (`defaultElec` nace en
  3F4H-220, visible), así que sólo actúa con un sistema vacío o inválido. Propuesta: sin sistema, «pendiente de sistema» en
  la cotización eléctrica y en el cálculo. Se mueve: conductores por fase y neutro (cantidades y costo de cable) sólo en esos
  proyectos; `MOTOR_VER.elec` 10 → 11. Criterio: regla 6 de `CLAUDE.md` (nada se estima).
- **aire · material por omisión** (`defaultAire().material = "aluminio"`, `index.html:7012`): un proyecto nuevo nace con la red
  en aluminio, que desde AUD-14 queda pendiente del DI del fabricante. Propuesta: nacer sin material (pendiente de material).
  No mueve cifras de proyectos guardados; cambia lo que muestra un proyecto nuevo. `MOTOR_VER.aire` sin cambio si sólo
  cambia el estado inicial (decisión del dueño).
- **aire · longitudes por omisión** (`index.html:7216`: `num(A.Lprincipal, 120)` y `num(A.Lramales, 90)`): con el campo
  vacío o nulo se suponen 120 m y 90 m. Propuesta: «pendiente de longitud» (regla 6). Se mueve: caída de presión, diámetros y
  metros cotizados de esos proyectos; `MOTOR_VER.aire` 6 → 7.
- **soporte · familia por omisión** (`computeSoporte` y `snapshotSoporte`: lo que no es cobre se soporta como acero en aire;
  `FU.tub || "acero_neg"` en contra incendio; `famSoporteAgua` cae a cobre). Propuesta: material no capturado = pendiente de
  material, como ya hace la tubería a mano desde AUD-14. Se mueve: espaciamiento y número de soportes de esos tramos;
  `MOTOR_VER.soporte` 14 → 15. Norma: la tabla de espaciamiento que ya usa soportería para cada familia.
- **quote · libro de la propuesta** (`buildPropuestaXlsx`, hoja MEMORIA_ELECTRICA): dice «de placa» para un MCA estimado porque
  `mcaEst` quedó en false desde AUD-14. DEPENDENCIA: es Cotización general (congelada); no mueve números.
