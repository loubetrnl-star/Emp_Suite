/* pruebas-motores/hidro.mjs · Fase 1 (rev 2.9.24) · casos calculados a mano del motor hidrosanitario (`hidro`, v4).
   Hoja: parches/casos-a-mano/hidro.csv (generada por parches/casos-a-mano/hidro.calc.mjs, cálculo independiente de la
   suite). Cada prueba arma el estado del caso, evalúa las filas de su prefijo con CM.comprobar (números con tolerancia)
   y restaura S en finally. Las filas «fase2:H-nnn» sólo se exigen con CM_FASE2=1.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí sólo se marcan):
   - pruebas.mjs:3082 22.5 `cerca(H.cdt, 6 + friccion + 15)`: repite la fórmula del código (tautológica) y fija el residual
     de 15 m que H-194 sustituye por máx(residual, mínima de IPC 604.3 = 24.6 m para WC con fluxómetro).
   - pruebas.mjs:3083 22.5 `cerca(H.cdt, 25.9548)`: consagra la CDT con residual 15 m (H-194: debería ser 6 + 4.9548 + 24.6075
     = 35.56 m).
   - pruebas.mjs:3085 22.5 `cerca(H.kWbomba, 9.81 * H.Qtotal * H.cdt / 1000 / .6)`: tautológica; repite la fórmula y el η 0.6
     sin fuente (H-203).
   - pruebas.mjs:3086 22.5 `eq(H.hpBomba, 2.5)`: consagra 2.5 HP, que no es potencia comercial (H-203, redondeo a 0.5 HP).
   - pruebas.mjs:3770 L.1 `cerca(H.cdt, 8 + Σhf + 15)`: tautológica; fija el residual 15 m en vez de la mínima de 604.3 (H-194).
   - pruebas.mjs:3404 22.11 `cerca(Σqty, 43)`: da por buena la cotización de la red con la bomba de 2 HP calculada sobre una
     CDT sin presión mínima de norma y con precios semilla de cisterna/bomba (H-194, H-196); los metros (25 + 18) sí son
     los capturados.
   - pruebas.mjs:3945 N.2: arma la cisterna con la dotación por omisión «industria 100 L» y el día de reserva por omisión y sólo
     exige `cisterna > 0`; no detecta la dotación de oficina de 70 L (H-202: NTC-PA da 50) ni el piso de 0.5 día (H-197).
   - pruebas.mjs:5632 S.34: comprueba la curva de Hunter sólo en renglones que la suite sí trae; la tabla sigue incompleta
     (51 renglones de E103.3(3) faltan, interpolación hasta −8 %: H-203). */
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
  const fixture = () => ({ ...G("defaultHidro")(), material: "cobre",
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
  conEstado("CM.hidro.3.d (decisión del dueño: respetar la captura) cisterna con 0 días de reserva capturados [fase2:H-197]",
    () => { S.hidro = { ...fixture(), dot: "industria", habitantes: 60, diasReserva: 0 }; }, ["CM.hidro.3.d"]);

  conEstado("CM.hidro.4 (IPC 2015 E103.3(2)/(3) tanque, 709.1, 710.1, 906.2) cuatro WC con tanque, sin otro mueble: sistema de tanque y drenaje",
    () => { S.hidro = { ...fixture(), tramos: [], muebles: [{ id: "wc_tanque", cant: 4 }] }; }, ["CM.hidro.4"]);

  conEstado("CM.hidro.5 (ANSI/ISEA Z358.1-2014 vía OSHA, secundaria) regadera de emergencia: demanda fija fuera de Hunter [fase2:H-195]",
    () => { S.hidro = { ...fixture(), tramos: [], muebles: [{ id: "lavaojos", cant: 1 }] }; }, ["CM.hidro.5"]);

  conEstado("CM.hidro.6 (decisión del dueño H-198; ASTM D2846 CTS hasta 2\") CPVC: los renglones «SIN VERIFICAR» de 2 1/2\" a 4\" se retiran [fase2:H-198]",
    () => { S.hidro = { ...fixture(), material: "cpvc" }; }, ["CM.hidro.6"]);

  conEstado("CM.hidro.7.a (decisión del dueño H-197) ΔT 0 no se sube a 5 K [fase2:H-197]",
    () => { S.hidro = { ...fixture(), tempEntrada: 40, tempSalida: 40 }; }, ["CM.hidro.7.a"]);
  conEstado("CM.hidro.7.b (IPC 2015 §704.1) pendiente capturada 0.2 % con colector de 100 mm: mínima de norma 1/8 in/ft con aviso [fase2:H-197]",
    () => { S.hidro = { ...fixture(), pendiente: 0.2 }; }, ["CM.hidro.7.b"]);

  conEstado("CM.hidro.8 (decisión del dueño rev 2.9.16) tramo sin longitud: pérdida 0 y marcado sinL",
    () => { S.hidro = fixture(); S.hidro.tramos[0].L = 0; }, ["CM.hidro.8"]);

  conEstado("CM.hidro.9 (IPC 2015 E103.3(3) completa, 710.1(1)/(2); ASTM B88 tipo L; Hazen-Williams) funciones y tablas del motor evaluadas directamente",
    () => { S.hidro = fixture(); }, ["CM.hidro.9"]);

  conEstado("CM.hidro.10 (decisión del dueño 15-sep-2026) la CDT usa la altura del edificio capturada",
    () => { S.hidro = { ...fixture(), alturaEdificio: 6 }; }, ["CM.hidro.10"]);

  conEstado("CM.hidro.11 (IPC 2015 Tabla 604.3) la presión requerida es la del mueble que más pide; con 8 m en la toma no alcanza",
    () => { S.hidro = { ...fixture(), presRed: 8, tramos: [], muebles: [{ id: "wc_flux", cant: 1 }, { id: "lavabo", cant: 1 }] }; }, ["CM.hidro.11"]);
}
