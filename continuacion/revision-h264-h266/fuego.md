# Revisión adversarial de H-264…H-266 (sobre 63a2794) · fuego

## C1 · CONFIRMADO por refutador · alta · lente reglas
**Contra incendio sin altura capturada dimensiona la bomba con 1 m de estática y la manda a la propuesta; si la altura viene ausente, supone 6 m**
Dónde: index.html:11005

Escenario: Proyecto nuevo, ord2, área 500 m², cabezal 30 m, montante 12 m, altura sin capturar (0). Sale estática 1 m y CDT 33.1 m, y en porCotizar aparece «Bomba contra incendio… 661 gpm (2,500 L/min) a 33.1 m, 30 HP (NFPA 20; dimensionada por el motor)» sin ningún pendiente en QUOTE. Con 6 m capturados: 39.1 m y 35 HP. Con fuego.altura null (JSON importado), num(F.altura, 6) usa 6 m: estática 7 m y la memoria dice «6 m capturados en esta pestaña», mientras el aviso afirma que sólo se usó el +1 m.

Razón del refutador: No se pudo refutar: se reproduce en 63a2794. Los scripts están en /home/user/wt-lectura/x15/rev/verif-reglas/: fuego-altura.mjs, fuego-altura-import.mjs, fuego-altura-sem2.mjs, fuego-h210.mjs y fuego-elec.mjs.

1) Caso principal. Proyecto nuevo con defaultFuego (altura: 0, index.html:10943), ord2, 500 m², cabezal 30 m, montante 12 m, altura sin capturar y permiso fuego>quote:
- FUEGO: estatica = 1, mcaTotal = 33.11, presBomba = 33.11, hpBomba = 30.
- QUOTE.porCotizar trae «Bomba contra incendio listada con controlador: 661 gpm (2,500 L/min) a 33.1 m, 30 HP (NFPA 20; dimensionada por el motor)» (index.html:8853).
- QUOTE.pendientes no trae ningún renglón de fuego.
- Sólo sale un aviso warn (11006-11007). El semáforo de contra incendio queda «datos» (Con datos), porque sólo los err lo pasan a «incompleta» (18757).
- La propuesta al eléctrico ofrece «Bomba contra incendio · 30 HP», 20.82 kW (10231-10233).
- Con altura 6 m capturada: 39.1 m y 35 HP.
- Desde la pantalla la altura no puede quedar nula: el campo numérico guarda parseFloat||0 (23304). Por eso 0 es el estado normal.

2) Altura null o "" en un JSON abierto con sanearEstado:
- El spread de 24015 la conserva y num(null,6) da 6 (3258-3261). Resultado: estática 7 m, 39.1 m y 35 HP.
- La memoria dice «6 m capturados en esta pestaña» (11044), el PDF imprime 6 m (2583) y el aviso afirma «se calcula sólo con el +1 m» (11006 usa num(F.altura,0)). Las tres cosas se contradicen.
- Si la clave falta en el JSON, entra como 0 (valor por omisión). Así que el camino de 6 m exige null o "" explícitos: alcance menor. Aun así la contradicción la introdujo H-264: agregó el aviso con omisión 0 y reescribió la memoria a «capturados».

3) Ningún commit posterior lo corrigió: git diff fcda936..63a2794 no toca computeFuego ni bombaFuego.

4) No es falso positivo. El propio repositorio lo tiene registrado como H-210:
- AUDITORIA.md:254, severidad A: «Con área capturada y cabezal/montante/altura en 0 (el arranque normal) da 16.3 m y 15 HP sin aviso y con semáforo "datos"». Corrección registrada: «Error, pendiente y semáforo "incompleta"».
- Las filas fase2 CM.fuego.6.F10–F12 (parches/casos-a-mano/fuego.csv:121-123) siguen fallando en 63a2794: hpBomba 15 (esperado 0), aviso err 0 (esperado 1), incompleta 0 (esperado 1).
- H-264 (5f8dfc4) lo dejó a sabiendas («warn; no cambia cifras»). Al quitar la herencia, la altura 0 pasó a ser el arranque de todo proyecto.
- En el mismo lote, soportería sin altura de trabajo sí deja la renta pendiente en la cotización (8870-8871), y civil deja el muro «pendiente».

