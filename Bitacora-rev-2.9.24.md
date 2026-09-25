# Bitácora rev 2.9.24 · corrección de los críticos de la auditoría (22 al 25-sep-2026)

Plan: PLAN-CRITICOS.md (aprobado por el dueño el 22-sep-2026, decisiones en su §4). Resultado hallazgo por hallazgo:
**REPORTE-CRITICOS.md**. Reglas de trabajo: CLAUDE.md.

## Qué se hizo
1. **Fase 0** (no mueve números): versión de carga declarada (H-107), USD sólo con tipo de cambio fechado (H-250),
   California como estado (H-251), CLAUDE.md y `parches/normas-texto/`.
2. **Fase 1** (vigilar números antes de tocar lógica): casos calculados a mano por motor, cada uno con su hoja en
   `parches/casos-a-mano/` y su cálculo independiente (no carga la suite). Módulos `pruebas-motores/`. Compuerta de
   mutantes `parches/mutantes/`. Motores: vent, elec, fuego, aire, soporte, load, hidro y duct.
3. **Fase 2** (críticos que mueven números): un commit por hallazgo, con la prueba primero y el ID en su nombre.
   Cuando el cambio mueve números sube `MOTOR_VER` y se regenera el esperado. 43 cerrados; H-224 en su parte no
   bloqueada. Bloqueados por texto de norma: H-168 y H-227 (SMACNA) y el claro de CPVC de incendio (NFPA 13).
4. **Cierre**: comparador de 15 motores contra `af5894f`
   (`parches/comparador-15-motores/informe-2.9.24-vs-af5894f.txt`). Este reporte, tag nuevo e instalador.

## Decisiones del dueño aplicadas (PLAN-CRITICOS.md §4)
- H-141 (a): diversidad del edificio sólo en el bloque de planta.
- H-178: hp de placa manda; con kW, hp normalizado inmediato superior.
- H-217 (a): curva de simultaneidad como criterio de la casa.
- H-229/H-239: MSS SP-58-2018 e IPC 2009 T308.5, secundarias.
- H-244 (a): lo capturado manda y 3:2 «estimado».
- H-252 (a): «SEMILLA · SIN FUENTE» y la formal bloqueada.
- H-165 (b): UMC 2018 §510.5 citado de up.codes; extrae NFPA 96 §7.5 y queda por ratificar con NFPA 96.

## Textos de norma que se agregaron a `parches/normas-texto/`
UMC 2018 §510.5 (ducto de grasa, up.codes, Nevada Mechanical Code 2018), además de los que ya estaban (ver su README).
NOM-001-SEDE-2012 250-122(f) (tierra por canalización en paralelo, p. 150) ya estaba en el texto completo del DOF.

## Para la próxima revisión
- El dueño pasa, cuando los tenga, los textos de SMACNA DCS, NFPA 13, NFPA 96, Carrier Tabla 20A y ANSI Z358.1.
- H-233 (no está en el plan) lo decide el dueño.
- Dependencias registradas: Kaizen estima el cobre del alimentador con 1,350 MXN/m y 30 m. Eléctrico lista «Bomba de
  agua» aunque la presión alcance.
- La pantalla de Ventilación sin modelo que cubra (`viewVent`, `R.demand`) se corrige en una tarea aparte.
