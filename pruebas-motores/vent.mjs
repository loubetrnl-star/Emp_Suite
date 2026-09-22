/* CM.vent · casos calculados a mano del motor de VENTILACIÓN (Fase 1, rev 2.9.24).
   Hoja: parches/casos-a-mano/vent.csv · cálculo independiente: parches/casos-a-mano/vent.calc.mjs (no carga index.html).
   Compara NÚMEROS con tolerancia; las filas «fase2:H-nnn» sólo se exigen con CM_FASE2=1. Restaura S en finally.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí no se tocan):
   - pruebas.mjs:5898 R.1 (golden por motor) consagra para el fixture (700 m² / 4.71 m / 46 pers, 11,643 CFM) el modelo
     GB-360 (4,000–9,000) con cubre = false, aunque el CSW-30 (7,000–18,000) del mismo pool sí cubre → H-154. El esperado
     está en parches/regresion-motores/regresion-motores.esperado.json (motores.vent.cifras.primary = "GB-360"). Al cerrar
     H-154 se sube MOTOR_VER.vent y se regenera ese esperado.
   - pruebas.mjs:5358 S.23 afirma que con el modo cocina sin medidas «la cotización sigue vacía» (capturaReal("quote") = false),
     pero VENT.demand da 30 CFM (piso de 0.1 ft) y QUOTE.aux lleva dos partidas de ventilación → H-155. La prueba mide la
     compuerta de captura, no la partida; promete más de lo que revisa.
   - parches/regresion-motores/genera.mjs declara ventilación 400 m² / 6 m / 30 personas, pero el fixture calcula con lo
     heredado (700 / 4.71 / 46): el golden R.1 vigila un caso distinto del que dice (AUDITORIA.md §4).
   - Ninguna prueba del banco afirma un número del motor fuera de R.1 (grep VENT./computeVent/pickVent en pruebas.mjs):
     los 7 mutantes de la auditoría sobrevivían por eso. */
