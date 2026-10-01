/* pruebas-motores/hidro.mjs · Fase 1 (rev 2.9.24) · casos calculados a mano del motor hidrosanitario (`hidro`, v8).
   Hoja: parches/casos-a-mano/hidro.csv (generada por parches/casos-a-mano/hidro.calc.mjs, cálculo independiente de la
   suite). Cada prueba arma el estado del caso, evalúa las filas de su prefijo con CM.comprobar (números con tolerancia)
   y restaura S en finally. Las filas «fase2:H-nnn» sólo se exigen con CM_FASE2=1.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí sólo se marcan):
   - 22.5 `cerca(H.kWbomba, 2.1511)` y `eq(H.hpBomba, 3)`: η 0.6 y redondeo a 0.5 HP sin fuente (H-203; 3 HP sí es comercial,
     pero el redondeo a medio HP no lo garantiza). Los valores de CDT y presión mínima de 22.5 y L.1 ya son los de la Tabla
     604.3 del IPC 2015 (H-194, cerrado en la rev 2.9.24).
   - 22.11 `cerca(Σqty, 43)`: los metros (25 + 18) sí son los capturados; los precios semilla de cisterna/bomba que arrastraba
     salieron en H-196 (cerrado en la rev 2.9.24).
   - N.2: arma la cisterna con la dotación por omisión «industria 100 L» y el día de reserva por omisión y sólo exige
     `cisterna > 0`; no detecta la dotación de oficina de 70 L (H-202: NTC-PA da 50) ni el piso de 0.5 día (H-197).
   - S.34: comprueba la curva de Hunter sólo en renglones que la suite sí trae; la tabla sigue incompleta (51 renglones de
     E103.3(3) faltan, interpolación hasta −8 %: H-203). */
