/* pruebas-motores/aire.mjs · Fase 1 · casos calculados a mano del motor AIRE COMPRIMIDO (SuiteEmp rev 2.9.24)
   Hoja: parches/casos-a-mano/aire.csv · cálculo independiente: parches/casos-a-mano/aire.calc.mjs
   Compara NÚMEROS con tolerancia; nunca textos. Restaura S.aire y S.site en finally (el banco comparte S).
   Las filas «fase2:H-nnn» son el valor correcto por norma que hoy la suite NO da: sólo se exigen con CM_FASE2=1.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí sólo se marcan):
   - pruebas.mjs:6211 R.9 exige el aviso de error «clase 1.2.1 exige tubería de acero inoxidable»; el aire medicinal pide
     cobre ASTM B819 según NFPA 99 (AUDITORIA §3.10 y §4) → H-220.
   PRUEBAS QUE NO PRUEBAN EL MOTOR (se marcan, no se arreglan):
   - pruebas.mjs:511 6.6 llama buildMemoriaPdf (memoria HVAC) y su mensaje habla de «la memoria de aire»: no toca
     buildAirePdf ni un solo número del motor (AUDITORIA §4).
   - pruebas.mjs:6242 R.11 y 6281 R.12 arman un consumo a 7.7 bar con presionUso 6.0; el `bar` de cada consumo se lee y no
     se usa (H-219), así que el caso no ejerce la presión; prueban traducciones de partidas, no números.
   MUTANTES QUE SÓLO SE MATAN AFIRMANDO UN VALOR INCORRECTO (estado fase2 en parches/mutantes/aire.json): factor del
   tope de 5,000 L del tanque (H-216), curva de simultaneidad (H-217). Los del secador (m16/m31) pasaron a lógica vigente al
   cerrar H-215 (25-sep-2026). */
