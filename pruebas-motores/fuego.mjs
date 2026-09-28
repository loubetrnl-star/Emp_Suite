/* CM.fuego · casos calculados a mano del motor CONTRA INCENDIO (Fase 1, rev 2.9.24).
   Hoja: parches/casos-a-mano/fuego.csv · cálculo independiente: parches/casos-a-mano/fuego.calc.mjs (unidades US de
   NFPA 13/20 con conversión declarada, y aritmética SI declarada donde la suite redondea sus constantes).
   Cada prueba arma el estado del caso, evalúa las filas de su hoja (números con tolerancia) y restaura S en finally.
   Las filas «fase2:H-nnn» (valor correcto por norma que hoy la suite NO da) sólo se exigen con CM_FASE2=1.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí sólo se marcan):
   - pruebas.mjs:357-361 «3.2» (auditoría: 358) fija S.fuego.altura = 5.4 m, el PROMEDIO ponderado de las zonas
     (2700/500); la estática debe ir al rociador más alto (6 m) → H-205.
   - pruebas.mjs:3203 (auditoría: 3201) `eq(F.qBomba, 2500, "ord2 bomba nominal:")` consagra una bomba de 2,500 L/min
     (661 gpm) que no es capacidad nominal de NFPA 20 Tabla 4.9 (la de norma es 750 gpm = 2,839 L/min) → H-208.
   - pruebas.mjs:3209 (auditoría: 3207) `cerca(F.qTotal, 5161.98, 0.01)` es un dorado sacado de la suite: consagra el
     1.15 de sobredescarga y la manguera sumada sin declararlos (5,157.6 L/min en unidades de norma) → H-213.
   - pruebas.mjs:3211 «22.7» (auditoría: 3209) `eq(F.hpBomba, Math.ceil(9.81 * (5000/60/1000) * F.presBomba / .65 / .746 / 5) * 5)`
     es tautológica: repite la fórmula del código (η 0.65 sin fuente y redondeo a 5 HP, que no es tamaño NEMA) → H-209.
   - pruebas.mjs:5592 «S.32» (auditoría: 5586) `eq(F.areaDis, F.r.areaMin)` compara la suite consigo misma y consagra el
     piso de 139 m² sobre 50 m² protegidos: 12 rociadores «en diseño» contra 5 instalados → H-213.
   Detalle y lo no cubierto: parches/casos-a-mano/fuego.pendientes.md */