Matiz: no es un ID nuevo. Es H-210 (abierto, fuera de PLAN-CRITICOS), agravado por H-264, más la contradicción null → 6 m que sí es nueva de H-264.

Corrección propuesta: Cerrar H-210 (motor fuego) en un commit «H-210 · fuego · sin altura al rociador más alto no se dimensiona la bomba: presión, CDT y HP pendientes; sin 6 m por omisión». La norma aplicable es la regla 6 de CLAUDE.md y la decisión del dueño del 27-sep-2026: se calcula sólo con lo capturado.

1) computeFuego (index.html:11005-11007):
   const hAlt = Math.max(0, num(F.altura, 0)); const alturaPendiente = !sinArea && !(hAlt > 0);
   Si alturaPendiente:
   - estatica, mcaTotal, barTotal, presBomba, kWbomba y hpBomba quedan en 0 (o null) y no se evalúa `alcanza`.
   - El aviso pasa a lvl "err": «altura al rociador más alto sin capturar: presión en la base, CDT y bomba quedan pendientes (no se supone ninguna)».
   - La memoria dice «Estática: pendiente de altura» en lugar de «0 m capturados».
   - El resultado devuelve alturaPendiente.
   qTotal, rociadores y reserva no dependen de la altura y se quedan.

2) Quitar el 6 por omisión: num(F.altura, 6) → num(F.altura, 0) en 11005, 11044 y 11054, y en el PDF (2583). Donde no hay altura el PDF dice «pendiente de captura», con L(es,en) si llega a la propuesta.

3) Dependencias para el integrador, registradas como en H-266:
   - quote (8851-8854): con FUEGO.alturaPendiente, en vez del renglón porCotizar con m y HP, se agrega pendientes.push({ mot: "fuego", desc: "Bomba contra incendio", descEn: "Fire pump", motivo: "pendiente de altura al rociador más alto (sin captura no se supone)", motivoEn: "highest-sprinkler height pending (not assumed without capture)" }). La reserva sigue «Por cotizar».
   - elec (10231): no se ofrece «fuego-1». Con kWbomba en 0 ya lo filtra.
   - Tablero (19211): «Bomba: pendiente».

4) Mueve números, así que en el mismo commit:
   - MOTOR_VER.fuego 4 → 5, MOTOR_CAMBIOS.fuego, CHANGELOG-motores.md y fuego.pendientes.md.
   - node parches/regresion-motores/genera.mjs. El proyecto fijo captura 6 m: sólo cambia la versión.
   - CM.fuego.6.F10–F12 pasan de fase2 a vigentes. Si las longitudes se dejan para otro commit, se parten: altura ahora y cabezal/montante en 0 como fila F aparte.

5) Antes → después:
   - ord2, 500 m², 30 + 12 m, sin altura: «a 33.1 m, 30 HP (dimensionada por el motor)», semáforo «datos» → bomba «pendiente de altura», aviso err, semáforo «incompleta».
   - JSON con altura null: 39.1 m y 35 HP con «6 m capturados» → pendiente.

Prueba sugerida: Se agrega en pruebas.mjs después de S.154 (la última en 63a2794):