export default async function ({ t, G, S, CM }) {
  const filas = CM.casos("aire");
  const filasDe = (prefijo) => filas.filter((f) => f.id === prefijo || f.id.startsWith(prefijo + "."));
  const comprobar = (prefijo) => {
    const usadas = filasDe(prefijo);
    if (!usadas.length) throw new Error(`la hoja no trae filas ${prefijo}`);
    let exigidas = 0;
    usadas.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; CM.comprobar(f); exigidas++; });
    if (!exigidas && !CM.exigirFase2) throw new Error(`${prefijo}: ninguna fila vigente que comprobar`);
  };
  /* Cada caso arma SOLO S.aire (sobre defaultAire(), que trae fugas 10 % y reserva 20 %) y S.site = Tijuana (pAtm 99.548 kPa,
     que entra en el tanque y en la densidad de línea); el resto del estado del banco no interviene en computeAire. */
  const caso = (nombre, prefijo, armar) => t(nombre, () => {
    const guardado = JSON.stringify({ aire: S.aire, site: S.site });
    try {
      S.site = { key: "tijuana" };
      S.aire = { ...G("defaultAire")(), ...armar() };
      G("recompute")();
      const A = G("AIRE");
      if (!A || !(A.fadRequerido > 0)) throw new Error(`${prefijo}: el caso no aísla lo que se prueba (FAD ${A && A.fadRequerido})`);
      comprobar(prefijo);
    } finally {
      const g = JSON.parse(guardado); S.aire = g.aire; S.site = g.site; G("recompute")();
    }
  });
  const consumo = (nombre, tipo, cant, lmin, bar, uso, id) => ({ id, tipo, nombre, cant, lmin, bar, uso });
  const FIXTURE = () => [consumo("Sopleteo", "generico", 2, 400, 6, 0.5, "cm1a"), consumo("Actuadores", "generico", 4, 250, 6, 0.3, "cm1b")];

  caso("CM.aire.1 (ISO 1217:2009 §3.4.3; ISO 7183:2007 Tabla 2 A1; Atlas Copco receptor; criterio de la casa) fixture: 2×400 uso .5 + 4×250 uso .3 L/min, 6 bar, 2.4.2, aluminio 60 m, 35 °C",
    "CM.aire.1", () => ({ clase: "2.4.2", presionUso: 6, tempEntrada: 35, material: "aluminio", Lprincipal: 60, Lramales: 0, consumos: FIXTURE() }));
  caso("CM.aire.2 (ISO 8573-1:2010 clase 1.4.1; criterio de la casa) 12 instrumentos ×20 uso .8 + 3 pistolas ×180 uso .1, 6.5 bar, aluminio 100/40 m, 30 °C",
    "CM.aire.2", () => ({ clase: "1.4.1", presionUso: 6.5, tempEntrada: 30, material: "aluminio", Lprincipal: 100, Lramales: 40,
      consumos: [consumo("Instrumentos", "instrum", 12, 20, 5.5, 0.8, "cm2a"), consumo("Pistolas", "pistola", 3, 180, 6, 0.1, "cm2b")] }));
  caso("CM.aire.3 (ISO 8573-1:2010 clase 1.2.1; criterio de la casa: desecante con purga 15 %, exento de aceite) 10×300 uso .5, 6 bar, inox 304L 50/30 m",
    "CM.aire.3", () => ({ clase: "1.2.1", presionUso: 6, tempEntrada: 35, material: "inox_304", Lprincipal: 50, Lramales: 30,
      consumos: [consumo("Proceso", "generico", 10, 300, 6, 0.5, "cm3a")] }));
  caso("CM.aire.4 (ASTM B88 tipo L, DI real) cobre 55 m con los consumos del fixture: hoy 1\" con DI de cédula 40; con 26.04 mm reales pasa a 1¼\" (fase2:H-218)",
    "CM.aire.4", () => ({ clase: "2.4.2", presionUso: 6, tempEntrada: 35, material: "cobre", Lprincipal: 55, Lramales: 0, consumos: FIXTURE() }));
  caso("CM.aire.5 (Atlas Copco receptor) una línea de 9,000 L/min: tanque teórico 13,103 L; hoy se trunca a 5,000 sin aviso (fase2:H-216)",
    "CM.aire.5", () => ({ clase: "2.4.2", presionUso: 6, tempEntrada: 35, material: "aluminio", Lprincipal: 80, Lramales: 0,
      consumos: [consumo("Linea grande", "generico", 1, 9000, 6, 1, "cm5a")] }));
  caso("CM.aire.6 (criterio de la casa: curva > 40 puntos, compresor VSD) 50 puntos ×100 L/min uso .25, aluminio 30 m",
    "CM.aire.6", () => ({ clase: "2.4.2", presionUso: 6, tempEntrada: 35, material: "aluminio", Lprincipal: 30, Lramales: 0,
      consumos: [consumo("Puntos", "generico", 50, 100, 6, 0.25, "cm6a")] }));
  caso("CM.aire.7 (criterio de la casa: varias unidades y N+1) clase 1.2.1, una línea de 6,000 L/min con redundancia n1: 2 exentos + relevo",
    "CM.aire.7", () => ({ clase: "1.2.1", presionUso: 6, tempEntrada: 35, material: "inox_304", Lprincipal: 30, Lramales: 0, redundancia: "n1",
      consumos: [consumo("Linea", "generico", 1, 6000, 6, 1, "cm7a")] }));
  /* HALLAZGO NUEVO (sin número en AUDITORIA §3.10): con clase 2.4.2 y FAD 26,400 L/min ningún lubricado cubre y la suite toma el
     último de TODA la lista (cpo-55 exento 75 HP) porque el pool lubricado no se filtra (index.html:6905-6907). Las filas h, i, k
     van fase2:H-nuevo (100 HP / 13,162.5 / 13,103 L); nUnidades 3 y totalUnidades 4 coinciden hoy y se exigen. */
  caso("CM.aire.8 (criterio de la casa: pool lubricado) clase 2.4.2, una línea de 20,000 L/min con N+1: hoy elige cpo-55 exento 75 HP en vez de cp-75v 100 HP (fase2:H-nuevo)",
    "CM.aire.8", () => ({ clase: "2.4.2", presionUso: 6, tempEntrada: 35, material: "aluminio", Lprincipal: 30, Lramales: 0, redundancia: "n1",
      consumos: [consumo("Linea", "generico", 1, 20000, 6, 1, "cm8a")] }));
}