export default async function ({ t, G, S, CM }) {
  const filas = CM.casos("hidro");
  const de = (pref) => filas.filter((f) => f.id === pref || f.id.startsWith(pref + "."));
  const comprobar = (pref) => {
    const lista = de(pref);
    if (!lista.length) throw new Error(`no hay filas ${pref} en parches/casos-a-mano/hidro.csv`);
    lista.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; CM.comprobar(f); });
  };
  /* Arma un estado limpio, aplica `armar`, recalcula y comprueba las filas de los prefijos; siempre restaura S. */
  const conEstado = (nombre, armar, prefijos) => t(nombre, () => {
    const guardado = JSON.stringify(S);
    try {
      G("reemplazarEstado")(G("defaultState")());
      armar();
      G("recompute")();
      prefijos.forEach(comprobar);
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });
  /* Fixture del motor (mismo que parches/regresion-motores): cobre tipo L, dos tramos de agua fría, 13 muebles. */
  const fixture = () => ({ ...G("defaultHidro")(), material: "cobre", presRed: 0, alturaEdificio: 0,   /* AUD-14: la hoja los declara capturados en 0 (defaultHidro ya nace sin captura) */
    tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 0 }],
    muebles: [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }] });
  const autorizarCotizacion = () => { S.perms["hidro>quote"] = { ts: 1, via: "CM.hidro" }; };

  conEstado("CM.hidro.1 (IPC 2015 E103.3(2)/(3), 604.3, 709.1, 710.1, 906.2; ASTM B88 tipo L; Hazen-Williams) fixture cobre 72 UM / 20 UM: gasto, diámetros, pérdidas, CDT, bomba, drenaje, agua caliente y cotización",
    () => { S.hidro = fixture(); autorizarCotizacion(); }, ["CM.hidro.1"]);

  conEstado("CM.hidro.2 (IPC 2015 E103.3(3) columna de tanque; V máx 1.5 m/s criterio de la casa) tramos de agua caliente: tipoUM explícito «tanque» y «auto»",
    () => { S.hidro = fixture(); S.hidro.tramos.push({ ...G("defaultTramoAgua")("AC-1"), servicio: "caliente", um: 20, L: 10, alt: 0, tipoUM: "tanque" }, { ...G("defaultTramoAgua")("AC-2"), servicio: "caliente", um: 20, L: 10, alt: 0, tipoUM: "auto" }); }, ["CM.hidro.2"]);

  conEstado("CM.hidro.3.a (NTC-PA Tabla 3.1, industria 100 L/trabajador/día) cisterna de 60 trabajadores, 1 día",
    () => { S.hidro = { ...fixture(), dot: "industria", habitantes: 60, diasReserva: 1 }; }, ["CM.hidro.3.a"]);
  conEstado("CM.hidro.3.b (NTC-PA Tabla 3.1, industria 100 L/trabajador/día) cisterna de 60 trabajadores, 2 días",
    () => { S.hidro = { ...fixture(), dot: "industria", habitantes: 60, diasReserva: 2 }; }, ["CM.hidro.3.b"]);
  conEstado("CM.hidro.3.c (NTC-PA Tabla 3.1, oficinas 50 L/persona/día) cisterna de oficina de 100 personas, 1 día [fase2:H-202]",
    () => { S.hidro = { ...fixture(), dot: "oficina", habitantes: 100, diasReserva: 1 }; }, ["CM.hidro.3.c"]);
  conEstado("CM.hidro.3.d (H-197, decisión del dueño: respetar la captura) cisterna con 0 días de reserva capturados",
    () => { S.hidro = { ...fixture(), dot: "industria", habitantes: 60, diasReserva: 0 }; }, ["CM.hidro.3.d"]);
  conEstado("CM.hidro.3.e (H-197) días de reserva negativos: cisterna 0, sin invertir el signo",
    () => { S.hidro = { ...fixture(), dot: "industria", habitantes: 60, diasReserva: -1 }; }, ["CM.hidro.3.e"]);

  conEstado("CM.hidro.4 (IPC 2015 E103.3(2)/(3) tanque, 709.1, 710.1, 906.2) cuatro WC con tanque, sin otro mueble: sistema de tanque y drenaje",
    () => { S.hidro = { ...fixture(), tramos: [], muebles: [{ id: "wc_tanque", cant: 4 }] }; }, ["CM.hidro.4"]);

  conEstado("CM.hidro.5 (H-195: ANSI Z358.1-1990 §4.1 vía carta OSHA 18-abr-2002, secundaria) regadera de emergencia: demanda fija de 20 gpm fuera de Hunter y volumen para 15 min",
    () => { S.hidro = { ...fixture(), tramos: [], muebles: [{ id: "lavaojos", cant: 1 }] }; }, ["CM.hidro.5"]);

  conEstado("CM.hidro.6 (H-198, decisión del dueño; CPVC CTS SDR-11 hasta 2\" según Spears/Lubrizol, secundaria) CPVC: sin los renglones «SIN VERIFICAR» de 2 1/2\" a 4\"; el tramo que no cabe en 2\" queda fuera de catálogo",
    () => { S.hidro = { ...fixture(), material: "cpvc" }; }, ["CM.hidro.6"]);

  conEstado("CM.hidro.7.a/c (H-197, decisión del dueño) ΔT 0 no se sube a 5 K: calentador pendiente",
    () => { S.hidro = { ...fixture(), tempEntrada: 40, tempSalida: 40 }; }, ["CM.hidro.7.a", "CM.hidro.7.c"]);
  conEstado("CM.hidro.7.b (H-197: IPC 2015 §704.1) pendiente capturada 0.2 % con colector de 100 mm: mínima de norma 1/8 in/ft con aviso",
    () => { S.hidro = { ...fixture(), pendiente: 0.2 }; }, ["CM.hidro.7.b"]);
  conEstado("CM.hidro.7.d (H-197: IPC 2015 §704.1) pendiente capturada 3 %, mayor que la mínima: se respeta",
    () => { S.hidro = { ...fixture(), pendiente: 3 }; }, ["CM.hidro.7.d"]);
  conEstado("CM.hidro.7.e (H-197: IPC 2015 §704.1) pendiente 0 capturada: la mínima de norma del colector",
    () => { S.hidro = { ...fixture(), pendiente: 0 }; }, ["CM.hidro.7.e"]);

  conEstado("CM.hidro.8 (decisión del dueño rev 2.9.16) tramo sin longitud: pérdida 0 y marcado sinL",
    () => { S.hidro = fixture(); S.hidro.tramos[0].L = 0; }, ["CM.hidro.8"]);

  conEstado("CM.hidro.9 (IPC 2015 E103.3(3) completa, 710.1(1)/(2); ASTM B88 tipo L; Hazen-Williams) funciones y tablas del motor evaluadas directamente",
    () => { S.hidro = fixture(); }, ["CM.hidro.9"]);

  conEstado("CM.hidro.10 (decisión del dueño 15-sep-2026) la CDT usa la altura del edificio capturada",
    () => { S.hidro = { ...fixture(), alturaEdificio: 6 }; }, ["CM.hidro.10"]);

  conEstado("CM.hidro.11 (IPC 2015 Tabla 604.3) la presión requerida es la del mueble que más pide; con 8 m en la toma no alcanza",
    () => { S.hidro = { ...fixture(), presRed: 8, tramos: [], muebles: [{ id: "wc_flux", cant: 1 }, { id: "lavabo", cant: 1 }] }; }, ["CM.hidro.11"]);

  /* H-194 (rev 2.9.24, hidro v5): presión mínima en la salida de cada mueble por la Tabla 604.3 del IPC 2015. */
  conEstado("CM.hidro.12 (H-194: IPC 2015 Tabla 604.3; §424.3 fija el renglón de la regadera) presión mínima en la salida de cada mueble de la tabla MUEBLES",
    () => { S.hidro = fixture(); }, ["CM.hidro.12"]);
  conEstado("CM.hidro.13 (H-194: criterio de la casa sobre la Tabla 604.3) sin muebles capturados la presión requerida es el menor renglón de la tabla, 8 psi",
    () => { S.hidro = { ...fixture(), muebles: [] }; }, ["CM.hidro.13"]);
  conEstado("CM.hidro.14 (H-194: IPC 2015 Tabla 604.3; residual 15 m criterio de la casa) con sólo lavabos la CDT lleva el residual de la casa, que es mayor que la mínima de norma",
    () => { S.hidro = { ...fixture(), muebles: [{ id: "lavabo", cant: 2 }] }; }, ["CM.hidro.14"]);

  /* H-195 (rev 2.9.24, hidro v6): regadera de emergencia y lavaojos fuera de Hunter, con gasto fijo (Z358.1-1990 vía OSHA). */
  conEstado("CM.hidro.15 (H-195: IPC 2015 E103.3(3); Z358.1-1990 §4.1 vía OSHA) fixture + regadera de emergencia: gasto del sistema y del tramo que la lleva",
    () => { S.hidro = fixture(); S.hidro.muebles.push({ id: "lavaojos", cant: 1 }); S.hidro.tramos[0].qEmergLmin = 75.7; }, ["CM.hidro.15"]);
  conEstado("CM.hidro.16 (H-195: Z358.1-1990 vía carta OSHA 22-nov-1993) dos lavaojos fijos sin regadera: 0.4 gal/min cada uno",
    () => { S.hidro = { ...fixture(), tramos: [], muebles: [{ id: "lavaojos_solo", cant: 2 }] }; }, ["CM.hidro.16"]);
}
