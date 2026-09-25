/* ===== CM.soporte · casos calculados a mano del motor de SOPORTERÍA (Fase 1, rev 2.9.24) =====
   Hoja: parches/casos-a-mano/soporte.csv · cálculo independiente: parches/casos-a-mano/soporte.calc.mjs.
   Se comparan NÚMEROS con tolerancia (CM.comprobar). Filas «fase2:H-nnn» = valor correcto por norma que hoy la suite
   NO da; sólo se exigen con CM_FASE2=1. Cada prueba arma su propio estado y lo restaura en finally.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS (se corrigen en la Fase 2 con su hallazgo; aquí NO se tocan):
   - pruebas.mjs:3793 L.2 fija cobre ½" y ¾" a 1.8 m y exige que ½"–1¼" den «la misma cifra que el motor» (1.8 m).
     ANSI/MSS SP-58-2018 (tabla PHD) da 5 ft = 1.52 m en ½" y ¾"; el mínimo MSS/IPC (decisión 4 del dueño) es 1.52 m
     → H-229. Es la ÚNICA prueba que mata el mutante soporte.m05 (cobre a MSS), es decir, lo mata por la razón equivocada.
   - pruebas.mjs:4326 Q.3 exige que a más altura de trabajo salgan más ML de varilla: consagra «altura de colgado =
     altura de trabajo» sin captura (7.2 m por varilla en el proyecto de regresión, 633.6 ML) → H-225.
   - pruebas.mjs:5898 R.1 (golden por motor) consagra, con la misma cifra total (385,760), el colgado = trabajo (H-225),
     el anclaje M10 con SDS = 1.0 supuesto (H-226), una sola varilla por soporte de ducto rectangular (H-227) y las
     bases de equipo en vivo (3) que el modo gobernado baja a 2 (H-231). Detecta cambios, no errores.
   - pruebas.mjs:3232 22.8 no protege un error de soportería, pero fija los diámetros que entrega hidro (52.5/35.05 mm
     acero, 63/43.59 CPVC…) como si fueran del motor de soportería: si hidro los mueve en su Fase 2, 22.8 truena aquí.
   Lo que NO se pudo cubrir y por qué: parches/casos-a-mano/soporte.pendientes.md. */