export default async function ({ t, G, S, CM }) {
  const filas = CM.casos("vent");
  const vistas = new Set();
  const filasDe = (n, letras) => filas.filter((f) => (f.id === `CM.vent.${n}` || f.id.startsWith(`CM.vent.${n}.`)) && (!letras || letras.includes(f.id.split(".")[3])));
  const comprobar = (n, letras) => {
    const fs = filasDe(n, letras);
    if (!fs.length) throw new Error(`sin filas CM.vent.${n}${letras ? "." + letras.join("/") : ""} en la hoja`);
    fs.forEach((f) => vistas.add(f.id));
    fs.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; CM.comprobar(f); });
  };
  /* Arma S.vent desde cero (defaultState) y marca área/altura/ocupantes como capturados para que la herencia no los pise. */
  const vent = (campos) => {
    const s = G("S");
    Object.assign(s.vent, campos);
    ["vent.area", "vent.height", "vent.occ"].forEach((k) => G("marcarPropio")(k));
  };
  const permisos = () => { const s = G("S"); Object.keys(G("LINKS")).forEach((k) => { s.perms[k] = { ts: 1, via: "CM.vent" }; }); };
  /* pasos: [[letras|null, armar], …] · cada paso arma su estado, recalcula y comprueba sus filas. */
  const caso = (n, titulo, pasos) => t(`CM.vent.${n} ${titulo}`, () => {
    const guardado = JSON.stringify(S);
    try {
      for (const [letras, armar] of pasos) {
        G("reemplazarEstado")(G("defaultState")());
        armar();
        G("recompute")();
        comprobar(n, letras);
      }
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });

  caso(1, "(ASHRAE 62.1-2016 Tabla 6.2.2.1; criterio de la casa Tab.45, SP y margen) oficina 100 m² / 3 m / 10 personas / 6 1/h", [
    [null, () => vent({ mode: "general", spaceType: "office", area: 100, height: 3, occ: 10, ach: 6, ductLoss: .5, filterLoss: .25 })],
  ]);
  caso(2, "(ASHRAE 62.1-2016 Tabla 6.2.2.1; catálogo Greenheck) geometría del fixture 700 m² / 4.71 m / 46 personas / 6 1/h; H-154 CSW-30 cubre 12,808 CFM", [
    [["a", "b", "c", "d", "e", "f", "g", "h"], () => vent({ mode: "general", spaceType: "office", area: 700, height: 4.71, occ: 46, ach: 6, ductLoss: .5, filterLoss: .25 })],
    [["i"], () => vent({ mode: "general", spaceType: "production", area: 700, height: 4.71, occ: 46, ach: 6 })],
  ]);
  caso(3, "(ASHRAE 62.1-2016 Tabla 6.2.2.1 Warehouses Rp 5) almacén 200 m² / 6 m / 12 personas / 0 1/h; H-157 hoy Rp 2.5", [
    [null, () => vent({ mode: "general", spaceType: "warehouse", area: 200, height: 6, occ: 12, ach: 0 })],
  ]);
  caso(4, "(ASHRAE 62.1-2016 Tabla 6.2.2.1 Classrooms Rp 5 Ra 0.6) aula 100 m² / 3 m / 10 personas: rige Vbz; con 0.5 1/h avisa", [
    [["a", "b", "c"], () => vent({ mode: "general", spaceType: "classroom", area: 100, height: 3, occ: 10, ach: 0 })],
    [["d", "e"], () => vent({ mode: "general", spaceType: "classroom", area: 100, height: 3, occ: 10, ach: .5, ductLoss: .5, filterLoss: .25 })],
  ]);
  caso(5, "(IMC 2021 Tabla 507.5.2 vía CKV Tabla 1; criterio de la casa reposición 80 %) campana de muro 3.0 × 1.2 m carga media; H-156 tolerancia ×0.9", [
    [null, () => vent({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 3.0, hoodW: 1.2, ductLoss: .5, filterLoss: .25 })],
  ]);
  caso(6, "(IMC 2021 Tabla 507.5.2 vía CKV Tabla 1) campana de isla sencilla 2.4 × 1.5 m carga media", [
    [null, () => vent({ mode: "kitchen", hoodType: "island", duty: "medium", hoodL: 2.4, hoodW: 1.5 })],
  ]);
  caso(7, "(IMC 2021 Tabla 507.5.2 vía CKV Tabla 1) visera 2.0 × 0.6 m ligera; H-159 visera pesada no permitida", [
    [["a"], () => vent({ mode: "kitchen", hoodType: "eyebrow", duty: "light", hoodL: 2.0, hoodW: 0.6 })],
    [["b"], () => vent({ mode: "kitchen", hoodType: "eyebrow", duty: "heavy", hoodL: 2.0, hoodW: 1.0 })],
  ]);
  caso(8, "(criterio de la casa HOOD por área, «rige el mayor» H-14) campana de muro 3.0 × 1.5 m pesada", [
    [null, () => vent({ mode: "kitchen", hoodType: "wall", duty: "heavy", hoodL: 3.0, hoodW: 1.5 })],
  ]);
  caso(9, "(criterio de la casa: velocidad sobre área libre) rejilla 1.2 × 1.0 m 50 % 500 fpm; H-155 sin área libre", [
    [["a", "b", "c"], () => vent({ mode: "louver", louverW: 1.2, louverH: 1.0, freeArea: 50, faceVel: 500 })],
    [["d"], () => vent({ mode: "louver", louverW: 1.2, louverH: 1.0, freeArea: 0, faceVel: 400 })],
  ]);
  caso(10, "(política 2.9.16, nada se estima) cocina sin medidas: H-155 demanda 0 y sin partidas", [
    [null, () => { vent({ mode: "kitchen", hoodType: "wall", duty: "medium", hoodL: 0, hoodW: 0 }); permisos(); }],
  ]);
  caso(11, "(criterio de la casa máx(proceso, dilución)) industrial 500 m² × 8 m 10 1/h con proceso 20,000 y 30,000 CFM", [
    [["a"], () => vent({ mode: "industrial", area: 500, height: 8, ach: 10, processCFM: 20000 })],
    [["b", "c"], () => vent({ mode: "industrial", area: 500, height: 8, ach: 10, processCFM: 30000 })],
  ]);
  caso(12, "(catálogo Greenheck) general 1,000 m² × 6 m × 6 1/h = 21,189 CFM: nadie del pool general cubre y la matriz lo dice", [
    [null, () => vent({ mode: "general", spaceType: "office", area: 1000, height: 6, occ: 0, ach: 6 })],
  ]);
  caso(13, "(criterio de la casa reposición = extracción) modo reposición 200 m² × 4 m 10 personas 2 1/h", [
    [null, () => vent({ mode: "mua", spaceType: "office", area: 200, height: 4, occ: 10, ach: 2 })],
  ]);
  caso(14, "(criterio de la casa margen 10 %; catálogo Greenheck) 400 m² × 6 m × 6.4 1/h = 9,041 CFM: H-156 GB-360 no cubre 9,945; H-154 CSW-22 sí", [
    [null, () => vent({ mode: "general", spaceType: "office", area: 400, height: 6, occ: 30, ach: 6.4 })],
  ]);
  caso(15, "(criterio de la casa SP = ductos + filtros + 0.25; aviso > 2.5) oficina con ductos 2.0 y filtros 0.5", [
    [null, () => vent({ mode: "general", spaceType: "office", area: 100, height: 3, occ: 10, ach: 6, ductLoss: 2.0, filterLoss: .5 })],
  ]);

  t("CM.vent.0 toda fila de la hoja vent.csv tiene una prueba que la arma (ninguna queda huérfana)", () => {
    const huerfanas = filas.map((f) => f.id).filter((id) => !vistas.has(id));
    if (huerfanas.length) throw new Error(`filas sin prueba: ${huerfanas.join(", ")}`);
    const ids = filas.map((f) => f.id);
    if (new Set(ids).size !== ids.length) throw new Error("ids repetidos en la hoja");
  });
}
