/* CM.load · casos calculados a mano del motor de CARGA TÉRMICA (Fase 1, rev 2.9.24).
   Hoja: parches/casos-a-mano/load.csv · cálculo independiente: parches/casos-a-mano/load.calc.mjs (no carga index.html).
   Compara NÚMEROS con tolerancia; las filas «fase2:H-nnn» sólo se exigen con CM_FASE2=1. Restaura S en finally.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí no se tocan):
   - pruebas.mjs:5898 R.1 (golden por motor): el esperado de load (parches/regresion-motores/regresion-motores.esperado.json,
     grand 54,057.49 W, 15.3703 TR, 16,040.63 CFM y las cuatro zonas) incluye particiones y piso que nadie capturó (H-121;
     las zonas Limpio y Laboratorio no tienen cubierta, así que llevan también «piso sobre no acondicionado»), el piso de
     ΔW 0.5 g/kg en el caso de enfriamiento (H-123) y el DET sin corrección por sitio (H-120, +0.31 K en Tijuana). Al cerrar
     cada hallazgo: MOTOR_VER.load sube, se regenera el esperado y las filas CM.load.9.* se recalculan con load.calc.mjs.
   - pruebas.mjs:5039 S.20 fija con eq() exacto tons 12.904762 y cfm 5790.236072 (MOVIDOS_2916, línea 5062) del proyecto
     de formato 1 (Tijuana; zonas con cubierta, así que lleva particiones H-121 pero no piso; ΔW 0.5 H-123 en aire exterior
     e infiltración; DET sin corrección H-120). Además ese respaldo declara los muros poniente con la llave «O» (30 y 10 m²)
     y la suite los descarta en silencio al abrirlo (hallazgo nuevo N-load-1, ver load.pendientes.md): el número
     consagrado es el de una nave SIN muro poniente.
   - pruebas.mjs:568 8.1 (sólo con --base) exige la misma carga que la revisión base 2.9.21 para el proyecto de prueba
     (zonas sin cubierta → particiones + piso H-121; Tijuana → ΔW 0.5 H-123): cualquier cierre de H-120/H-121/H-123 lo
     tumba; en la Fase 2 debe pasar a «cambió con versión subida» como R.3.
   - Ninguna prueba del banco afirmaba un número de carga térmica fuera de R.1/S.20/8.1 (grep LOADS/totals en pruebas.mjs):
     sólo relaciones (16.6, 16.7, Q.6) o rangos (S.37). Q.6 (4387) promete revisar la cubierta pero arma roof 0 y la
     comprobación se salta en silencio (AUDITORIA §4, «prometen más de lo que revisan»). */