t("S.155 (H-210) contra incendio sin altura al rociador más alto capturada no dimensiona la bomba: presión, CDT y HP quedan pendientes, la cotización lo dice y no hay 6 m por omisión (regla 6)", () => {
  const guardado = JSON.stringify(S);
  try {
    G("reemplazarEstado")(G("defaultState")()); S.meta.name = "S.155";
    Object.keys(G("LINKS")).forEach((k) => { S.perms[k] = { ts: 1, via: "S.155" }; });
    S.fuego = { ...G("defaultFuego")(), riesgo: "ord2", area: 500, Lramal: 30, Lmontante: 12 };   // altura sin capturar (0)
    G("recompute")();
    const b = G("QUOTE").porCotizar.find((p) => p.clave === "bombaFuego");
    if (b && /HP/.test(b.desc)) throw new Error(`sin altura la bomba no se dimensiona: salió «${b.desc}»`);
    if (!G("QUOTE").pendientes.some((p) => p.mot === "fuego" && /altura/.test(p.motivo))) throw new Error("la bomba debe quedar pendiente de altura en la cotización");
    if (!G("FUEGO").avisos.some((a) => a.lvl === "err" && /altura/.test(a.msg))) throw new Error("sin altura el aviso es error");
    eq((G("semaforoSuite")().find((x) => x.id === "fuego") || {}).nivel, "incompleta", "semáforo de contra incendio:");
    G("reemplazarEstado")({ ...JSON.parse(JSON.stringify(S)), fuego: { ...S.fuego, altura: null } }); G("recompute")();
    if (G("FUEGO").memo.some((m) => /6 m capturados/.test(m))) throw new Error("una altura nula se leyó como 6 m capturados");
    S.fuego.altura = 6; G("recompute")();
    eq(G("FUEGO").estatica, 7, "con la altura capturada la estática vuelve (6 + 1):");
    contiene(G("QUOTE").porCotizar.find((p) => p.clave === "bombaFuego").desc, "39.1 m", "bomba con la altura capturada:");
  } finally { G("reemplazarEstado")(JSON.parse(guardado)); G("recompute")(); }
});

Hoy falla por la conducta en la primera aserción: «sin altura la bomba no se dimensiona: salió «Bomba contra incendio listada con controlador: 661 gpm (2,500 L/min) a 33.1 m, 30 HP (NFPA 20; dimensionada por el motor)»». Si esa aserción se quitara, las siguientes también fallan hoy: no hay pendiente, el aviso es warn, el semáforo queda «datos» y la memoria dice «6 m capturados».

Además, CM.fuego.6.F10–F12 pasan de fase2:H-210 a vigentes. Hoy dan 15, 0 y 0 contra 0, 1 y 1.

Mutante sugerido: volver a num(F.altura, 6) en la estática, o bajar el aviso a warn. S.155 lo mata.


---

## C5 · CONFIRMADO por refutador · alta · lente dueno
**Contra incendio sin altura capturada: la bomba se dimensiona con 0 m y sale a la propuesta del cliente y a Eléctrico como si estuviera calculada**
Dónde: index.html:11005

Escenario: Contra incendio con área de 3,000 m², cabezal de 30 m y montante de 12 m, sin capturar la altura (desde H-264 ya no se hereda y el campo arranca en 0). Resultado: estática de 1 m y bomba de 2,500 L/min a 33.1 m, 30 HP. La propuesta del cliente dice «Bomba contra incendio listada con controlador: 661 gpm (2,500 L/min) a 33.1 m, 30 HP (NFPA 20; dimensionada por el motor)» (8853). La propuesta a Eléctrico ofrece «Bomba contra incendio · 30 HP» (10232). El PDF imprime «altura libre al rociador mas alto 0 m» (2583). Con 6 m el resultado es 39.1 m y 35 HP. Soportería repite el patrón: sin altura de la estructura, la memoria imprime «Fp = 41.4 kgf … z/h 0». Además el valor capturado no influye: con 3 m o con 30 m sale lo mismo, z/h 1 (8294, 8443, 8574).

Razón del refutador: El hallazgo se reproduce en 63a2794 con los scripts x15/rev/verif-dueno/altura0/f1.mjs a f5.mjs, sin tocar el repo.

**Qué hace el código**
- defaultFuego arranca con altura 0 (index.html:10943).
- computeFuego calcula la estática como max(0, num(F.altura,6)) + 1, que da 1 m (11005).
- El único trato a la altura faltante es un aviso de nivel warn (11006-11007). H-264 lo dejó así a propósito: «no cambia cifras».

