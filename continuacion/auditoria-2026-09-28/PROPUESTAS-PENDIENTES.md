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