export default async function ({ t, G, S, CM, REG_PROY }) {
  const filas = CM.casos("load");
  const vistas = new Set();
  const filasDe = (n, letras) => filas.filter((f) => (f.id === `CM.load.${n}` || f.id.startsWith(`CM.load.${n}.`)) && (!letras || letras.includes(f.id.split(".")[3])));
  const comprobar = (n, letras) => {
    const fs = filasDe(n, letras);
    if (!fs.length) throw new Error(`sin filas CM.load.${n}${letras ? "." + letras.join("/") : ""} en la hoja`);
    fs.forEach((f) => vistas.add(f.id));
    const errores = [];
    fs.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; try { CM.comprobar(f); } catch (e) { errores.push(e.message); } });
    if (errores.length) throw new Error(errores.join("\n   "));
  };
  const cero = { N: 0, NE: 0, E: 0, SE: 0, S: 0, SW: 0, W: 0, NW: 0 };
  /* Proyecto limpio (defaultState), sitio, barrido, diversidad y UNA zona sobre defaultZone con muros/vidrio completos. */
  const zona = (site, campos, { barrido = false, bldDiv = 1 } = {}) => () => {
    const s = G("S");
    s.site = { key: site }; s.peakScan = barrido; s.bldDiv = bldDiv;
    const z = { ...G("defaultZone")("Caso a mano"), ...campos };
    z.walls = { ...cero, ...(campos.walls || {}) }; z.glass = { ...cero, ...(campos.glass || {}) };
    s.zones = [z]; s.zi = 0;
  };
  const fijo = () => { G("importarRespaldo")(REG_PROY); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; };
  /* pasos: [[letras|null, armar], …] · cada paso arma su estado desde cero, recalcula y comprueba sus filas. Un paso que
     falla no impide correr los siguientes (así CM.load.0 sólo se queja de filas de verdad huérfanas). */
  const caso = (n, titulo, pasos) => t(`CM.load.${n} ${titulo}`, () => {
    const guardado = JSON.stringify(S), errores = [];
    try {
      for (const [letras, armar] of pasos) {
        try {
          G("reemplazarEstado")(G("defaultState")());
          armar();
          G("recompute")();
          comprobar(n, letras);
        } catch (e) { filasDe(n, letras).forEach((f) => vistas.add(f.id)); errores.push(e.message); }
      }
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
    if (errores.length) throw new Error(errores.join("\n   "));
  });
  const OFICINA = { spaceType: "office", area: 100, height: 3, occ: 10, lights: 1000, equip: 500, ach: 0, roof: 0 };
  const ENV = { spaceType: "office", area: 300, height: 3, occ: 0, lights: 0, equip: 0, ach: 0, roof: 100, walls: { N: 100, W: 100 }, glass: { W: 10 } };

  caso(1, "(ASHRAE Fundamentals 2017 cap. 1 vía PsychroLib; 62.1-2016 Tabla 6.2.2.1; criterio de la casa) oficina 100 m² / 10 pers / 1 kW luz / 0.5 kW equipo, Tijuana 16 h; H-121 particiones y piso, H-123 piso ΔW", [
    [null, zona("tijuana", OFICINA)],
  ]);
  caso(2, "(criterio de la casa DET/SOLAR/SHGC; H-120 corrección CLTD ASHRAE 1997, secundaria, vigente desde load v4) envolvente N/W/cubierta/vidrio W en Tijuana a las 16 h", [
    [null, zona("tijuana", ENV)],
  ]);
  caso(3, "(H-120 ASHRAE 1997 CLTD, secundaria) la misma envolvente en Mexicali: el DET opaco se corrige por sitio (+9.0 K)", [
    [null, zona("mexicali", ENV)],
  ]);
  caso(4, "(criterio de la casa SUN_H/DET_PEAK/DRANGE_H, H-122) barrido 8–18 h de una fachada oriente", [
    [null, zona("tijuana", { spaceType: "office", area: 100, height: 3, occ: 0, lights: 0, equip: 0, ach: 0, roof: 0, walls: { E: 50 }, glass: { E: 10 } }, { barrido: true })],
  ]);
  caso(5, "(decisión del dueño §4.1, H-141, cerrado 25-sep-2026) diversidad del edificio 0.8: sólo en la planta; la zona va al pico", [
    [null, zona("tijuana", OFICINA, { bldDiv: 0.8 })],
  ]);
  caso(6, "(ASHRAE 62.1-2016 Tabla 6.2.2.1; Tab.45 de la casa; H-157) aire exterior: aula, producción, oficina vacía y almacén", [
    [["a"], zona("tijuana", { spaceType: "classroom", area: 100, height: 3, occ: 10, ach: 0 })],
    [["b"], zona("tijuana", { spaceType: "production", area: 400, height: 6, occ: 30, ach: 0 })],
    [["c"], zona("tijuana", { spaceType: "office", area: 100, height: 3, occ: 0, ach: 0 })],
    [["d", "e"], zona("tijuana", { spaceType: "warehouse", area: 200, height: 6, occ: 12, ach: 0 })],
  ]);
  caso(7, "(criterio de la casa 0.34/0.83; H-123) infiltración 0.5 cambios/h en oficina vacía, Tijuana 16 h", [
    [null, zona("tijuana", { spaceType: "office", area: 100, height: 3, occ: 0, lights: 0, equip: 0, ach: 0.5, roof: 0 })],
  ]);
  caso(8, "(criterio de la casa, pisos del serpentín 1.7/4.4 °C) Mexicali, 80 personas en 100 m²: ADP resuelto 2.59 °C se limita a 4.4", [
    [null, zona("mexicali", { spaceType: "office", area: 100, height: 3, occ: 80, lights: 0, equip: 0, ach: 0, roof: 0 })],
  ]);
  caso(9, "(criterio de la casa; dos casos ASHRAE 2021 por decisión del dueño) proyecto fijo de regresión: totales, zonas, laboratorio HR y cuarto limpio", [
    [null, fijo],
  ]);
  caso(10, "(criterio de la casa: balastro ×1.2, estratificación H-57, almacenamiento de 12 h) iluminación fluorescente, locales de 4.5 m y operación de 12 h", [
    [["a"], zona("tijuana", { spaceType: "office", area: 100, height: 3, occ: 0, lights: 1000, equip: 0, ach: 0, roof: 0, lightType: "fluorescent" })],
    [["b"], zona("tijuana", { spaceType: "office", area: 100, height: 4.5, occ: 0, lights: 1000, equip: 0, ach: 0, roof: 0, plenum: false })],
    [["c"], zona("tijuana", { spaceType: "office", area: 100, height: 4.5, occ: 0, lights: 1000, equip: 0, ach: 0, roof: 0, plenum: true })],
    [["d", "e"], zona("tijuana", { spaceType: "office", area: 100, height: 3, occ: 0, lights: 1000, equip: 500, ach: 0, roof: 0, runHours: 12 })],
  ]);
  caso(11, "(criterio de la casa) aire exterior impuesto y por fracción del suministro; oscilación de temperatura en la insolación", [
    [["a"], zona("tijuana", { ...OFICINA, oaFixed: 1000 })],
    [["b"], zona("tijuana", { ...OFICINA, oaFraction: 1 })],
    [["c"], zona("tijuana", { ...ENV, swing: 2 })],
  ]);

  t("CM.load.0 toda fila de la hoja load.csv tiene una prueba que la arma (ninguna queda huérfana)", () => {
    const huerfanas = filas.map((f) => f.id).filter((id) => !vistas.has(id));
    if (huerfanas.length) throw new Error(`filas sin prueba: ${huerfanas.join(", ")}`);
    const ids = filas.map((f) => f.id);
    if (new Set(ids).size !== ids.length) throw new Error("ids repetidos en la hoja");
  });
}
