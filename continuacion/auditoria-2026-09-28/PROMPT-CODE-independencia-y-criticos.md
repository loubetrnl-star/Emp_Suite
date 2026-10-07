Auditoría externa de solo lectura sobre la rama claude/focused-euler-f9knvw (hasta 47e239c, H-308).
Veredicto: H-304 a H-308 pasan (independencia respetada, esperado y MOTOR_VER intactos, bancos coinciden).

REGLA QUE MANDA SOBRE TODO (decisión del dueño, vigente y sin excepciones nuevas):
Cada motor de cálculo es INDEPENDIENTE. Cada disciplina saca lo mismo —cálculo, memoria de cálculo (PDF),
cotización y Excel— por sí sola, con su propia captura y sus propios precios. Ningún motor lee a otro en vivo:
ni estado, ni resultados, ni funciones, ni tablas ni constantes. Un dato de otra disciplina sólo entra como
propuesta aceptada: copia congelada con origen y fecha; si la fuente cambia, el destino se marca
«desactualizado» y el usuario decide; nada se recalcula solo. Única excepción vigente: el acoplamiento
load/clean/equip en cargas. Selección de equipo sin ningún vínculo con Ductos, en ninguna dirección.
Si una tarea de abajo se puede resolver de dos formas, elige la que deje al motor más independiente.

CONGELADOS (decisión del dueño, 28-sep-2026): Kaizen, Ingeniería de valor y Cotización general (computeQuote,
QUOTE, kaizen, valor, sus pestañas, PDF, Excel y MOTOR_VER) NO SE TOCAN hasta que terminen todas las demás
disciplinas. Ninguna tarea de abajo los modifica. Si una tarea obliga a tocarlos, se detiene ahí, se registra
como dependencia en la bitácora y se sigue con la siguiente. La cotización propia de cada disciplina
(H-293 a H-304, X.cot) sí es de su motor y sí se trabaja.

Reglas de trabajo: CLAUDE.md (prueba primero con el ID, un commit por tarea, MOTOR_VER + MOTOR_CAMBIOS +
CHANGELOG + esperado si mueve números, nada se estima, nada de memoria, espejo L(es,en)). No toques
Estructural ni H-134. Al terminar cada tarea: renglón en bitacora.md con commit, prueba, bancos y
«Números: idénticos / movidos (motor v→v)». Haz lo que haga falta para cerrarlas; no pidas permiso salvo
en lo marcado [DECISIÓN DEL DUEÑO].

Orden: la 1 primero (protege todo lo demás), luego el resto.

1. AUD-12 · regresión · segundo proyecto fijo.
   Desde H-262 se retiraron herencias y cruces y subieron load 5→7, equip 1→4, vent 3→4, elec 8→9,
   fuego 3→6, civil 5→8, soporte 11→13, pero el esperado sólo cambió de versión: el proyecto fijo no
   ejercita las ramas nuevas. Arma un segundo proyecto fijo capturado DISCIPLINA POR DISCIPLINA en su propia
   pestaña (ninguna se genera a partir de otra) con: motor con MCA/MOP, aluminio, protección > 300 A, sin
   distancia ni transformador; factor de edificio ≠ 1; ΔP negativa y < 5 Pa; ducto de grasa; ventilador sin
   cobertura; regadera de emergencia; CPVC fuera de catálogo; varios tanques; cobre en aire; soportería con
   instantánea aceptada y a mano. En elec agrega a las cifras vigiladas tierra, caída de tensión, Icc y kAIC.
   Las cifras de quote, kaizen y valor de este proyecto se fijan tal cual salen hoy (sólo se vigilan, no se
   corrigen). Sin esto, cualquier H que sigas cerrando puede mover números sin que R.1 lo vea.

2. AUD-03 · aire · computeAire lee TUB_AGUA.cobre.d (tabla de hidro). Tabla propia de DI de cobre tipo L en
   aire con su cita; prueba que la fije dentro de aire. Revisa que ningún otro motor de disciplina use
   constantes, tablas o funciones de otro (p. ej. hazen() de hidro usada por fuego): cada uno con su copia.

3. AUD-14 · valores por omisión inventados (dejar «pendiente» con aviso, nunca calcular con ellos):
   hidro num(H.alturaEdificio, 6) y num(H.presRed, 25); elec selConductor num(o.L, 20) y fp 0.9; soporte
   material «acero» sin captura; aire material desconocido → «aluminio» y DI de cédula 40 «indicativo» para
   aluminio e inoxidable; elec MOP estimada 0.85·FLA/125 %/175 % que fija la protección. (Los hilos
   «3F4H-220» de la cotización general quedan congelados: sólo registrar.)

4. AUD-18 · hidro · pendMin704 usa ⅛ in/ft = 1.0417 %, pero sizeDrenaje elige la columna ¼ in/ft con
   pend >= 2 y ¼ in/ft = 2.083 %. Umbral 2.0833 % y ajustar CM.hidro.9.x/9.y; verificar contra IPC T710.1(1).

5. AUD-15/16 · hidro · sin presRed capturada la bomba se declara «no alcanza» en la cotización propia de
   hidro: debe decir «dato pendiente»; quitar o justificar la cita NFPA 20 de esa partida. rigeNorma rotula
   «IPC 2015 T604.3» a la regadera de emergencia (21 m) y a la tarja de laboratorio, que no están en la
   tabla: rotular por fila según presFuente en memoria, PDF y Excel de hidro.

6. Migraciones H-306 y H-307 · al abrir un proyecto anterior, las cargas eléctricas y la instantánea de
   soportería que se pasan solas quedan estado: "aceptado" (l.11949 y l.11966). Usar la marca de H-266
   «de la migración, sin confirmar»; en H-306 registrar además el origen de cada renglón (equip, aire,
   hidro, fuego, clean), no sólo «Selección».

7. H-304 · a verificar · cotizacionDeMotor (cotización propia de cada disciplina) marca «SEMILLA · SIN
   FUENTE» todos los renglones de Selección (semilla: true en lines), aunque desde H-301 sus precios se
   capturan con fuente. Si el precio trae fuente, la marca es falsa: marcar sólo los que no la traen.

8. Cierre · mapa de cruces. Al terminar, regenera continuacion/mapa-cruces-restantes.md y confirma en la
   bitácora que, entre las disciplinas (load, clean, equip, duct, vent, elec, hidro, fuego, aire, civil,
   soporte), en ENTRADAS ninguna anida ENTRADAS de otra y ningún compute* lee la variable global de otra
   (salvo load/clean/equip). Lista aparte, sin tocar, lo que quote, kaizen y valor todavía leen en vivo:
   es la siguiente etapa, cuando el dueño la abra.

PENDIENTE PARA DESPUÉS (no ahora): AUD-08 y AUD-13 — independencia de quote, kaizen y valor (recibir las
partidas de cada disciplina sólo como propuesta aceptada; alimM 1,350 MXN/m y Ltablero 30 m sin fuente).
