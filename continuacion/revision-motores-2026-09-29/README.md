# Revisión por motor · 29-sep-2026

Reportes de los analistas de sólo lectura (Sonnet). Formato fijo: **hallazgo | archivo | línea | propuesta**. Cada hallazgo empieza
con su tipo:

- **[ACOPLE]**: dependencia con otro motor.
- **[NORMA]**: norma y edición que aplica el cálculo, y si su texto está en `parches/normas-texto/`.
- **[CASO]**: caso de resultado conocido, con esperado contra obtenido.
- **[PROPÓSITO]**: cálculo que no corresponde a lo que el motor debe resolver.

Ningún hallazgo se aplicó: el dueño los analiza por fuera.

**Base de las líneas:** los números de línea son los de la copia congelada de `index.html` del commit `6e534ba` (anterior a
H-293…H-303). Para ubicarlos en el código actual, usar `git show 6e534ba:index.html`.

| Archivo | Motor |
|---|---|
| `elec.md` | Eléctrico |
| `hidro.md` | Hidrosanitario |
| `duct.md` | Ductos |

**Sin reporte de HVAC (Carga térmica, Cuartos limpios y Selección de equipo), Ventilación ni Contra incendio:** sus tres analistas
se interrumpieron (01:02 y 01:24 UTC del 29-sep-2026) antes de entregar; sus transcripciones no traen ningún hallazgo (sólo «Empiezo
explorando la carpeta»). No se relanzaron, por instrucción del dueño (no lanzar más subagentes).

Sin reporte todavía: Aire comprimido, Obra civil, Soportería/Estructural, Cotización, Valor y Kaizen. No se lanzaron analistas
para ellos, por instrucción del dueño.