export default async function ({ t, G, S, REG_PROY, CM }) {
  const filas = CM.casos("fuego");
  const de = (pref) => filas.filter((f) => f.id.startsWith(pref + "."));
  const comprobar = (pref) => {
    const fs = de(pref);
    if (!fs.length) throw new Error(`la hoja no trae filas ${pref}.*`);
    let n = 0;
    fs.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; CM.comprobar(f); n++; });
    if (!n) throw new Error(`${pref}: ninguna fila exigible`);
  };
  /* Cada caso: guarda S, arma, comprueba, restaura (el banco comparte S). */
  const caso = (nombre, pref, armar) => t(nombre, () => {
    const guardado = JSON.stringify(S);
    try { armar(); comprobar(pref); }
    finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });
  const permisos = () => G('Object.keys(LINKS).forEach((k) => { S.perms[k] = { ts: 1, via: "casos a mano" }; })');
  const zona = (nombre, area, height) => ({ ...G("defaultZone")(nombre), area, height });
  /* Proyecto limpio con nombre (para que el semáforo tenga proyecto), zonas dadas (H-264: contra incendio ya no hereda de
     ellas; el área y la altura van en la captura), captura de fuego sobre defaultFuego() y todos los cruces autorizados. */
  const armar = (zonas, fuego) => {
    G("reemplazarEstado")(G("defaultState")());
    S.meta.name = "Casos a mano · contra incendio";
    S.zones = zonas;
    S.fuego = { ...G("defaultFuego")(), ...fuego };
    permisos();
    G("recompute")();
  };

  caso("CM.fuego.1 (NFPA 13-2016 Tabla 19.3.3.1.1 curva densidad-área y Tabla 10.2.4.2.1; criterio de la casa 1.15/30 %/+1 m; H-205) proyecto de regresión: ordinario 2, 700 m² y 6 m (MÁXIMA) HEREDADOS de 4 zonas, 30+12 m, K80, cisterna", "CM.fuego.1", () => {
    /* El mismo arranque que R.1. H-264: contra incendio ya no hereda. El fixture guarda, como lo dejó e0e1cf4, 700 m² y la altura
       heredada vieja (4.71 m, el promedio) con su registro her.*: al abrirlo, la migración del complemento de H-264 (fuego v6) le da
       lo que la herencia le daba (suma de zonas y, desde H-205, la altura máxima: 6 m), marcado «sin confirmar». */
    G("importarRespaldo")(REG_PROY); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
    if (!(S.fuego.area === 700 && S.fuego.altura === 6)) throw new Error(`el fixture no trae 700 m² / 6 m capturados (H-205, H-264): ${S.fuego.area} / ${S.fuego.altura}`);
  });
  caso("CM.fuego.2 (NFPA 13-2016; H-205, H-264) nave con almacén de 13 m: 2200 m² y altura al rociador más alto 13 m capturados (no el promedio 3.91 de las zonas 2000 m²/3 m + 200 m²/13 m), ordinario 2, 30+12 m", "CM.fuego.2", () => {
    armar([zona("Oficinas", 2000, 3), zona("Almacén", 200, 13)], { riesgo: "ord2", area: 2200, altura: 13, Lramal: 30, Lmontante: 12 });
    if (!(S.fuego.area === 2200 && S.fuego.altura === 13)) throw new Error(`no quedó la captura 2200 m² / 13 m (H-205, H-264): ${S.fuego.area} / ${S.fuego.altura}`);
  });
  caso("CM.fuego.3 (NFPA 13-2016 riesgo ligero; NFPA 20-2016 Tabla 4.9; H-208, H-211) 300 m², 3.5 m, 20+6 m, K80, red municipal de 35 mca que no alcanza", "CM.fuego.3", () => {
    armar([], { riesgo: "ligero", area: 300, altura: 3.5, Lramal: 20, Lmontante: 6, fuente: "municipal", presFuente: 35 });
  });
  caso("CM.fuego.4 (NFPA 13-2016 §23.4.4.7 presión mínima de descarga) riesgo ligero con K160: rige el mínimo de 0.5 bar y el rociador descarga más de lo pedido", "CM.fuego.4", () => {
    armar([], { riesgo: "ligero", area: 300, altura: 3.5, Lramal: 20, Lmontante: 6, rociador: "k160" });
  });
  caso("CM.fuego.5 (NFPA 13-2016 riesgo extra 1; NFPA 20-2016 Tabla 4.9; H-207, H-208) 1,000 m², 8 m, 40+15 m: la lista de bombas de la suite no cubre 5,162 L/min", "CM.fuego.5", () => {
    armar([], { riesgo: "extra1", area: 1000, altura: 8, Lramal: 40, Lmontante: 15 });
  });
  caso("CM.fuego.6 (H-210) arranque en ceros: 600 m² capturados con altura, cabezal y montante en 0; hoy 16.3 m y 15 HP sin aviso", "CM.fuego.6", () => {
    armar([], { riesgo: "ord2", area: 600 });
  });
  caso("CM.fuego.7 (NFPA 13-2016 curva densidad-área, piso del área de operación) ordinario 2 con 50 m² protegidos: 139 m² de operación, 12 en diseño contra 5 instalados", "CM.fuego.7", () => {
    armar([], { riesgo: "ord2", area: 50, altura: 4, Lramal: 10, Lmontante: 5 });
  });
  caso("CM.fuego.8 (NFPA 13-2016 curva densidad-área, tope del área de operación) ordinario 2 con areaDiseno 500 m² capturados: se acota a 372 m²", "CM.fuego.8", () => {
    armar([], { riesgo: "ord2", area: 2000, altura: 6, Lramal: 30, Lmontante: 12, areaDiseno: 500 });
  });
  caso("CM.fuego.9 (NFPA 13-2016 riesgo ordinario 1; C 150 Tabla 23.4.4.8) 400 m², 4 m, 15+5 m, K115, cobre, red municipal 20 mca: bomba de refuerzo chica", "CM.fuego.9", () => {
    armar([], { riesgo: "ord1", area: 400, altura: 4, Lramal: 15, Lmontante: 5, rociador: "k115", material: "cobre", fuente: "municipal", presFuente: 20 });
  });
  caso("CM.fuego.10 (NFPA 13-2016 riesgo extra 2, duración 120 min) 1,000 m², 8 m, 40+15 m, K80, cisterna", "CM.fuego.10", () => {
    armar([], { riesgo: "extra2", area: 1000, altura: 8, Lramal: 40, Lmontante: 15 });
  });
}