**Caso reproducido:** 3,000 m², ord2, cabezal 30 m, montante 12 m, cisterna y altura en 0.
- Resultado: mcaTotal 33.1 m, bomba de 2,500 L/min a 33.1 m, 30 HP, 20.82 kW.
- Con 6 m de altura: 39.1 m, 35 HP, 24.59 kW.

**Adónde llega la cifra corta sin marca**
- Cotización y PDF de la propuesta al cliente: la partida porCotizar clave bombaFuego dice «661 gpm (2,500 L/min) a 33.1 m, 30 HP (NFPA 20; dimensionada por el motor)» (8853). No hay ningún pendiente de fuego.
- Propuesta a Eléctrico: «Bomba contra incendio · 30 HP», kW 20.82 (10231-10233). En pantalla se lee «Propone 1 carga(s) · 20.8 kW».
- Semáforo de contra incendio: queda en «datos» (18739), porque sólo un aviso err lo baja a «incompleta» (18757). Por eso la memoria integral no lo lista entre las disciplinas incompletas.

**Con red municipal es peor:** con presFuente 35 mca y altura 0 sale mcaTotal 33.1 y alcanza=true, sin error y sin bomba. Con 6 m sale «no alcanza» (err) y el semáforo pasa a «incompleta».

**Proyecto guardado con altura null o "":** usa sin decir nada los 6 m de la nave de ejemplo (num(F.altura,6) en 11005, 11054 y 2583). La estática sale en 7 m y el PDF imprime «altura … 6 m», mientras el aviso dice «sólo con el +1 m».

Esto viola la regla 6 (un valor por omisión que parece cálculo) y la regla 8.

**No es un hallazgo nuevo.** Es H-210 de AUDITORIA.md:254 (severidad A; corrección registrada: «Error, pendiente y semáforo incompleta»). Sus filas fase2 CM.fuego.6.F10-F12 siguen fallando: hoy dan 16.3 m, 15 HP, 0 err y semáforo «datos». H-264 lo volvió el camino por omisión de todo proyecto nuevo y lo cerró sólo con un warn.

**Precisiones al hallazgo**
- El PDF de contra incendio sí imprime el aviso en «7. Observaciones» (2617-2618), aunque también imprime «altura … 0 m» y «estatica 1 m» como dato.
- La reserva (qTotal × duración) y el caudal nominal de la bomba no dependen de la altura. No deben quedar pendientes.
- La parte de soportería es menor. Sin h, z/h = 0 hace regir el tope inferior 0.3·SDS·Wp (34.5 kgf); con h rige 0.333·SDS·Wp (38.3 kgf), una diferencia de a lo más 11 %. El anclaje sigue en M10, las partidas no cambian y ya hay aviso (8574). Que 3 m y 30 m den lo mismo es el criterio declarado z = h (H-50, 8287-8294), no un defecto.

Corrección propuesta: Encabezado sugerido: «H-210 · fuego · sin altura al rociador más alto la bomba queda pendiente, con aviso err y semáforo incompleta». Se apoya en la regla 6 de CLAUDE.md; no requiere texto de norma, así que no se bloquea.

**Motor fuego (computeFuego)**
- Definir altCapt = num(F.altura,0) > 0 y sinAltura = !sinArea && !altCapt.
- Calcular la estática con num(F.altura,0). Quitar el 6 oculto en 11005 y 11054 y en el PDF (2583).
- Con sinAltura:
  - Aviso lvl «err»: «pendiente de altura al rociador más alto: sin captura no se dimensiona la bomba».
  - presBomba = kWbomba = hpBomba = 0.
  - Con red municipal no afirmar que alcanza (alcanza = false).
  - Devolver alturaPendiente: true.
  - Conservar qTotal, qBomba nominal y reserva, que no dependen de la altura.
