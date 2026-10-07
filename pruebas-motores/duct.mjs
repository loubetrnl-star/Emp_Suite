/* CM.duct · casos calculados a mano del motor de DUCTOS (Fase 1, rev 2.9.24).
   Hoja: parches/casos-a-mano/duct.csv · cálculo independiente: parches/casos-a-mano/duct.calc.mjs (no carga index.html).
   Compara NÚMEROS con tolerancia; las filas «fase2:H-nnn» sólo se exigen con CM_FASE2=1. Restaura S en finally.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí no se tocan):
   - R.1 (golden por motor, parches/regresion-motores/regresion-motores.esperado.json) consagra path 73.32 Pa del proyecto
     fijo, de los cuales 48.9 Pa son los 2 codos C 0.28 que defaultSegment pone en cada tramo sin que nadie los capture
     (H-172, no crítico).
   - (H-305: chainToDuct se retiró; 13.8 y 22.6 capturan la misma red) pruebas.mjs:1473 (13.8) y 3652 (22.6) usaban chainToDuct: hoy la red trae 20/10/15 m y tee/salida/entrada que nadie
     capturó (H-167); las pruebas sólo miran textos y el semáforo, no esos números.
   - pruebas.mjs:5946 S.27 afirma «1 tramo(s) sin caudal» en el semáforo, pero ese tramo sigue con 400×200 y kilos en la
     cédula y en la cotización (H-166); la prueba mide el texto, no la partida.
   - pruebas.mjs:4891 Q.8 revisa que la instantánea de soportería no caiga al respaldo 400×200 de SOPORTERÍA; el mismo
     respaldo vive en el motor de ductos (sizeRect y medida bloqueada: 400×200 / Ø250) y ninguna prueba lo miraba (H-166).
   - Ninguna prueba del banco afirmaba un número del motor fuera de R.1: los mutantes de la auditoría (8 de 9) vivían. */
