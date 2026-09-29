/* AUD-12 · Segundo proyecto fijo de regresión (auditoría externa, 29-sep-2026). Lo corre genera.mjs dentro de la suite (window) y
   escribe regresion-motores-2.emp.json. Cada disciplina se captura EN SU PROPIA PESTAÑA, con las mismas funciones que usa la
   pantalla; ninguna se genera a partir de otra (sin propuestas aceptadas, sin herencias, sin migraciones). Ejercita las ramas que
   el primer proyecto no toca: motor con MCA/MOP de placa, conductor de aluminio, protección > 300 A, sin distancia al tablero ni
   transformador; diversidad de edificio ≠ 1 y sitio propio en Selección; ΔP negativa y < 5 Pa; ducto de grasa; ventilador sin
   cobertura del catálogo; regadera de emergencia; CPVC fuera de catálogo; varios tanques pulmón; cobre en aire comprimido;
   soportería con instantánea guardada y metros a mano. Sin Date.now() ni azar: ids y fechas fijos. */
(() => {
  const T = Date.UTC(2026, 8, 29, 12);
  reemplazarEstado(defaultState());
  S.meta = { ...S.meta, name: "Regresión por motor · proyecto 2", client: "EMP interno", location: "Mexicali", engineer: "Banco de pruebas", date: "2026-09-29" };
  S.site = { key: "mexicali" };
  /* Carga térmica: su sitio capturado en su pestaña y sus zonas. */
  S.sitioCarga = { key: "mexicali", origen: "capturado en Carga térmica", ts: T };
  const dz = defaultZone;
  S.zones = [
    { ...dz("Nave de proceso"), id: "z2a", area: 900, height: 9, occ: 40, lights: 10800, equip: 30000, walls: { N: 60, S: 60, E: 45, W: 45, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 900, glass: { N: 0, S: 8, E: 0, W: 6, NE: 0, SE: 0, SW: 0, NW: 0 } },
    { ...dz("Cocina de planta"), id: "z2b", area: 150, height: 4, occ: 12, lights: 1800, equip: 9000, walls: { N: 15, S: 15, E: 12, W: 12, NE: 0, SE: 0, SW: 0, NW: 0 }, roof: 150 },
  ];
  S.zi = 0;
  /* Cuartos limpios: un cuarto de contención en presión NEGATIVA de 3 Pa (menos que el piso de 5 Pa). */
  S.clean = { rooms: [{ ...defaultRoom("Contención 1"), iso: "iso8", area: 60, height: 3, occ: 3, procW: 15, dp: -3 }], ci: 0 };
  /* Selección de equipo: zonas, sitio, presión estática y diversidad capturados en su pestaña. */
  S.equip = { ...defaultEquip() };
  [["Nave de proceso", { tons: 95, cfm: 38000, oa: 6000, area: 900, sensKW: 280, latKW: 54, hour: 16 }],
   ["Cocina de planta", { tons: 22, cfm: 8000, oa: 3000, area: 150, sensKW: 58, latKW: 19, hour: 14 }]].forEach(([nom, x]) => {
    const i = agregarZonaEquip(); editarZonaEquip(i, "name", nom); Object.entries(x).forEach(([k, v]) => editarZonaEquip(i, k, v));
  });
  ["db", "wb", "alt"].forEach((k, j) => editarSitioEquip(k, [44, 24.8, 5][j]));
  S.equip.sitio.ts = T;
  S.equip.div = 0.85; S.equip.espCaptura = 0.8;
  const fam = FAMILIES[1] || FAMILIES[0], mod = familyPool(fam.id)[0];
  if (mod) S.equip.items = [{ id: mod.id, fam: fam.id, qty: 3, unit: null }];
  /* Ductos: suministro rectangular y redondo, retorno y un tramo de grasa de cocina. */
  const seg = (id, tag, flow, x) => ({ ...defaultSegment(tag, flow), id, ...x });
  S.duct.segments = [
    seg("d2a", "SA-NAVE", 9000, { length: 30 }),
    seg("d2b", "SA-RAMAL", 2500, { length: 14, shape: "round", method: "velocity", targetV: 6, fittings: [{ type: "elbow_90_round", qty: 1, C: .22 }] }),
    seg("d2c", "RA-NAVE", 7000, { service: "return", length: 20 }),
    seg("d2d", "GR-COCINA", 1800, { service: "kitchen_grease", length: 12, shape: "round", method: "velocity", targetV: 9, fittings: [] }),
  ];
  S.duct.difusores = 24;
  /* Ventilación: extracción general de un volumen que ningún modelo del catálogo cubre. */
  S.vent = { ...S.vent, mode: "general", area: 1500, height: 8, occ: 40, ach: 10 };
  /* Eléctrico: aluminio, un equipo con motocompresor con MCA/MOP de placa, cargas grandes (protección > 300 A), sin distancia al
     tablero ni transformador; una carga sin distancia capturada. */
  S.elec = { ...defaultElec(), sistema: "3F4H-440", material: "aluminio", trafoKVA: null, trafoZ: null, Ltablero: null,
    cargas: [
      { ...defaultCarga("Chiller de proceso"), id: "e2a", tipo: "motor", kW: 110, V: 440, ph: 3, cant: 1, L: 55, fp: .88, mca: 210, mop: 300 },
      { ...defaultCarga("Hornos de curado"), id: "e2b", tipo: "proceso", kW: 160, V: 440, ph: 3, cant: 1, L: 40, fp: .95 },
      { ...defaultCarga("Compresor de tornillo"), id: "e2c", tipo: "motor", kW: 75, V: 440, ph: 3, cant: 1, L: null, fp: .86 },
      { ...defaultCarga("Alumbrado de nave"), id: "e2d", tipo: "alumbrado", kW: 12, V: 254, ph: 1, cant: 1, L: 70, fp: .95 },
    ] };
  /* Hidrosanitario: CPVC con un tramo que no cabe en su mayor diámetro verificado, regadera de emergencia y tarja de laboratorio. */
  S.hidro = { ...defaultHidro(), material: "cpvc", presRed: 18, alturaEdificio: 8,
    tramos: [{ ...defaultTramoAgua("AF-GENERAL"), id: "h2a", um: 420, L: 45, alt: 4 }, { ...defaultTramoAgua("AF-LAB"), id: "h2b", um: 18, L: 20, alt: 0 }],
    muebles: [{ id: "wc_flux", cant: 8 }, { id: "lavabo", cant: 8 }, { id: "tarja_lab", cant: 3 }, { id: "lavaojos", cant: 2 }, { id: "fregadero", cant: 2 }],
    fx: 18.5, fxFecha: "2026-09-22", fxFuente: "fixture de regresión 2" };
  /* Contra incendio: riesgo ordinario con su trayectoria y fuente capturadas. */
  S.fuego = { ...defaultFuego(), riesgo: "ord2", area: 1050, altura: 9, Lramal: 40, Lmontante: 15, presFuente: 25 };
  /* Aire comprimido: red de cobre y una demanda que pide varios tanques pulmón. */
  S.aire = { ...defaultAire(), material: "cobre", Lprincipal: 80, Lramales: 40, consumos: [
    { ...defaultConsumo("Soplado de moldes"), id: "a2a", cant: 12, lmin: 1500, bar: 6, uso: .8 },
    { ...defaultConsumo("Herramienta neumática"), id: "a2b", cant: 20, lmin: 400, bar: 6, uso: .5 }] };
  /* Obra civil: sus áreas y su cuarto clasificado capturados en su pestaña. */
  S.civil = { ...defaultCivil(), firmeM2: 200, puertasSimples: 4, puertasLimpias: 1, pinturaM2: 300,
    areas: [{ id: "c2a", nombre: "Nave de proceso", area: 900, altura: 9, perimetro: 120 }, { id: "c2b", nombre: "Cocina de planta", area: 150, altura: 4, perimetro: 50 }],
    cuartos: [{ id: "c2k", nombre: "Contención 1", area: 60, altura: 3, perimetro: 32 }] };
  /* Soportería: alturas, bases y riel capturados; metros a mano capturados; instantánea guardada (se toma abajo, con fecha fija). */
  S.soporte = { ...defaultSoporte(), rielM: 40, mesesElevacion: 2, alturaEstructura: 9, alturaTrabajo: 8, alturaColgadoM: 1.2, basesEquipo: 4,
    ductoM: 80, ductoAnchoMm: 800, ductoAltoMm: 500, tubHidroM: 60, tubHidroD: 50, tubHidroMat: "cpvc", tubFuegoM: 55, tubFuegoD: 100, tubFuegoMat: "acero", tubAireM: 120, tubAireD: 40, tubAireMat: "cobre" };
  S.quote.fx = 18.5; S.quote.fxFecha = "2026-09-22"; S.quote.fxFuente = "fixture de regresión 2";
  Object.keys(LINKS).forEach((k) => { S.perms[k] = { ts: 1, via: "regresión 2" }; });
  S.tab = "tablero"; recompute();
  S.soporte.snap = { ...snapshotSoporte(), ts: T }; S.soporte.usarMotores = true; recompute();
})();