- Memoria y PDF: «altura: PENDIENTE (sin captura)» y bomba «pendiente de altura».
- Efectos que salen solos: el semáforo pasa a «incompleta» por el err, y la propuesta a Eléctrico deja de ofrecer la bomba porque 10231 ya filtra FUEGO.kWbomba > 0.

**Versión y esperados**
- Subir MOTOR_VER.fuego de 4 a 5 y actualizar MOTOR_CAMBIOS.fuego y CHANGELOG-motores.md.
- Regenerar sólo fuego con genera.mjs. El proyecto fijo captura 6 m, así que sólo cambia la versión.
- Actualizar CM.fuego.6 .m/.n/.r/.s y volver vigentes F10-F12. La parte de cabezal y montante en 0 de H-210 puede ir en este commit o en otro.

**Dependencia para el integrador (motor quote, 8852-8856)**
- Con FUEGO.alturaPendiente, la bomba va a pendientes en lugar de a porCotizar con «dimensionada por el motor»:
  - mot: 'fuego'
  - desc: 'Bomba contra incendio listada con controlador'
  - descEn: 'Listed fire pump with controller'
  - motivo: 'pendiente de altura al rociador más alto (sin captura no se supone)'
  - motivoEn: 'highest-sprinkler height pending (not assumed without capture)'
- La reserva sigue «Por cotizar».

**Soportería (aparte, severidad baja):** sin h, usar z/h = 1 según el criterio ya declarado z = h (H-50), o dejar Fp «pendiente de altura de la estructura».

Prueba sugerida: Nombre: «S.155 (H-210) contra incendio sin altura al rociador más alto no dimensiona la bomba ni la ofrece a la cotización ni a Eléctrico».

**Preparación**
- reemplazarEstado(defaultState()) y todos los LINKS en S.perms.
- S.fuego = {...defaultFuego(), riesgo:'ord2', area:3000, Lramal:30, Lmontante:12}, con la altura sin capturar (0).
- recompute.
- Guarda de aislamiento: FUEGO.qTotal > 0.

**Exigencias**
1. FUEGO.hpBomba = 0 y FUEGO.presBomba = 0.
2. Aviso lvl err que contenga /altura/.
3. semaforoSuite(), fila fuego, nivel 'incompleta'.
4. QUOTE.porCotizar sin clave 'bombaFuego', y QUOTE.pendientes con mot 'fuego' y /pendiente de altura/.
5. 'cisternaFuego' sigue en porCotizar (la reserva no depende de la altura).
6. propuestaElecFilas() sin ninguna fila con kWOrigen 'fuego'.
7. Con altura null, FUEGO.estatica ≠ 7 (sin los 6 m ocultos).
8. Con fuente 'municipal', presFuente 35 y altura 0, FUEGO.alcanza ≠ true.
9. Con altura 6: hpBomba 35 y presBomba 39.1.

Hoy falla por la conducta, no por un símbolo, en la primera exigencia: «sin altura al rociador más alto no se dimensiona la bomba (HP): esperado 0, obtenido 30». El borrador ya se corrió contra 63a2794: /home/user/wt-lectura/x15/rev/verif-dueno/altura0/prueba-S155.mjs.


---

## C3 · CONFIRMADO por refutador · alta · lente codigo
**Contra incendio: un proyecto anterior abre con la altura heredada vieja (media ponderada), la CDT baja y la memoria dice «capturados en esta pestaña»**
Dónde: index.html:24146

Escenario: Fixture original tal como estaba antes de H-264 (git show e0e1cf4:parches/regresion-motores/regresion-motores.emp.json): her.fuego.altura en modo «heredado», fuego.altura guardada 4.71 m, zonas de 6 y 3 m. Abierto con importarRespaldo en e0e1cf4, abre con altura 6 m y mcaTotal 39.105. En fcda936 y en 63a2794 abre con 4.71 m y mcaTotal 37.815: 1.29 m menos de estática y de CDT. La memoria imprime «Estática 5.7 m al rociador más alto (4.71 m capturados en esta pestaña + 1 m de la casa; H-205, H-264)».

