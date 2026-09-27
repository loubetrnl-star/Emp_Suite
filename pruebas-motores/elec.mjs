/* ===== CM.elec · casos calculados a mano del motor ELÉCTRICO (Fase 1, rev 2.9.24) =====
   Hoja: parches/casos-a-mano/elec.csv · cálculo independiente: parches/casos-a-mano/elec.calc.mjs
   Norma: NOM-001-SEDE-2012 (texto del DOF en parches/normas-texto/NOM-001-SEDE-2012_DOF_texto.txt; página en cada fila).
   Las expresiones de la hoja se evalúan aquí con ELEC y S de la suite más tres ayudantes propios de este módulo:
     awgIdx(awg)  índice del calibre en la serie 14, 12, 10, 8, 6, 4, 3, 2, 1, 1/0, 2/0, 3/0, 4/0, 250, 300, 350, 400, 500,
                  600, 750 (para comparar calibres como NÚMERO, no como texto);
     sel(o)       selConductor(o) de la suite (casos directos de selección);
     tierraDe(A, mat)  tierraDe de la suite (Tabla 250-122; mat «aluminio» usa la columna de aluminio, H-183).
   Filas «fase2:H-nnn» = valor correcto por norma que hoy la suite NO da; se exigen sólo con CM_FASE2=1.

   PRUEBAS QUE PROTEGEN VALORES INCORRECTOS O NO PRUEBAN (se corrigen en la Fase 2 con su hallazgo, aquí sólo se marcan):
   - (reescrita en H-178, rev 2.9.24) pruebas.mjs 22.4 ya usa las corrientes de la Tabla 430-250; sigue fijando el principal
     como el mayor de dos (225 A del alimentador contra 175 A del ramal) → H-188 (430-63 pide la suma).
   - pruebas.mjs:3698 J.1 · consagra principal = max(alim.ocpd, ocpd del motor mayor) → H-188 (430-63, p. 426: suma).
   - pruebas.mjs:3712 J.2 · sin motores principal = alim.ocpd: no prueba nada que no sea la propia regla → H-188.
   - (retirada, rev 2.9.24) pruebas.mjs:5502 S.29 se había marcado como protectora de H-183/H-177: no lo es. Sus tierras
     (100 A → 8 y 125 A → 6 AWG) son iguales en la NOM y en el NEC, y nunca pasa motor:true (sondas de la Fase 2).
   - pruebas.mjs:777 11.6 · «las hojas se alimentan de los resultados reales»: sólo busca el número del principal como
     texto en el libro; no comprueba ningún cálculo → no prueba (H-188 pasa igual).
   Lista completa y motivo: parches/casos-a-mano/elec.pendientes.md */