export default async function ({ t, G, S, CM }) {
  const filas = CM.casos("duct");
  const vistas = new Set();
  const filasDe = (n, letras) => filas.filter((f) => (f.id === `CM.duct.${n}` || f.id.startsWith(`CM.duct.${n}.`)) && (!letras || letras.includes(f.id.split(".")[3])));
  const comprobar = (n, letras) => {
    const fs = filasDe(n, letras);
    if (!fs.length) throw new Error(`sin filas CM.duct.${n}${letras ? "." + letras.join("/") : ""} en la hoja`);
    fs.forEach((f) => vistas.add(f.id));
    fs.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; CM.comprobar(f); });
  };
  const permisos = () => { const s = G("S"); Object.keys(G("LINKS")).forEach((k) => { s.perms[k] = { ts: 1, via: "CM.duct" }; }); };
  const seg = (tag, flow, extra) => ({ ...G("defaultSegment")(tag, flow), ...extra });
  const tramos = (lista) => { G("S").duct.segments = lista; };
  /* pasos: [[letras|null, armar], …] · cada paso arma su estado desde defaultState, recalcula y comprueba sus filas. */
  const caso = (n, titulo, pasos) => t(`CM.duct.${n} ${titulo}`, () => {
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
  /* H-170: el proyecto fijo se guardó antes del espaciado de refuerzo: sus tramos no traen la llave y conservan la tabla de la casa
     («migración, sin confirmar»); estos casos a mano son de esa tabla. */
  const viejo = (s) => { delete s.espaciadoRef; return s; };
  const FIJO = () => [viejo(seg("TR-1", 6000, { length: 18 })), viejo(seg("TR-2", 3400, { length: 12 })), viejo(seg("RT-1", 5000, { service: "return", length: 15 }))];

  caso(1, "(Huebscher, Darcy-Weisbach/Haaland; criterio de la casa en medida, calibre y kilos) TR-1 6,000 L/s 18 m → 1200×700, 26.36 Pa, 604.88 kg", [
    [null, () => tramos(FIJO())],
  ]);
  caso(2, "(ídem) TR-2 3,400 L/s 12 m → 900×600, 19.52 Pa, 318.36 kg", [
    [null, () => tramos(FIJO())],
  ]);
  caso(3, "(ídem) RT-1 retorno 5,000 L/s 15 m → 900×750, 27.45 Pa, 437.75 kg", [
    [null, () => tramos(FIJO())],
  ]);
  caso(4, "(ídem) sistema del proyecto fijo: 73.32 Pa del equipo, 1,360.99 kg, 58 hojas", [
    [null, () => tramos(FIJO())],
  ]);
  caso(5, "(Darcy-Weisbach/Haaland; criterio de la casa ROUND_G y despiece) redondo bloqueado Ø500 1,000 L/s 12 m", [
    [null, () => tramos([seg("R-1", 1000, { shape: "round", lock: true, d: 500, length: 12 })])],
  ]);
  caso(6, "(UMC 2018 §510.5.1, H-165) grasa 500 L/s clase ½\": acero al carbón 16 MSG 0.060 in; inoxidable 18 MSG 0.048 in", [
    [["a", "b", "c", "d", "e"], () => { G("S").duct.meta.pc = "0.5"; tramos([seg("GR-1", 500, { service: "kitchen_grease", length: 6 })]); }],
    [["f", "g"], () => { const s = G("S"); s.duct.meta.pc = "0.5"; s.duct.meta.material = "stainless"; tramos([seg("GR-1", 500, { service: "kitchen_grease", length: 6 })]); }],
  ]);
  caso(9, "(criterio de la casa: puntuación del dimensionado; H-25) suministro 1,500 L/s → 600×450 y extracción 1,000 L/s fuera del circuito del equipo", [
    [null, () => tramos([seg("SA-9", 1500, { length: 10 }), seg("EX-9", 1000, { service: "exhaust", length: 10 })])],
  ]);
  caso(7, "(nada se estima; H-166) sin medida posible, medida bloqueada sin capturar y tramo sin caudal: sin sección, sin kilos, sin importe", [
    [["a", "b"], () => tramos([seg("SC-1", 6000, { length: 18, hmax: 200 })])],
    [["c"], () => tramos([seg("BL-1", 2000, { length: 10, lock: true }), seg("BL-2", 2000, { shape: "round", length: 10, lock: true })])],
    [["d", "e", "f"], () => { permisos(); tramos([seg("SQ-1", 0, { length: 25 })]); }],
    [["g"], () => tramos([viejo(seg("TR-1", 6000, { length: 18 })), seg("SQ-1", 0, { length: 25 })])],
  ]);
  caso(8, "(arranque en ceros; H-167) la red con sólo caudales (antes «Generar desde carga», retirado en H-305) no lleva longitudes ni accesorios", [
    [null, () => {
      const s = G("S");
      s.site = { key: "tijuana" }; s.sitioCarga = { key: "tijuana", origen: "capturado en Carga térmica" };   /* H-290 */
      const dz = G("defaultZone");
      s.zones = [
        { ...dz("Producción"), area: 400, height: 6, occ: 30, lights: 8000, equip: 12000, walls: { N: 40, S: 40, E: 30, W: 30, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 400 },
        { ...dz("Oficinas"), area: 100, height: 3, occ: 10, lights: 1500, equip: 2000, walls: { N: 12, S: 12, E: 10, W: 10, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 100 },
      ];
      permisos();
      G("recompute")();
      /* H-305: «Generar desde carga» se retiró; se capturan a mano los mismos tramos que armaba (sólo caudales). */
      const t = G("totals")(), ds = G("defaultSegment");
      s.duct.segments = [{ ...ds("SA-PRINCIPAL", Math.round(t.cfm * 1.699 / 3.6)), length: 0, aspect: 3, fittings: [] },
        ...G("LOADS").map((r, i) => ({ ...ds(`SA-${s.zones[i].name.slice(0, 8).toUpperCase()}`, Math.round(r.cfm * 1.699 / 3.6)), shape: "round", method: "velocity", targetV: 5, length: 0, fittings: [] })),
        ...(t.oa > 0 ? [{ ...ds("OA-EXTERIOR", Math.round(t.oa / 3.6)), service: "supply", shape: "round", method: "velocity", targetV: 4, length: 0, fittings: [] }] : [])];
    }],
  ]);

  t("CM.duct.0 toda fila de la hoja duct.csv tiene una prueba que la arma (ninguna queda huérfana)", () => {
    const huerfanas = filas.map((f) => f.id).filter((id) => !vistas.has(id));
    if (huerfanas.length) throw new Error(`filas sin prueba: ${huerfanas.join(", ")}`);
    const ids = filas.map((f) => f.id);
    if (new Set(ids).size !== ids.length) throw new Error("ids repetidos en la hoja");
  });
}