Razón del refutador: No se pudo refutar. Se reproduce en 63a2794 y el código no lo cubre.
- Código: sanearEstado borra her.* en index.html:24146 (HEREDA = {} en 18055) sin migrar nada. De fuego sólo mezcla los valores por omisión (24015). La memoria rotula la altura como capturada (11044: «${F.altura} m capturados en esta pestaña… al rociador más alto»), y el PDF imprime esa misma línea (2615) y en 2583 dice «altura libre al rociador mas alto». En 2.9.23 (205c40a) la herencia copiaba la MEDIA ponderada (HEREDA fuego.altura de: g.altura), y ese es el valor que se guardaba.
- Reproducción con un proyecto guardado por la 2.9.23 real (x15/rev/verif-codigo/v1-rev2923.mjs), caso de H-205 con Oficinas 2000 m² × 3 m y Almacén 200 m² × 13 m. La 2.9.23 guarda 3.91 m «heredado» con sello fuego v2.
  - e0e1cf4 lo abre con 13 m: estática 14, mcaTotal 46.105, 40 HP y aviso de rack. La memoria dice «13 m heredados: la zona más alta».
  - 63a2794 lo abre con 3.91 m: estática 4.91, mcaTotal 37.015, 35 HP y sin aviso de rack. La memoria dice «Estática 4.9 m al rociador más alto (3.91 m capturados en esta pestaña + 1 m de la casa; H-205, H-264)».
  - Al mismo tiempo, el toast y el sello (19180/19261) anuncian «v2 → v4: v3 H-205 la altura heredada es la MÁXIMA… +1.29 m de CDT». Ese cambio no ocurre.
- Con el fixture original, igual que en el hallazgo: e0e1cf4 da 6 m / 39.105 y 63a2794 da 4.71 m / 37.815, con «4.71 m capturados en esta pestaña».
- R.1 no lo detecta porque 5f8dfc4 editó el fixture (4.71 → 6). El fixture actual quedó con her.fuego.altura.valor 4.71 y fuego.altura 6, combinación que ningún guardado real produce. Ninguna prueba abre una altura heredada: 9.1 sólo revisa un área capturada sin her.
- Commits posteriores: H-267…H-277 no lo tocan. H-272 sólo cambia cxProp al cargar archivos.
- No es diseño: H-265 y H-266 migran «con el valor que usaban» al abrir. Además, H-179 ya fijó que un valor de una revisión anterior se marca «sin confirmar», nunca «capturado». Aquí se viola la regla 8 y se deshace H-205, un crítico de seguridad de vida, en todo proyecto guardado con la 2.9.23 que tenga zonas de distinta altura.

Corrección propuesta: Corrección mínima, probada en una copia parchada (x15/rev/verif-codigo/idx-fix.html, script v2-prueba-y-parche.mjs): la prueba pasa y hay 0 errores de página.
1. En sanearEstado, antes de index.html:24146 y usando `geo` (24135): si geo.hay y s.her["fuego.altura"].modo === "heredado", poner s.fuego.altura = geo.alturaMax. Si s.her["fuego.area"] también es «heredado», poner s.fuego.area = Math.max(1, Math.round(geo.area)). En los dos casos guardar la marca con el patrón H-179: s.fuego.sinConfirmar = { altura: valor, area: valor }. La marca cae sola cuando el valor capturado difiere. Esto corre una sola vez, porque her.* se borra justo después.
2. En computeFuego (11044) y en el PDF (2583): mientras la marca siga vigente, decir «X m tomados al abrir de la zona más alta de Carga térmica (proyecto anterior a H-264), sin confirmar», no «capturados en esta pestaña». Agregar además un aviso warn para confirmarla. Donde llegue a la propuesta, con L(es, en).
3. Restaurar el fixture a como estaba guardado (git show e0e1cf4:parches/regresion-motores/regresion-motores.emp.json, altura 4.71) para que R.1 vigile la migración. Con la corrección, el fixture original y el actual dan los dos 6 m / 39.105, que es el esperado ya commiteado.
4. La corrección mueve cifras de proyectos anteriores respecto de 63a2794. Por eso: MOTOR_VER.fuego 4 → 5, MOTOR_CAMBIOS.fuego v5, CHANGELOG-motores.md y esperado regenerado sólo de versión.
5. Un commit «H-2xx · fuego · proyecto anterior con altura heredada: se migra una vez con la de la zona más alta (H-205), marcada sin confirmar». Norma en el cuerpo: decisión del dueño (H-205, PLAN-CRITICOS §4, y la del 27-sep-2026).