export default async function ({ t, G, S, CM, fs }) {
  const filas = CM.casos("elec");
  const ORD = ["14", "12", "10", "8", "6", "4", "3", "2", "1", "1/0", "2/0", "3/0", "4/0", "250", "300", "350", "400", "500", "600", "750"];
  const awgIdx = (a) => ORD.indexOf(String(a));
  const sel = (o) => G("selConductor")(o);
  const tierraDe = (A, mat) => G("tierraDe")(A, mat);
  /* H-178: la tabla de la suite contra el texto del DOF (parches/normas-texto), renglón por renglón. Devuelve cuántas celdas
     difieren y cuántas se compararon. La única diferencia admitida es la errata declarada (44 A en 10 hp / 575 V → null). */
  const DOF = fs.readFileSync("parches/normas-texto/NOM-001-SEDE-2012_DOF_texto.txt", "utf8");
  const FRAC = { "⅙": 1 / 6, "¼": 0.25, "⅓": 1 / 3, "½": 0.5, "¾": 0.75 };
  const hpDe = (s) => { s = String(s || "").trim(); if (FRAC[s] != null) return FRAC[s]; const m = s.match(/^(\d+)\s*½$/); if (m) return +m[1] + 0.5; return /^\d+(\.\d+)?$/.test(s) ? +s : NaN; };
  const dof = (tabla) => {
    const T = G(tabla === "430-250" ? "T430_250" : "T430_248");
    const ini = DOF.indexOf(`Tabla ${tabla} Corriente a plena carga`), fin = DOF.indexOf("Tabla 430-2", ini + 40);
    if (ini < 0) throw new Error(`el texto del DOF no trae la Tabla ${tabla}`);
    /* Una línea por celda; la celda vacía del DOF es una línea en blanco (250 hp a 200/208/230 V) y vale como «—». */
    const tok = DOF.slice(ini, fin < 0 ? undefined : fin).split(/\r?\n/).map((s) => s.trim()).filter((s) => !/^=+PAG/.test(s));
    let dif = 0, celdas = 0;
    for (const f of T.filas) {
      const i = tok.findIndex((s, j) => /^\d+(\.\d+)?$/.test(s) && +s === f[0] && Math.abs(hpDe(tok[j + 1]) - f[1]) < 1e-9);
      if (i < 0) { dif += 2 + T.cols.length; continue; }
      celdas += 2;
      T.cols.forEach((col, k) => {
        const s = tok[i + 2 + k], v = s === "—" || s === "" ? null : +s;
        const errata = tabla === "430-250" && f[1] === 10 && col === 575 && v === 44 && f[2][k] === null;
        if (!(v === f[2][k] || errata)) dif++;
        celdas++;
      });
    }
    return { dif, celdas };
  };
  const evalua = (expr) => new Function("ELEC", "S", "awgIdx", "sel", "tierraDe", "dof", `return (${expr});`)(G("ELEC"), S, awgIdx, sel, tierraDe, dof);
  const comprobar = (prefijo) => {
    const grupo = filas.filter((f) => f.id === prefijo || f.id.startsWith(prefijo + "."));
    if (!grupo.length) throw new Error(`la hoja elec.csv no trae filas ${prefijo}`);
    grupo.forEach((f) => { if (CM.esFase2(f) && !CM.exigirFase2) return; CM.comprobar(f, evalua(f.expresion)); });
  };
  const dc = (nombre) => G("defaultCarga")(nombre);
  /* Arma S.elec como las pruebas 22.4/J.1 (sólo S.elec: desde H-268 el eléctrico es autónomo y el resto del estado nunca
     interviene en computeElec; las cargas de otros motores entran sólo como propuesta aceptada, que estos casos no aceptan). */
  const conEstado = (elec, fn) => {
    const guardado = JSON.stringify(S.elec);
    try { S.elec = { ...G("defaultElec")(), ...elec }; G("recompute")(); fn(); }
    finally { S.elec = JSON.parse(guardado); G("recompute")(); }
  };
  /* H-179: defaultElec() ya no supone distancia al tablero ni transformador; el caso los captura (entradas de la hoja). */
  const FIXTURE = { trafoKVA: 300, Ltablero: 30, trafoZ: 4, fpObjetivo: .95, cargas: [
    { ...dc("Compresor de proceso"), tipo: "motor", kW: 15, V: 220, ph: 3, cant: 1, L: 30, fp: .85 },
    { ...dc("Alumbrado"), tipo: "alumbrado", kW: 9.5, V: 127, ph: 1, cant: 1, L: 40, fp: .95 },
  ] };

  t("CM.elec.1 (H-178) (NOM-001-SEDE-2012 430-6(a)(1) p. 405, Tabla 430-250 p. 443, Tablas 310-15(b)(16)/(2)(a)/(3)(a) p. 186-190, Tabla 430-52 p. 422, Tabla 250-122 p. 151, Cap. 10 Tablas 1/4/5) motor 15 kW 220 V 3F a 30 m, 40 °C: 25 hp → 68 A, Idis 85, 3 AWG, 1.28 %, 175 A, tierra 6, EMT 1¼\" (antes 46.31 A, 4 AWG, 125 A)",
    () => conEstado(FIXTURE, () => comprobar("CM.elec.1")));
  t("CM.elec.2 (NOM-001-SEDE-2012 210-19(a)(1) p. 52, Tabla 9 p. 1011, Tabla 250-122 p. 151, Cap. 10 Tablas 4/5) alumbrado 9.5 kW 127 V 1F fp 0.95 a 40 m: 78.74 A, 1 AWG por caída 2.60 %, 100 A, tierra 8, EMT 1¼\"; fase2:H-182 tierra 6 (250-122(b) p. 150), fase2:H-190 columna de acero",
    () => conEstado(FIXTURE, () => comprobar("CM.elec.2")));
  t("CM.elec.3 (H-178) (NOM-001-SEDE-2012 430-24 p. 415, 215-2(a)(1) p. 61, Tabla 310-15(b)(16) p. 190, Cap. 10 Tabla 5 p. 1006) alimentador del proyecto de regresión con el motor por la Tabla 430-250: 42.389 kVA, 111.24 A, 1/0, 125 A, principal 175, falla 19.68 kA → 22 kA; fase2:H-188 principal 225 A (430-63 p. 426)",
    () => conEstado(FIXTURE, () => comprobar("CM.elec.3")));
  t("CM.elec.4 (H-183) (NOM-001-SEDE-2012 Tabla 250-122 p. 151) tierraDe directa: 100 → 8, 200 → 6, 300 → 4, 400 → 2 AWG (antes 3, NEC), 1000 → 2/0, 2500 → 350, 5000 → 700, 6000 → 800 kcmil; aluminio 200 → 4, 400 → 1, 2000 → 400 kcmil, ≤ 100 A sólo cobre",
    () => comprobar("CM.elec.4"));
  t("CM.elec.5 (H-177) (NOM-001-SEDE-2012 440-4(b) p. 445, 440-22(a)/(c) p. 449-450, 440-35 p. 450) equipo con motocompresor y placa: conductor por la MCA y protección = MOP (40VMA-240 90 A, antes 150; 40MBC-24 15 A, antes 25; condensadora MCA 50/MOP 80 → 6 AWG, 80 A; MOP 42 → 40 A; placa MCA 40 → 8 AWG; MOP 10 → fusible 10 A; MOP 32 → 32 A; MCA/MOP estimados no bajan del 125 %)",
    () => conEstado({ trafoKVA: 300, cargas: [
      { ...dc("40VMA-240 · Planta"), tipo: "motor", kW: 19, V: 220, ph: 3, cant: 1, L: 45, fp: .85, mca: 62.4, mop: 90, modelo: "40VMA-240" },
      { ...dc("40MBC-24 · Terminal"), tipo: "motor", kW: 1.9, V: 220, ph: 1, cant: 1, L: 45, fp: .9, mca: 10.3, mop: 15, modelo: "40MBC-24" },
      { ...dc("Condensadora con placa"), tipo: "motor", kW: 10, V: 220, ph: 3, cant: 1, L: 20, fp: .85, mca: 50, mop: 80 },
      { ...dc("Condensadora MOP 42"), tipo: "motor", kW: 5, V: 220, ph: 3, cant: 1, L: 15, fp: .85, mca: 24, mop: 42 },
      { ...dc("Condensadora placa MCA 40"), tipo: "motor", kW: 12, V: 220, ph: 3, cant: 1, L: 20, fp: .85, mca: 40, mop: 60 },
      { ...dc("Mini split MOP 10"), tipo: "motor", kW: 1, V: 220, ph: 1, cant: 1, L: 10, fp: .9, mca: 6, mop: 10 },
      { ...dc("Equipo IEC MOP 32"), tipo: "motor", kW: 7, V: 220, ph: 1, cant: 1, L: 10, fp: .9, mca: 31, mop: 32 },
      { ...dc("40VMA-192 estimado"), tipo: "motor", kW: 15.2, V: 220, ph: 3, cant: 1, L: 45, fp: .85, mca: 49.8, mop: 70, modelo: "40VMA-192", placaEst: { mca: 49.8, mop: 70 } },
    ] }, () => comprobar("CM.elec.5")));
  t("CM.elec.6 (NOM-001-SEDE-2012 Cap. 10 Tabla 5 p. 1006-1007, Tabla 1 p. 1001, Tabla 4 p. 1002) 100 A 220 V 3F 40 °C: THW-LS 620.44 mm² → EMT 2\" y THHN 511.51 mm² → EMT 1½\"; 1/0 AWG, 125 A",
    () => comprobar("CM.elec.6"));
  t("CM.elec.7 (NOM-001-SEDE-2012 Tabla 310-15(b)(16) p. 190 columna aluminio, Tabla 310-106(a) p. 216, Tabla 250-122 p. 151) aluminio 100 A → 2/0 (135 A), tierra de aluminio 4 AWG (H-183); fase2:H-186 aluminio 15 A → mínimo 6 AWG (hoy 12 AWG)",
    () => comprobar("CM.elec.7"));
  t("CM.elec.8 (NOM-001-SEDE-2012 310-10(h) p. 182, 240-4(c) p. 102, 240-6(a) p. 104) 660 A 440 V: 2 × 750 kcmil = 836 A; fase2:H-184 protección 1000 A > 836 A; fase2:H-185 1900 A → 2500 A (hoy la lista se corta en 2000)",
    () => comprobar("CM.elec.8"));
  t("CM.elec.9 (NOM-001-SEDE-2012 Tabla 220-44 p. 69) contactos 30 kVA: 10 al 100 % + 20 al 50 % = 20 kVA de demanda",
    () => conEstado({ cargas: [{ ...dc("Contactos"), tipo: "contactos", kW: 27, V: 220, ph: 3, cant: 1, L: 10, fp: .9 }] }, () => comprobar("CM.elec.9")));
  t("CM.elec.10 (NOM-001-SEDE-2012 240-4(d) p. 102, 240-4(b) p. 102) conductor pequeño: 12 AWG topa en 20 A, 10 AWG en 30 A; 8 AWG a 44 A con 45 A por redondeo ≤ 800 A",
    () => comprobar("CM.elec.10"));
  t("CM.elec.11 (NOM-001-SEDE-2012 Tabla 310-15(b)(2)(a) p. 186, Tabla 310-15(b)(3)(a) p. 187) factores: 6 portadores 0.80 (67.2 A → 1 AWG, 91.52 A), 9 → 0.70, 50 °C → 0.75; fase2:H-190 65 °C → 0.47 (hoy 0.33); fase2:H-193 20 °C → 1.11 (hoy 1.00)",
    () => comprobar("CM.elec.11"));
  t("CM.elec.12 (bus infinito, memoria; 110-9 p. 29) falla: 2500 kVA Z 5.75 % → 114.1 kA; fase2:H-185 kAIC ≥ falla (hoy tope 100 kA); fase2:H-191 1F3H-220 75 kVA Z 2 % → 17.05 kA (hoy 9.84 con √3)",
    () => {
      conEstado({ sistema: "1F3H-220", trafoKVA: 75, trafoZ: 2, cargas: [{ ...dc("Carga 1F"), tipo: "resistiva", kW: 10, V: 220, ph: 1, cant: 1, L: 10, fp: 1 }] }, () => comprobar("CM.elec.12.a"));
      conEstado({ trafoKVA: 2500, trafoZ: 5.75, cargas: [{ ...dc("Proceso"), tipo: "proceso", kW: 50, V: 220, ph: 3, cant: 1, L: 20, fp: .9 }] }, () => { comprobar("CM.elec.12.b"); comprobar("CM.elec.12.c"); });
    });
  t("CM.elec.13 (H-178) (NOM-001-SEDE-2012 Tabla 430-250 p. 443, Cap. 10 Tabla 1 nota (3) p. 1001, Tabla 5 p. 1006, Tabla 4 p. 1002) 3F3H-440 motor 22 kW: 30 hp → 40 A a 460 V, 6 AWG, 100 A (antes 33.96 A, 8 AWG, 90 A); fase2:H-191 sin neutro 168.71 mm² (13.e retirada: con 6 AWG el tubo es EMT 1\" con o sin neutro)",
    () => conEstado({ sistema: "3F3H-440", trafoKVA: 300, cargas: [{ ...dc("Motor 440"), tipo: "motor", kW: 22, V: 440, ph: 3, cant: 1, L: 20, fp: .85 }] }, () => comprobar("CM.elec.13")));
  t("CM.elec.14 (H-178) (NOM-001-SEDE-2012 430-6(a)(1) p. 405, Tablas 430-250 p. 443 y 430-248 p. 441-442; decisión del dueño 2) corriente de motor de uso general por la tabla: 11 kW → 15 hp 42 A (6 AWG, 110 A); hp de placa 20 → 54 A; 7.5 kW → 10 hp; hp 2.5 → 3 hp; 1F 127 V → columna de 127 V; 1F 220 V; 440 V → columna de 460 V; 8 kW → 15 hp (inmediato superior); kVA 1F = V·I; columnas 200/208/575/2300 V y 1F 115/208 V; celda «—» a 2300 V sin saltar; hp 0.17 = 1/6",
    () => conEstado({ trafoKVA: 300, trafoZ: 4, Ltablero: 30, cargas: [
      { ...dc("Motor 11 kW"), tipo: "motor", kW: 11, V: 220, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 15 kW placa 20 hp"), tipo: "motor", kW: 15, hp: 20, V: 220, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 7.5 kW"), tipo: "motor", kW: 7.5, V: 220, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Bomba 2.5 hp"), tipo: "motor", kW: 1.87, hp: 2.5, V: 220, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 1F 127 V"), tipo: "motor", kW: 0.75, V: 127, ph: 1, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 1F 220 V"), tipo: "motor", kW: 1.5, V: 220, ph: 1, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 440 V"), tipo: "motor", kW: 15, V: 440, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 8 kW"), tipo: "motor", kW: 8, V: 220, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 208 V"), tipo: "motor", kW: 11, V: 208, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 575 V"), tipo: "motor", kW: 11, V: 575, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 1F 115 V"), tipo: "motor", kW: 0.75, V: 115, ph: 1, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 1F 208 V"), tipo: "motor", kW: 1.5, V: 208, ph: 1, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 2300 V 50 kW"), tipo: "motor", kW: 50, V: 2300, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 200 V"), tipo: "motor", kW: 11, V: 200, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 2300 V 20 kW"), tipo: "motor", kW: 20, V: 2300, ph: 3, cant: 1, L: 20, fp: .85 },
      { ...dc("Motor 1F 1/6 hp"), tipo: "motor", kW: 0.12, hp: 0.17, V: 127, ph: 1, cant: 1, L: 20, fp: .85 },
    ] }, () => comprobar("CM.elec.14")));
  t("CM.elec.15 (H-178) (NOM-001-SEDE-2012 Tabla 430-250 p. 442-443 y Tabla 430-248 p. 441-442) las dos tablas de la suite, celda por celda contra el texto del DOF: 243 y 72 celdas, ninguna difiere (salvo la errata declarada de 10 hp / 575 V)",
    () => comprobar("CM.elec.15"));
}