export default async function ({ t, eq, cerca, G, S, CM, REG_PROY }) {
  const filas = CM.casos("soporte");
  const de = (pref) => filas.filter((f) => f.id === pref || f.id.startsWith(pref + "."));
  const comprobar = (pref) => {
    /* Revisa TODAS las filas del grupo y reporta juntas las que fallan (no se detiene en la primera). */
    const lista = de(pref);
    if (!lista.length) throw new Error(`no hay filas ${pref} en parches/casos-a-mano/soporte.csv`);
    const fallas = [];
    lista.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; try { CM.comprobar(f); } catch (e) { fallas.push(e.message); } });
    if (fallas.length) throw new Error(fallas.join("\n   "));
  };
  /* Contexto unitario de SoporteCalc: el mismo que arma computeSoporte con defaultSoporte() y una zona de 6 m
     (SDS 1.0 DECLARADO como entrada explícita del caso, no como supuesto; losa f'c 250 kg/cm²; FS 1.5 = H-49). */
  const CTX = `{ sismo: { activo: true, arriostrar: true, SDS: 1.0, h: 6 }, estructura: { tipo: "losa_concreto", fc_mpa: 250 * 0.0980665 }, T_instalacion_C: 20, factor_seguridad: 1.5 }`;
  const unitario = (nombre, armar, prefs) => t(nombre, () => {
    /* Las pruebas unitarias llaman al motor directo (calcularTramo, revisarTrapecio, revisarAnclaje, fuerzaSismica,
       espSoporte, seleccionarVarilla) y NO tocan S; dejan sus resultados en window.CM_SOP para que la expresión de la
       hoja sea evaluable en la suite tal cual (CM_SOP.A.peso.total, …). */
    try { G(`window.CM_SOP = window.CM_SOP || {}; CM_SOP.ctx = ${CTX};`); G(armar); prefs.forEach(comprobar); }
    finally { G("delete window.CM_SOP"); }
  });

  unitario("CM.soporte.1 (ASME B36.10 · MSS SP-58-2018 vía PHD · ASCE 7-16 §13.3.1 · ACI 318-19 cap. 17) caso A: acero ced. 40 2\" con agua, 30 m, z = h = 6 m, losa f'c 250",
    `CM_SOP.A = calcularTramo({ id: "A", disciplina: "hidrosanitario", tipo: "tuberia", material: "acero", dn: '2"', cedula: "ced40", contenido: "agua", longitud_m: 30, altura_montaje_m: 6 }, CM_SOP.ctx);`,
    ["CM.soporte.1"]);
  unitario("CM.soporte.2/3 (ASTM B88 tipo L · MSS SP-58-2018 vía PHD · IPC 2009 T308.5 vía MCP) casos B y B′: cobre 1\" y ¾\" con agua, 20 m",
    `CM_SOP.B = calcularTramo({ id: "B", disciplina: "hidrosanitario", tipo: "tuberia", material: "cobre", dn: '1"', cedula: "L", contenido: "agua", longitud_m: 20, altura_montaje_m: 6 }, CM_SOP.ctx);
     CM_SOP.B2 = calcularTramo({ id: "B2", disciplina: "hidrosanitario", tipo: "tuberia", material: "cobre", dn: '3/4"', cedula: "L", contenido: "agua", longitud_m: 20, altura_montaje_m: 6 }, CM_SOP.ctx);`,
    ["CM.soporte.2", "CM.soporte.3"]);
  unitario("CM.soporte.4 (mínimo de MSS SP-58-2018 vía PHD e IPC 2009 T308.5 vía MCP, decisión 4 del dueño) tabla de claros por material y diámetro (espSoporte)",
    `CM_SOP.esp = espSoporte;`, ["CM.soporte.4"]);
  unitario("CM.soporte.5 (SMACNA · lámina galvanizada cal. 20 · criterio de la casa ×1.20) caso C: ducto rectangular TR-1 1200×700 mm, 18 m",
    `CM_SOP.C = calcularTramo({ id: "C", disciplina: "hvac", tipo: "ducto_rect", descripcion: "TR-1", longitud_m: 18, ancho_mm: 1200, alto_mm: 700, calibre: 20, altura_montaje_m: 6 }, CM_SOP.ctx);`,
    ["CM.soporte.5"]);
  unitario("CM.soporte.6 (NFPA 13 tope de 15 ft y varilla mínima por diámetro, de memoria) red contra incendio acero 6\", 30 m: el tope gobierna sobre MSS",
    `CM_SOP.F = calcularTramo({ id: "F", disciplina: "contra_incendio", tipo: "tuberia", material: "acero", dn: '6"', cedula: "ced40", contenido: "agua", longitud_m: 30, altura_montaje_m: 6 }, CM_SOP.ctx);
     CM_SOP.F.varillaIdx = C_SOP.VARILLA.findIndex((v) => v.id === (CM_SOP.F.varilla || {}).id);`,
    ["CM.soporte.6"]);
  unitario("CM.soporte.8 (estática elemental M = PL/4, δ = PL³/48EI · ASD Fb = 0.6 Fy · L/240 criterio de la casa) trapecio P1000, luz 600 mm, 200 kgf al centro",
    `CM_SOP.T = revisarTrapecio({ perfil_id: "P1000", luz_mm: 600, carga_kgf: 200, n_lineas: 1 });`, ["CM.soporte.8"]);
  unitario("CM.soporte.9 (ACI 318-19 cap. 17, de memoria) anclaje M10 con τcr = 20 MPa: gobierna el desprendimiento del concreto, no la adherencia",
    `CM_SOP.K = revisarAnclaje({ anclaje_id: "M10", n_anclajes: 1, tension_kgf: 100, cortante_kgf: 100, fc_mpa: 250 * 0.0980665, tau_cr_mpa: 20 });`, ["CM.soporte.9"]);
  unitario("CM.soporte.10 (ASCE 7-16 ec. 13.3-1/-2/-3, de memoria) Fp con los topes: piso 0.3·SDS·Ip·Wp con z = 0 y techo 1.6·SDS·Ip·Wp con Rp = 1",
    `CM_SOP.Fpiso = fuerzaSismica({ Wp_kgf: 1000, SDS: 1.0, Ip: 1.0, ap: 2.5, Rp: 9.0, z: 0, h: 6 });
     CM_SOP.Ftecho = fuerzaSismica({ Wp_kgf: 1000, SDS: 1.0, Ip: 1.0, ap: 2.5, Rp: 1.0, z: 6, h: 6 });`, ["CM.soporte.10"]);
  unitario("CM.soporte.12 (MSS SP-58 Tabla 3 áreas de raíz · 62.05 MPa admisible) selección de varilla por carga: 716 kgf pide 5/8\"",
    `CM_SOP.V = seleccionarVarilla(716, '3/8"'); CM_SOP.V.idx = C_SOP.VARILLA.findIndex((v) => v.id === CM_SOP.V.id);`, ["CM.soporte.12"]);

  const MUEBLES = [{ id: "wc_flux", cant: 4 }, { id: "ming_flux", cant: 2 }, { id: "lavabo", cant: 4 }, { id: "fregadero", cant: 1 }, { id: "manguera", cant: 2 }];
  const soloHidro = (material) => {
    /* Arranque en ceros: sólo la red hidráulica entrega tramos; ductos, incendio, aire y equipos vacíos. */
    S.hidro = { ...G("defaultHidro")(), material, muebles: MUEBLES,
      tramos: [{ ...G("defaultTramoAgua")("AF-GENERAL"), um: 72, L: 25, alt: 3 }, { ...G("defaultTramoAgua")("AF-RAMAL BAÑOS"), um: 20, L: 18, alt: 3 }] };
    S.fuego = G("defaultFuego")(); S.aire = G("defaultAire")(); S.duct.segments = []; S.quote.items = [];
    S.soporte = G("defaultSoporte")();
    G("recompute")();
    return (G("SOPORTE").porTuberia || []).find((x) => x.etiqueta === "Hidráulica y sanitario");
  };
  t("CM.soporte.7 (IPC 2009 T308.5 vía MCP · criterio de la casa peso termoplástico) hidráulica CPVC: dos tramos de 25 y 18 m (43.59 y 43.59 mm entregados por hidro; la general fuera de catálogo por H-198)", () => {
    const guardado = JSON.stringify(S);
    try {
      const h = soloHidro("cpvc");
      if (!h || h.fam !== "plastico") throw new Error("el caso no aísla lo que se quiere probar: debe agrupar como termoplástico");
      eq(JSON.stringify(h.det.map((d) => d.d)), JSON.stringify([43.59, 43.59]), "diámetros que entrega hidro (entrada del caso; H-198: la general llega con el tope de 2\" CTS, antes 63 mm):");
      eq(JSON.stringify(h.det.map((d) => d.L)), JSON.stringify([25, 18]), "longitudes capturadas:");
      cerca(G("SOPORTE").mTub, 43, 0.01, "sólo la red hidráulica aporta metros de tubería:"); eq(G("SOPORTE").mDucto, 0, "sin ducto:");
      comprobar("CM.soporte.7");
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });
  t("CM.soporte.15 (MSS SP-58-2018 vía PHD · IPC 2009 T308.5) hidráulica en acero ced. 40 por el estado: 2\" y 1¼\" (52.5 y 35.05 mm entregados por hidro), 25 y 18 m", () => {
    const guardado = JSON.stringify(S);
    try {
      const h = soloHidro("acero");
      if (!h || h.fam !== "acero") throw new Error("el caso no aísla lo que se quiere probar: debe agrupar como acero");
      eq(JSON.stringify(h.det.map((d) => d.d)), JSON.stringify([52.5, 35.05]), "diámetros que entrega hidro (entrada del caso):");
      cerca(G("SOPORTE").mTub, 43, 0.01, "sólo la red hidráulica aporta metros de tubería:"); eq(G("SOPORTE").mDucto, 0, "sin ducto:");
      comprobar("CM.soporte.15");
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });
  t("CM.soporte.11 (proyecto fijo de regresión; claros MSS/IPC/NFPA/SMACNA; precios de referencia interna como entrada) 88 soportes, 12 + 19 riostras, 3 bases, tijera a 7.2 m, 385,760 MXN", () => {
    const guardado = JSON.stringify(S);
    try {
      G("importarRespaldo")(REG_PROY); S.tab = "tablero"; G("KZ_CACHE").key = null; G("VZ_CACHE").key = null; G("recompute")();
      const SOP = G("SOPORTE");
      /* Entradas de otros motores (no se recalculan aquí): 45 m de ducto en 3 tramos y 145 m de tubería en 5. */
      cerca(SOP.mDucto, 45, 0.01, "metros de ducto que entregan los ductos:"); cerca(SOP.mTub, 145, 0.01, "metros de tubería que entregan hidro, incendio y aire:");
      eq(SOP.sopcalc.tramos.length, 8, "tramos que entran a SoporteCalc:");
      /* Cuatro pasos sobre el mismo proyecto; cada uno se evalúa aunque el anterior falle (con CM_FASE2=1 fallan
         hoy 11c y 11d, y no deben tapar al siguiente). */
      const fallas = [];
      const paso = (fn) => { try { fn(); } catch (e) { fallas.push(e.message); } };
      paso(() => comprobar("CM.soporte.11"));
      /* 11b · altura de colgado CAPTURADA (1 m): el camino que sí está resuelto. */
      paso(() => { S.soporte.alturaColgadoM = 1; G("recompute")(); comprobar("CM.soporte.11b"); });
      /* 11c · renta de elevación con 0 meses capturados (H-232). */
      paso(() => { S.soporte.alturaColgadoM = 0; S.soporte.mesesElevacion = 0; G("recompute")(); comprobar("CM.soporte.11c"); });
      /* 11d · modo gobernado: al aceptar la instantánea las bases de equipo deben seguir siendo 3 (H-231). */
      paso(() => {
        S.soporte.mesesElevacion = 3; G("recompute")();
        eq(G("SOPORTE").nEquipos, 3, "en vivo: 2 equipos cotizados + 1 compresor:");
        G("propAceptar")("motores>soporte"); G("recompute")();
        if (!S.soporte.snap) throw new Error("el caso no aísla lo que se quiere probar: no quedó instantánea aceptada");
        comprobar("CM.soporte.11d");
      });
      if (fallas.length) throw new Error(fallas.join("\n   "));
    } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
  });
}