Si el dueño prefiere conservar las cifras con que se guardó en la 2.9.23, la alternativa es dejar el valor, marcarlo «sin confirmar» y avisar que la zona más alta es de 13 m. La marca de origen (punto 2) va en los dos casos.

Prueba sugerida: S.105 (H-2xx) «proyecto anterior con la altura de contra incendio heredada abre con la de la zona más alta y la memoria no la llama capturada».
- Estado viejo: defaultState() más estos campos:
  - zones: [Oficinas area 2000 height 3, Almacén area 200 height 13]
  - fuego: { ...defaultFuego(), riesgo:"ord2", area:2200, altura:3.91, Lramal:30, Lmontante:12 }
  - her: { "fuego.area":{modo:"heredado",valor:2200}, "fuego.altura":{modo:"heredado",valor:3.91} }
- Se abre con importarRespaldo(JSON.stringify(viejo)) y luego recompute().
- Comprobaciones:
  - eq(S.fuego.altura, 13)
  - eq(FUEGO.estatica, 14)
  - aviso /rack/ presente
  - la línea «Estática» de FUEGO.memo NO contiene «capturados en esta pestaña»
  - eq(S.her["fuego.altura"], undefined)
- En 63a2794 falla por la conducta: «la altura que la herencia daba al abrir (zona más alta, H-205): esperado 13, obtenido 3.91». También salen estática 4.91 contra 14, sin aviso de rack y memoria «capturados». Con la corrección pasa. El cuerpo está en x15/rev/verif-codigo/v2-prueba-y-parche.mjs.
- Complemento: al restaurar el fixture original (4.71), R.1 falla hoy con mcaTotal 37.815 contra 39.105 y pasa con la corrección.


---

## U17 · SIN VERIFICAR (verificar con prueba primero) · media · lente dueno
**Proyecto guardado: los valores heredados o copiados al abrirlo se declaran «capturados», y la altura de contra incendio no coincide con la que e0e1cf4 mostraba**
Dónde: index.html:24146

Escenario: Se abre el fixture de regresión tal como estaba guardado en e0e1cf4 (her["fuego.altura"] heredado con 4.71 m, la media ponderada anterior a H-205). e0e1cf4 lo abría con 6 m (estática 7 m, presión en la base 39.11 m); HEAD lo abre con 4.71 m (5.71 m y 37.82 m), sin aviso. La memoria dice «Estática 5.7 m al rociador más alto (4.71 m capturados en esta pestaña + 1 m de la casa)» (11044), cuando es la media heredada que H-205 ya había corregido. La cédula de civil (22679) lista como «capturado a mano» las 4 áreas copiadas de las zonas y el cuarto copiado de Cuartos limpios.

Detalle: sanearEstado borra her.* sin dejar marca y no aplica la herencia una última vez; migrarCivilAutonoma (7412) copia los renglones sin origen. Regla 8 y «abre con las mismas cifras»: al abrir, los campos heredados deberían tomar el valor que la herencia les daba (como lo hacen las migraciones de soporte y eléctrico) y quedar marcados «tomado de Carga térmica al abrir (H-264/H-265), confirmar», no como captura del usuario. El commit cambió el fixture a 6 m en lugar de migrar.


---

## U2 · SIN VERIFICAR (verificar con prueba primero) · media · lente reglas
**Contra incendio: un proyecto guardado con tomarArea y el permiso load>fuego abre con otra área protegida (H-264 no lo migra)**
Dónde: index.html:10965

Escenario: Respaldo con una zona de 800 m², fuego.area 600 (capturada como propia), tomarArea:true y permiso load>fuego. En e0e1cf4 protege 800 m² tomados en vivo: 67 rociadores. En 63a2794 protege 600 m²: 50 rociadores, y la partida de rociadores cambia.

Detalle: MOTOR_CAMBIOS.fuego v4 dice que «un proyecto guardado conserva los valores que ya tenía copiados», pero el área tomada en vivo nunca se copió. sanearEstado (24015) no migra este caso, a diferencia de civil (migrarCivilAutonoma) y de soportería (tomarInstantanea). La prueba 9.1 usa justamente tomarArea:true, pero con área igual a la de las zonas, y por eso no lo detecta. Corrección propuesta: al abrir, si tomarArea está activo, hay permiso load>fuego y el área de zonas es mayor que 0, copiar esa área a fuego.area una sola vez.


---

## U3 · SIN VERIFICAR (verificar con prueba primero) · media · lente reglas
**El sello de contra incendio pasa a «Desactualizado · la captura cambió» al aceptar la propuesta de soportería**
Dónde: index.html:19133

Escenario: Proyecto con contra incendio sellado (500 m², 6 m, 30+12 m) y un tramo de ducto. propAceptar('motores>soporte') concede duct, hidro, fuego y aire>soporte (H-266, PROPUESTAS en 18435). Resultado: selloDe('fuego') dice «Desactualizado · la captura cambió…» aunque S.fuego quedó idéntico.

Detalle: Desde H-264 computeFuego no lee ningún permiso (salió load>fuego), pero ENTRADAS.fuego sigue metiendo perms: ePerms() en la huella. H-265 y H-266 sí dejaron la huella de civil y de soporte sólo con su captura. Resultado: conceder o retirar cualquier permiso marca a contra incendio con un texto falso en pantalla. Es un efecto cruzado de H-266 sobre fuego que no se registró como dependencia, y S.21 no lo detecta. Corrección propuesta: ENTRADAS.fuego = { fuego, site }.


---

## U11 · SIN VERIFICAR (verificar con prueba primero) · baja · lente codigo
**Huellas de sello: contra incendio depende de permisos que ya no lee, y un proyecto anterior abre con Cotización, Kaizen y Valor en «la captura cambió»**
Dónde: index.html:19133

Escenario: (a) Contra incendio con 500 m²: Calcular deja el sello en «calculado». Al aceptar la propuesta de soportería, que concede duct/hidro/fuego/aire>soporte, Contra incendio pasa a «Desactualizado · la captura cambió» con cifras idénticas; computeFuego devuelve lo mismo con y sin permisos. (b) Proyecto sellado con e0e1cf4 (todos sus sellos quedan en «calculado» al reabrirlo ahí), abierto con fcda936 o 63a2794 sin tocar nada: Cotización, Kaizen e Ingeniería de valor quedan en «Desactualizado · la captura cambió», sin cambio de versión y con las mismas cifras.

Detalle: ENTRADAS.fuego conserva `perms: ePerms()` aunque H-264 quitó el único linkAllowed que tenía computeFuego. ENTRADAS.civil (19135) y ENTRADAS.soporte (19139) cambiaron de forma, la migración reescribe S.civil y S.soporte y S.her se vacía (valor lo anida vía eHer), todo sin subir la versión de los motores que las anidan (quote 24, kaizen 1, valor 1). El comentario H-263 en ENTRADAS.load muestra que la casa evita justo este aviso falso. Corrección: quitar perms de ENTRADAS.fuego; para sellos anteriores, calcular la huella de quote/kaizen/valor con la forma vieja, o volver a sellarlos al migrar cuando las cifras no cambian. Reproducción: /home/user/wt-lectura/x15/rev/codigo/expD2.mjs y expF2.mjs.

