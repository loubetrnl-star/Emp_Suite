# Mapa de cruces restantes (63a2794)

Base: `index.html` en 63a2794 (worktree `/home/user/wt-lectura`, igual a `claude/focused-euler-f9knvw`). Las líneas son de ese
commit. Los experimentos están en `x15/cruces/` (lectores: `clean-duct/`, `aire-hidro/`, `equip-quote/`, `valor-kaizen-load/`;
verificación: `verif-*`). No se modificó ningún archivo versionado.

Contexto: por decisión del dueño (27-sep-2026), cada disciplina calcula sólo con lo que se captura en su pestaña. Lo que viene de
otra entra sólo como PROPUESTA aceptada, es decir, una instantánea con origen, fecha y firma (regla 2), y una vez aceptada no se
mueve sola (regla 3). Ya son independientes vent, fuego, civil, soporte, equip (zonas) y elec (H-262 a H-268). HEREDA está vacío.

Tipos que se usan abajo:
- **vivo sin permiso**: se lee en cada recompute y no hay compuerta.
- **vivo con permiso**: pasa por `linkAllowed`, que sólo revisa S.perms. No hay instantánea: con el permiso dado, la cifra se mueve sola.
- **copia por botón**: se copia al hacer clic y no se mueve sola, pero va fuera de PROPUESTAS, sin vínculo, fecha ni firma.
- **dato de Proyecto**: S.site o S.bldDiv, que se capturan en Proyecto, que no es una disciplina ni está en MOTOR_VER.
- **huella**: sólo entra en ENTRADAS, así que marca el sello sin mover cifras.
- **texto** y **entregable**: no mueven cifras de cálculo.

## 0. Confirmación de lo ya sabido

1. **duct>equip lee la presión de ductos en vivo con permiso.** Confirmado.
   - Dónde: requisitoFam (11341-11363), en 11357-11361: `if (linkAllowed("duct>equip") && DUCT && DUCT.path > 0) esp = DUCT.path·1.15/249.089`.
   - Qué mueve: selPorFamilia (11300-11304) resta puntos al fit y pone `limita = "presión estática"`. Los llamadores son viewSeleccion (20655-20656) y la acción sel-modelo (23577-23578), que guarda `S.sel.modelos[fam].rec`.
   - Medido (verif-clean-duct/e2): troncal de 20 a 400 m, path de 53.3 a 368.9 Pa, esp de 0.246 a 1.703 in.wg. El fit baja en rtu de 100 a 94 y en split_duct de 100 a 62. En ahu (4.5 in.wg) no cambia.
   - Lo que no mueve: SYS, cifrasMotor('equip'), la cédula y la cotización. El recomendado tampoco cambió en ningún punto de un barrido de 20 a 3200 m, porque el castigo baja a toda la familia por igual (c.esp de CRITERIO_FAM 11222-11240).
   - Sin permiso, esp es siempre 0. S.vinculos['duct>equip'] es null y no hay PROPUESTAS['duct>equip'].
   - Aparte: ENTRADAS.equip (19129) anida ENTRADAS.duct() sin mirar el permiso. Renombrar un tramo marca «desactualizado» a la selección.
2. **La memoria de selección §8 imprime la preselección de carga.** Confirmado.
   - Dónde: buildSeleccionPdf 2109-2114, título «8. Preseleccion por zona (motor de carga termica)». Imprime `LOADS[i].eq` en vivo, con nombres de S.zones.
   - Medido: zona 0 de 400 a 800 m². §8 pasa de 5.458 a 8.275 TR (40VMA-120) y SYS no se mueve. Ninguna prueba lo cubre (no aparece «Preseleccion» en pruebas.mjs).
   - La trazabilidad del mismo PDF (2138) y la de buildCedulaEquiposPdf (1719) imprimen el sello de load.
3. **S.bldDiv se captura en Proyecto.** Confirmado.
   - Dónde se captura: viewProyecto 16573-16575 (data-path bldDiv). Ni Carga ni Selección tienen ese campo.
   - Mueve cifras sólo en equip: buildSystem 4513-4514, `userDiv` → plantTarget (de 1 a 0.8: plantTarget de 7.793 a 6.234).
   - Kaizen 17540-17549 lo compara con SYS.diversity.
   - En carga sólo es texto: computeLoad lo recibe pero `bd = 1` (3436); aparece en la memoria (3444) y en el PDF (1837, 1906).
   - Entra en ENTRADAS.load (19123) y en ENTRADAS.equip (19129).

---

## 1. equip (Selección de equipo) · MOTOR_VER 2

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| requisitoFam → selPorFamilia | 11357-11361; castigo 11300-11304 | DUCT.path | vivo con permiso (duct>equip; los dos son `autonomo`, así que manda S.perms; link-grant 23672-23674 guarda sólo `{ts}`) | Sí: esp, fit y «limita» de la selección por familia; el rec que guarda sel-modelo sale del mismo cálculo. No mueve SYS | 22.6 (pruebas.mjs:3621; 3647 fija la fórmula con todos los LINKS; 3664, 3688); O.1 concede el permiso (4533). Nada prueba que no se mueva sola | PROPUESTA `duct>equip` → `S.equip.espDucto = {inwg, pathPa, ts, firma, origen:"duct", rev}`, o esp capturada en Selección (`S.equip.espCaptura`). requisitoFam lee sólo eso |
| selPorFamilia (nota) | 11303 | `cotaDuctTexto(DUCT)` | texto | No | 22.6 (3664-3690) | Que la nota salga de la instantánea, con su fecha |
| ENTRADAS.equip | 19129 | `ENTRADAS.duct()` = {S.duct, S.site}, sin mirar el permiso | huella | No. Falso «desactualizado» al renombrar un tramo, al alargarlo o al cambiar el material (verif-clean-duct/e2, verif-equip-quote/eA3) | Ninguna (S.104, 7919-7924, sólo revisa que ya no lleve la carga) | Cambiar `duct:` por `espDucto`/`espCaptura` |
| viewSeleccion (aviso) | 20683 | `linkAllowed("duct>equip")` | texto | No | — | Cambiar el aviso por la tarjeta `propuestaHtml("duct>equip")` |
| viewSeleccion (precio) | 20649 | QUOTE (div, cur, tot), S.quote.price, S.qfam | texto | No | — | Rotular la procedencia (lista de la cotización) o llevarlo a Cotización |
| buildSeleccionPdf §8 | 2109-2114 | LOADS[i].eq y S.zones[i].name | entregable, vivo | Sí, dentro del entregable (5.458 → 8.275 TR con SYS fijo) | Ninguna | Quitar §8, o imprimirla desde las zonas aceptadas (`S.equip.zonas` con origen load) |
| buildSeleccionPdf / buildCedulaEquiposPdf (trazabilidad) | 2138 / 1719 | sello de load | texto | No | S.104 (7970-7972) | Imprimir el sello de equip y la fecha de la instantánea load>equip |
| buildSystem | 4513-4514 | S.bldDiv | dato de Proyecto | Sí: plantTarget 7.793 → 6.234 (bldDiv 1 → 0.8) | S.69 (6960) | **Decisión D1** |
| capFactor / capOf (capWarn 3753 es sólo aviso) | 3735-3749 (fórmula 3742) | SITE.db, alt, pAtm | dato de Proyecto | Sí: de Tijuana a Mexicali con las zonas fijas, instPlant 7.941 → 8.431, unidades 4 → 9; split_duct 40RUA-090 → 40RUA-120 (verif-equip-quote/eA4) | R.1 | **Decisión D1** |
| zonasPropuestasEquip / aceptarZonasEquip | 18268 | LOADS y S.zones, sólo para armar la propuesta | propuesta aceptada | No | S.104 (7910-7990) | Ya cumple (H-267) |
| recompute, migración tomarDeCarga | 11607 (bandera en sanearEstado 23948) | zonasPropuestasEquip(), una sola vez | propuesta aceptada | No | S.104 paso 7 (7981-7990) | Ya cumple. Es el patrón de migración que se reutiliza abajo |

Código muerto: SYS_HOUR_HINT (4502) se escribe y nunca se lee.

## 2. quote (Cotización) · MOTOR_VER 24 · agregador

**Qué lee hoy en vivo.** No hay ninguna PROPUESTA con destino quote (PROPUESTAS 18406-18466). Todo lo ajeno se relee del resultado
de cada motor en cada recompute:
- **Sin ningún permiso:**
  - DUCT.boq.kg y kgGrasa, S.duct.meta.material y DUCT.segs (pendientes). No existe LINKS['duct>quote'].
  - `totals().cfm` de LOADS para los difusores.
  - `totals().tons`, `area` y `cfm` como texto en la pantalla y el PDF.
  - Los avisos de «faltan», que leen VENT, CLEAN, CIVIL, SOPORTE, AIRE, ELEC, HIDRO y FUEGO.
- **Con permiso `x>quote` y sin instantánea:** vent, clean, elec, hidro, fuego, civil, soporte, aire, y load (sólo perTon y perM2).
- **Captura ajena leída directo:** S.elec.sistema (8755), S.fuego.fuente (8852) y S.duct.meta.material (8678, 8705).
- **Copia por botón sin PROPUESTA:** equip, con q-fromsys (23791) y sel-modelo (23580).

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| computeQuote, lámina | 8676-8680 | DUCT.boq.kg, kgGrasa, S.duct.meta.material | vivo sin permiso (no existe LINKS['duct>quote']; linkAllowed da false en 4429) | Sí. S.perms vacío, troncal de 20 a 60 m: 442.7 → 1,073 kg y total de 236,184 a 418,539 (verif-clean-duct/e4). SA-1 de 20 a 60 m: 604.855 → 1,666.056 kg y directo +175,098.24 (verif-equip-quote/eB). Con aluminio: 566.8 kg | S.83 (7323, 7355), S.85 (7412-7433), R.1. La 12.2.1 (1315) concede un «duct>quote» que no existe | Crear LINKS y PROPUESTAS `duct>quote`; instantánea `{kg, kgGrasa, material, pendientes[]}` |
| computeQuote, grasa a porCotizar | 8704-8710 | kgGrasa y material (inox o carbón) | vivo sin permiso | Cantidad «Por cotizar» (ductoGrasa 104.5 kg) | S.85 | Misma instantánea |
| computeQuote, pendientes de ducto | 8694-8700 | DUCT.segs (error, L) | vivo sin permiso | No hay importe, pero sí cambia la lista (entra en cifrasMotor('quote') 19237) | S.83 (7323) | Misma instantánea |
| computeQuote, descripción de lámina | 8678-8679, 8705-8708 | S.duct.meta.material | vivo sin permiso, sólo texto | No: los kilos cambian por DUCT.boq, no por esta lectura | S.85 | Misma instantánea |
| computeQuote, difusores | 8648, 8681-8684 | `totals().cfm` (LOADS) | vivo sin permiso (load>quote sólo cubre perTon y perM2) | Sí. Producción de 400 a 800 m²: de 9 a 11 bocas, directo 61,650 → 75,350 (verif-equip-quote/eB) | Sólo R.1 | **Decisión D4**: de dónde salen los difusores |
| computeQuote, ventilación | 8689, 8719-8728 | VENT.demand, mua, eq.primary.model | vivo con permiso vent>quote | Sí. Con el permiso ya dado, de 6 a 12 cambios/h: directo 1,444,225 → 2,826,800 (eC) | R.1, S.24 (5965), 12.2.1 (1311) | PROPUESTA `vent>quote`: `{demandCfm, muaCfm, modelo, hp}` |
| computeQuote, cuartos limpios | 8689, 8730-8740 | CLEAN.sum.ffu, supplyCfm, list.length (texto) | vivo con permiso clean>quote | Sí. Cuarto de 60 a 120 m²: 68 → 135 FFU y total 6,716,526 → 13,228,510 (verif-clean-duct/e1) | Sólo R.1 (el esperado trae «Módulos FFU … (27 módulos …)») | PROPUESTA `clean>quote`: `{ffu, supplyCfm, nCuartos}` |
| computeQuote, eléctrico | 8745-8777 | ELEC.alim, Lalim, calc, principal, kAIC, mat y S.elec.sistema | vivo con permiso elec>quote | Sólo cantidades «Por cotizar» y pendientes (120 → 240 ML; 1/0 → 600 kcmil); el importe no cambia | S.86 (7451), S.7 (5328) | PROPUESTA `elec>quote`: `{calibre, juegos, hilos, Lalim, tablero A, kAIC, circuitos}` |
| computeQuote, hidráulico | 8778-8844 | HIDRO.tramos (Lcap), mat, cisterna, presOk, hpBomba | vivo con permiso hidro>quote | Sí. AF-GENERAL de 25 a 50 m: directo 67,154 → 70,354; bomba de 2.5 a 3 HP | 22.11 (3899), S.57 (6599), S.39 (6462), S.41 (8462) | PROPUESTA `hidro>quote`: `{mat, metrosPorDiam, cisterna, presOk, hpBomba}` |
| computeQuote, contra incendio | 8845-8858 | FUEGO.nTotal, qBomba, presBomba, hpBomba, reserva y S.fuego.fuente | vivo con permiso fuego>quote | Sí. Área de 500 a 1000 m²: 42 → 83 rociadores, directo 181,350 → 298,200 | S.59 (6673) | PROPUESTA `fuego>quote`: `{nTotal, qBomba, presBomba, hpBomba, reserva, fuente}` |
| computeQuote, soportería | 8864-8873, 8880-8882 | SOPORTE.part, manualPendientes, anclajes, colgado, elevación | vivo con permiso soporte>quote | Sí. Riel de 60 a 120 m: 180,750 → 203,850; elevación de 3 a 6 meses: 276,750 | S.72 (7018), S.73 (7033), S.74 (7055) | PROPUESTA `soporte>quote`: `{part[], pendientes, elevacion}` |
| computeQuote, civil | 8874-8876 | CIVIL.part | vivo con permiso civil>quote | Sí. Obra 1 de 400 a 800 m²: 2,278,207.55 → 3,567,899.76 | Sólo R.1 | PROPUESTA `civil>quote`: `{part[]}` |
| computeQuote, aire | 8891-8921 | AIRE.principal, totalUnidades, tanque, sec, trenFiltros, tramos, nPuntos | vivo con permiso aire>quote | Sí. Sopleteo de 2 a 6 puntos: compresor de 20 a 30 HP, directo 1,344,845 → 1,849,909.06 | S.61 (6741), R.11 (8716) | PROPUESTA `aire>quote`: `{compresor{id,mxn,qty}, tanque, secador, filtros, red[], nPuntos}` |
| computeQuote, indicadores | 8949, 8957-8959 | `totals()` (t.tons, t.area) | perTon y perM2: vivo con permiso load>quote. projTons: vivo sin permiso | Sí. perTon 13,154.63 → 11,953.05 | Ninguna (perTon y perM2 no aparecen en pruebas.mjs) | PROPUESTA `load>quote`: `{tons, area, cfm, nZonas}`, o TR y m² capturados en Cotización |
| computeQuote, «faltan» | 8729, 8741-8742, 8877, 8883, 8922-8925 | VENT, CLEAN, CIVIL, SOPORTE, AIRE, ELEC, HIDRO, FUEGO | texto | No | S.24 (5965), S.7 (5328) | Tomarlo de estadoPropuesta (pendiente o desactualizada) |
| traerSistemaACotizacion (q-fromsys) y sel-modelo | 23791 / 23580 | SYS.chosen.plant y groups | copia por botón | No se mueve sola (SYS de 7.08 a 18 TR y equipo en 617,825.68 sin cambio) | Ninguna; P.4 (4667) sólo lee items | PROPUESTA `equip>quote`, con firma de SYS.chosen y aviso de «desactualizado» |
| viewCotizacion | 20427-20441 | totals(), S.zones.length, SYS.blockTons | texto | No | GC.5 (9172) | Desde la instantánea load>quote y equip>quote |
| buildCotizacionPdf | 1590-1591, 1614 | totals(), LOADS.length | entregable, vivo sin permiso | No (pero «$ 0 / TR sobre 7.1 TR de carga» sale de la carga en vivo) | C.7 (4173), 22.11 (3925) | Desde la instantánea, con fecha, o «pendiente» |
| buildPropuestaXlsx | 5217, 5308, 5442, 5477-5603 | totals, SYS, LOADS, DUCT, VENT, ELEC, FUEGO, HIDRO, AIRE, SITE | entregable | No | C.7, R.11 (8716), R.12 (8755) | Cada cifra desde su instantánea, con sello y fecha |
| ENTRADAS.quote | 19140-19142 | ENTRADAS de 11 motores | huella | No | R.1, S.24 (indirectas) | Que lleve sólo S.quote (con las instantáneas dentro) y los permisos |

**Forma de la instantánea propuesta.** Una entrada por origen en la propia captura de Cotización:

```
S.quote.entradas = {
  "duct>quote":    { ts, rev, firma, origen: "Ductos y calibres",
                     datos: { kg, kgGrasa, material, pendientes: [{tag, motivo, L}] } },
  "load>quote":    { …, datos: { tons, area, cfm, nZonas } },
  "vent>quote":    { …, datos: { demandCfm, muaCfm, modelo, hp } },
  "clean>quote":   { …, datos: { ffu, supplyCfm, nCuartos } },
  "elec>quote":    { …, datos: { sistema, hilos, calibre, juegos, Lalim, tableroA, kAIC, circuitos: [] } },
  "hidro>quote":   { …, datos: { mat, metrosPorDiam: {"1/2": m, …}, cisterna, presOk, hpBomba } },
  "fuego>quote":   { …, datos: { nTotal, fuente, qBomba, presBomba, hpBomba, reserva } },
  "civil>quote":   { …, datos: { part: [{desc, qty, unit, total}] } },
  "soporte>quote": { …, datos: { part: [], pendientes: [], elevacion } },
  "aire>quote":    { …, datos: { compresor, tanque, secador, filtros, red: [], nPuntos } },
  "equip>quote":   { …, datos: { firmaSys } }   // las partidas ya se copian a S.quote.items
}
```

- Cada una lleva su PROPUESTAS[id] (destino quote), con disponible, firma, resumen, actual y aplicar, y registrarVinculo.
- LINKS sigue siendo el permiso para **proponer**. computeQuote lee sólo `S.quote.entradas[id].datos`, precios y catálogo.

## 3. kaizen · MOTOR_VER 1 · agregador

**Qué lee hoy en vivo.**
- Tres compuertas, todas permisos y ninguna instantánea:
  - load>kaizen: S.zones, LOADS, simZone→computeLoad, SYS, S.bldDiv, adpLevel, MISSING_MATS y VALID.
  - duct>kaizen: DUCT.segs.
  - quote>kaizen: QUOTE.mxnTRequipo.
- **Sin ningún permiso:** SYS.chosen.plant[0].model (kW/TR), ELEC, S.elec.Ltablero, HIDRO.tramos y FUEGO.
- Semillas de S.quote sin campo de captura: tarifaKWh, horasAno y alimM.

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| computeKaizen, zonas | 17370, 17391-17495, simZone 17320-17324 | S.zones, LOADS[i], computeLoad sobre la zona actual | vivo con permiso load>kaizen | Sí. Vidrio sur de 12 a 24 m²: 1.03 → 1.46 TR y 9,751 → 13,851 MXN/año (verif-valor-kaizen-load/exp1) | 22.12 (3948), S.14 (5466), S.21 | Instantánea `load>kaizen` con las zonas capturadas, sobre la que corre simZone |
| computeKaizen, kW/TR de planta | 17378-17382 (entra en 17385 y 17387) | SYS.chosen.plant[0].model → EFF_EST | vivo sin permiso (no existe equip>kaizen) | Sí, cuando hay load>kaizen: VRF → chiller lleva el opex de 9,751 a 11,804. El PDF lo imprime siempre (2444) | Ninguna | Instantánea `equip>kaizen` con `kwPorTR`, o kW/TR capturado en Kaizen |
| computeKaizen, sobredimensionamiento y espera | 17396-17418, 17527-17534 | SYS.chosen.instPlant, instTerm, blockTons, sumPeaks, plant | vivo bajo un permiso ajeno (load>kaizen) sobre la salida de equip | Sí. Zonas de selección ×0.6: aparecen sobre\|Planta 0.07 TR y sobre\|Terminales 0.61 TR (exp1); con chiller, capex 246,208 (exp3) | P.3 (4647, sólo la firma de caché), S.21 | Instantánea `equip>kaizen` |
| computeKaizen, diversidad | 17540-17549 | S.bldDiv contra SYS.diversity y sumPeaks | vivo: dato de Proyecto contra salida de equip, bajo load>kaizen | Sí. Con bldDiv 1 / 0.95 / 0.9 / 0.85, inv\|Planta vale 5.34 / 4.53 / 3.73 / 2.92 TR (exp4) | Ninguna | En la instantánea `equip>kaizen` (bldDiv y diversidad al aceptar) |
| computeKaizen, defectos de carga | 17499-17515 | LOADS[i].adpLevel, MISSING_MATS | vivo con load>kaizen | No hay cifra (tr 0); sí cambia el conteo | Ninguna | En la instantánea load>kaizen. Aparte: MISSING_MATS nunca se vacía |
| computeKaizen, validación | 17517-17524 | VALID.rows (validateAll 4091-4106, de todos los motores) | vivo con load>kaizen | No hay cifra; cambia el conteo (presRed 40 en Hidráulico lo quita) | Ninguna | Retirarlo: es trabajo del semáforo, no de Kaizen |
| computeKaizen, ductos | 17371, 17552-17575 | DUCT.segs (Pam, flow, forma, w, h) | vivo con permiso duct>kaizen | Sí. Troncal de 30 a 90 m: 0.160 → 0.371 kW (verif-clean-duct/e5); TR-X de 20 a 40 m: 0.10 → 0.19 kW (exp2) | 12.2.1 (1315) sólo concede. Ninguna revisa los detectores | Instantánea `duct>kaizen`: `segs[{tag, Pam, flow, forma, w, h, L}]` |
| computeKaizen, $/TR | 17376 (capex 17386) | QUOTE.mxnTRequipo | vivo con permiso quote>kaizen | Sí. Capex 246,208 → 492,416 al pasar la partida de 100k a 200k | P.7 (4705), 12.3 | Instantánea `quote>kaizen`: `{mxnTR, ts}` |
| computeKaizen, alimentador | 17588-17623 (L 17599, 17618) | ELEC.alim, Itab, kVAdemanda, mat, sis y S.elec.Ltablero (vacío = 30 m) | vivo sin permiso (no existe elec>kaizen) | Sí: ahorroKW (45 kW da 0.09 kW; 60 kW da 0.06 kW; Ltablero 60 da 0.17) | 12.2 (1290), que la aísla vaciando las cargas | Instantánea `elec>kaizen`; sin Ltablero, «pendiente de longitud» (regla 6, H-179) |
| computeKaizen, precio de cobre | 17607 (retorno 17609, 17615) | S.quote.alimM (semilla 1350, QUOTE_SEED 4850, sin campo) | semilla sin captura, sin permiso | Sí: con 13,500 la oportunidad desaparece; con 500 el retorno pasa de 6.9 a 2.6 años | Ninguna | Capturarlo en Kaizen con fuente y fecha, o «Por cotizar» (**D3**) |
| computeKaizen, tarifa y horas | 17373-17374 (opex 17387; alimentador 17608-17615) | S.quote.tarifaKWh y horasAno (semillas 2.85 y 3500, QUOTE_SEED 4888-4889, sin campo) | semilla sin captura, sin permiso | Sí. Tarifa 5: opex 12,849 → 22,543. 8760 h: 32,160 | 12.3 (sólo exige > 0) | Capturarlas en Kaizen, o «pendiente» (**D3**) |
| computeKaizen, tuberías sobradas | 17627-17636 | HIDRO.tramos (V) | vivo sin permiso | No hay cifra; aparece inv\|1 tramo(s) | Ninguna | Instantánea `hidro>kaizen`: `tramos[{tag, V, d}]` |
| computeKaizen, contra incendio | 17640-17650 | FUEGO.areaDis, r.areaMin, qTotal | vivo sin permiso | No hay cifra; aparece sobre\|Contra incendio | Ninguna | Instantánea `fuego>kaizen`: `{areaDis, areaMin, qTotal}` |
| kaizenLazy (firma de caché) | 17328-17344 | S.zones, S.elec, S.hidro, S.fuego, `S.duct.segments.length`, QUOTE.sub, SYS.chosen, S.equip.zonas, S.perms | texto (caché) | No, pero editar un tramo sin cambiar cuántos hay deja el Kaizen viejo | P.3 (4647) | Firmar con la huella de las instantáneas |
| buildKaizenPdf | 2405-2445 | computeKaizen() y QUOTE (div, cur, mxnTRequipo) | entregable | No | 18.13 (2384) | Imprimir cada fuente con su fecha de instantánea; tarifa y horas con su procedencia (hoy «Supuestos» sin fuente, 2442-2443) |

**Forma de la instantánea propuesta.** La guarda la captura de Kaizen:

```
S.kaizen.entradas = {
  "load>kaizen":  { ts, rev, firma, datos: { zonas: [copia de la captura de cada zona], adp: [{zona, nivel}], faltanMat: [] } },
  "equip>kaizen": { …, datos: { chosenId, plant: [{modelId, qty}], kwPorTR, instPlant, instTerm, blockTons, sumPeaks, diversity, bldDiv } },
  "duct>kaizen":  { …, datos: { segs: [{tag, Pam, flow, forma, w, h, L}] } },
  "quote>kaizen": { …, datos: { mxnTR } },
  "elec>kaizen":  { …, datos: { alim, Itab, kVAdemanda, mat, sis, Ltablero } },
  "hidro>kaizen": { …, datos: { tramos: [{tag, V, d}] } },
  "fuego>kaizen": { …, datos: { areaDis, areaMin, qTotal } }
}
S.kaizen.tarifaKWh / horasAno / alimM = { valor, fuente, fecha } | null   // captura propia (D3)
```

simZone corre computeLoad sobre `datos.zonas`, no sobre S.zones. El sitio con que corre depende de D1.

## 4. valor (Ingeniería de valor) · MOTOR_VER 1 · agregador

**Qué lee hoy en vivo, todo sin ningún permiso** (no hay DOMAINS.valor ni cruces `*>valor` en LINKS):
- SYS completo: chosen, opts, instPlant, instTerm, blockTons y plant.
- CARRIER y capOf, que a su vez lee SITE.
- QUOTE.mxnTRequipo.
- S.quote.tarifaKWh y horasAno (semillas).
- KAIZEN.ops, que arrastra todo lo de §3 y depende de la pestaña activa por kaizenLazy.

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| computeIngValor, fuente a (sistemas alternos) | 19992-20014 | SYS.chosen, opts, instPlant, instTerm, blockTons | vivo sin permiso | Sí, por dTR: con las zonas de selección ×3, sis-vrf 1.06 → 2.18 TR y sis-split pasa a sis-chiller (exp5). blockTons sólo es texto: dkW siempre vale 0 (ver el defecto X-3) | 12.2.1 (1311), 12.6 (1370), S.21 | Instantánea `equip>valor` |
| computeIngValor, fuente b (equipo alterno) | 20017-20053 | SYS.chosen.plant, CARRIER, capOf (SITE 3735-3748) | vivo sin permiso | Sí: con planta 30XV-500 aparece eq-0-xr-19XR-200 con 48.5 kW y 483,788 MXN/año; con Mexicali o VRF desaparece (exp15b) | 12.2.2 (1333, sólo que capOf resuelva) | Misma instantánea, con la capacidad en sitio de cada renglón |
| computeIngValor, $/TR | 19961 | QUOTE.mxnTRequipo | vivo sin permiso, a propósito (20062) | Sí. Capex 334,645 → 669,289 al pasar la partida de 100k a 200k; en el mismo caso Kaizen da 0 | 12.3 (1345), P.7 (4705) | Instantánea `quote>valor` (o el candado quote>kaizen, **D2**) |
| computeIngValor, tarifa y horas | 19959-19960 (opex 20010, 20035, 20049) | S.quote.tarifaKWh y horasAno (semillas) | semilla sin captura | Sí. Tarifa 5: 483,788 → 848,750; 8760 h: 1,210,851 | 12.3 | Captura propia (**D3**) |
| computeIngValor, fuente c (Kaizen) | 20065-20074 | KAIZEN.ops (tr, kW, mxnCapex, mxnOpex) | vivo sin permiso; depende de S.tab (kaizenLazy 17329) y de VZ_CACHE (20195-20200, que sólo firma ops.length) | Sí. Vidrio sur: kz-0 1.03 → 1.46 TR. Con S.tab en carga o seleccion, 0 medidas. Con la caché, VALOR se queda en 1.03 cuando KAIZEN ya da 1.46 | 12.2.1, 22.12 (3982), S.14, S.21 | Instantánea `kaizen>valor` de las ops, o Kaizen y Valor como una sola disciplina (**D2**). Quitar la dependencia de la pestaña |
| computeIngValor, bloqueos | 20060-20062 | linkAllowed de load, duct y quote>kaizen | texto | No | 12.2 (1290) | Estado de las propuestas |
| desviacionesVivas | 19917-19936 | SYS.recomendado contra chosen, estadoPropuesta, HEREDA (vacío) | texto | No | 12.5 (1361), 12.6 (1370) | Quitar el bucle de HEREDA, que es código muerto (19936) |
| viewValor | 20114-20181 | QUOTE.div y cur, SITE (20181) | texto | No | GC.5 (9172), 9182 | Aceptable como presentación |
| buildValorPdf | 2268-2308 | SYS, SITE (2303), QUOTE (2284), computeKaizen() (2277) | entregable | No | Ninguna del PDF (hoja INGENIERIA_VALOR: 3985) | Imprimir desde las instantáneas, con fecha |
| MOTOR_ACC.valor.falta / kaizen.falta | 19045 / 19048 | totals().area, SYS.chosen, S.zones | texto | No | 12.9 (1420) | Mirar lo aceptado, no lo vivo |

**Forma de la instantánea propuesta.**

```
S.valor.entradas = {
  "equip>valor":  { ts, rev, firma, datos: { chosenId, blockTons, sitio,
                    opts: [{id, label, instPlant, instTerm, plant: [{modelId, qty, installed, capSitio}]}] } },
  "quote>valor":  { …, datos: { mxnTR } },
  "kaizen>valor": { …, datos: { ops: [{id, tipo, titulo, tr, kW, mxnCapex, mxnOpex}] } }
}
```

Tarifa y horas vienen de la captura propia (D3). Si D2 junta Kaizen y Valor, sale una sola captura y `kaizen>valor` desaparece.

## 5. load (Carga térmica) · MOTOR_VER 6

En cifras, carga ya es independiente. Con bldDiv 0.7, equip.zonas ×3, sysForce, vent.ach, duct, clean, quote y perms={} cambiados,
LOADS queda idéntico (5.4578 TR / 2515 CFM y 1.6264 TR / 738 CFM).

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| Acción cl-handoff | 23509-23525 (asignación en 23518) | CLEAN.list[k].makeup → z.oaFixed | copia por botón (sin PROPUESTA, vínculo, origen ni ts; no existe LINKS['clean>load'] ni hay llamada a linkAllowed) | Sí al pulsar: oaFixed 0 → 1620 y el proyecto 7.084 → 8.317 TR. Después no se mueve sola (ISO 6, 240 m²: la zona sigue igual) (verif-clean-duct/e0) | S.67 (pruebas.mjs:6918-6939) | PROPUESTA `clean>load` (destino load). La zona guarda `z.origenOA = {motor:"clean", cuarto, makeup, ach, ts, firma}` |
| Acción clean-to-zone | 23527-23545 (23534 achClean, 23539 oaFixed, 23542 push y c.zonaId) | CLEAN.cur: área, altura, occ, procW, ach, makeup | copia por botón | Sí al pulsar: proyecto 8.317 → 31.547 TR. No sigue al cuarto | S.68 (6941-6957) | Misma PROPUESTA. La zona nueva lleva `z.origen = {motor:"clean", cuarto, ts, firma}` |
| computeLoad, airS, combinarCasos, loadOf | 3398, 3438-3590, 11486-11493, 11576-11581 | SITE (db, QS, pAtm, caso) | dato de Proyecto (DOMAINS.load.owns 4179 declara «sitio») | Sí: de Tijuana a Mexicali, zonas de 5.46 / 1.63 a 9.10 / 2.52 TR (exp1) | 22.10. La mutación de S.21 (5693, db += 3 con key tijuana) no mueve LOADS, porque siteOf 3212 sólo respeta db con key custom | **Decisión D1** |
| loadOf → computeLoad(z, S.bldDiv, …) | 11572, 3436, 3444 | S.bldDiv | texto (bd = 1) | No | S.69 (6960) | Quitar el argumento. La memoria lo rotula «dato de selección de equipo, no entra a la carga» |
| buildCargaPdf | 1837, 1906 | S.bldDiv | entregable | No | S.69 | Lo mismo |
| buildMemoriaPdf | 1518-1520 | DUCT.segs, DUCT.path (cédula y presión de ventilador) | entregable, vivo, sin rótulo de origen | No | 22.6 (3674, fraseMem) | Llevarlo a la memoria de ductos, o rotularlo «dato del motor de ductos, sello del …» (regla 8) |
| chainHtml | 16542 | DUCT.segs[0], LOADS[0].eq | texto | No | Ninguna | Rotular el origen |
| validateAll, duct>load | 4111 | DUCT.segs contra LOADS.supply | texto con permiso | No | P.2 (4633-4644) | Se queda |
| validateAll, balance clean/load | 4132 | CLEAN.sum.makeup contra totals().oa | texto (mismo cluster) | No | N.1 (4463, 4476, 4491) | Se queda |

## 6. aire · MOTOR_VER 5

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| computeAire | 7031 (entra en V 7106, ρ 7152, evalD 7158, dimRed 7171-7172; memoria 7194) | SITE.pAtm (pAtmOf 3209, a partir de la altitud de S.site, capturada en viewProyecto 16577 y 16579) | dato de Proyecto, vivo sin permiso (no hay `>aire` en LINKS ni en PROPUESTAS; el sello no lo frena) | Sí. Altitud de 149 a 2240 m: pAtm 99.548 → 77.155 kPa; ρ 8.7565 → 8.5033; V 5140.4 → 3984.1 L; tanque 10,000 → 4,000 L; ΔP 0.0953 → 0.0981 bar. Tecate (540 m): tanque 10,000 → 5,000 L. FAD, compresor, kW y MXN/año no cambian. Con aire>quote, la partida del tanque se mueve igual (verif-aire-hidro) | Ninguna. CM.aire fija P_ATM = pAtmDe(149) (aire.calc.mjs:42-43); S.21 (5677) sólo cambia db | **D1**. (a) Capturar pAtm o la altitud en la pestaña, más una propuesta `proyecto>aire`; o (b) declarar el sitio dato común. En los dos casos, quitar los 101.325 por omisión (7031; rhoAire 7026) |
| buildAirePdf | 7224-7292 (7277) | SITE.pAtm | entregable | No (llama a recompute antes) | Ninguna | Tomar pAtm del resultado de AIRE (devolverlo desde computeAire). Declarar sitio, altitud y kPa. No llama a pdfDocHeaderMeta (1396) |
| ENTRADAS.aire | 19134 | S.site completo | huella | No. db de 32.8 a 40 marca «desactualizado» con AIRE idéntico | S.21 no prohíbe las marcas de más | Dejar sólo la presión que entra al cálculo (o `{key, alt}`); sin site si se captura en aire |
| tarjetaCosto (viewAire 22533) | 6527 | linkAllowed('aire>quote'), QUOTE, S.quote (plaza) | texto (sentido de salida) | No | Ninguna | Se queda |

Además: dimRed (7172) mezcla 101.325 (referencia del FAD) con la pAtm del sitio, y H-219 (abierta, AUDITORIA.md:268) va a usar
el mismo dato. La cita «ASHRAE Fundamentals 2021 cap. 1 ec. 3» está en un comentario (3208), pero no en
`parches/normas-texto/`. Para imprimirla en el entregable hace falta el texto (regla 4). Mientras tanto la procedencia dice
«sitio y altitud de Proyecto, fórmula pAtmOf».

## 7. clean (Cuartos limpios) · MOTOR_VER 3

computeClean (9208-9265) y ffuCount (9146) sólo leen el cuarto, ISO_CLASSES, FFU y las constantes P.OA_PERS y P.OA_M2 (3041).
Con zonas, S.vent y S.bldDiv cambiados, CLEAN.sum no se mueve.

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| ENTRADAS.clean | 19128 | S.site | huella | No. Un cambio de sitio marca «desactualizado» sin cifra movida (clean-duct/sitio.mjs) | Ninguna | Quitar site |
| buildLimpioSuitePdf | 1636 | SITE (etiqueta, db, wb, alt, pAtm) y MARGEN_HAP | entregable | No | Sólo el paso «PDF cuarto limpio» del contrato (17913) | Rotular «dato del proyecto, no entra al cálculo»; quitar el margen HAP, que es de carga (regla 8) |
| viewLimpio, selector de zona | 20780 | S.zones (id y nombre) | texto | No | S.67 (6932) | Se queda: es la lista de destinos de la propuesta clean>load |
| (salida) cl-handoff / clean-to-zone | 23509-23545 | — | ver §5 (load) | — | S.67, S.68 | La propuesta la recibe load (H-281) |
| (salida) cargasOtrosMotoresElec | 10235 | CLEAN.sum.ffu × FFU.watts | propuesta aceptada cedula>elec (H-268) | — | pruebas.mjs:615, 675, 740-749, 818 | Ya cumple |

## 8. duct (Ductos) · MOTOR_VER 4

calcDuct y calcSegment (9566-9665) sólo leen S.duct. rho, mu y eps se capturan en la pestaña (valores iniciales en 11398); no
vienen de SITE. Con la carga ×2, DUCT no cambia (prueba 4.1, 420).

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| ENTRADAS.duct | 19130 | S.site | huella | No. Marca ductos «desactualizado», y también equip y kaizen, que la anidan | Ninguna | Quitar site |
| chainToDuct (PROPUESTAS['load>duct'].aplicar y el botón chain-duct 23463-23474) | 23801 | totals(), LOADS[i].cfm, S.zones[i].name | propuesta aceptada | Al aceptar; después, no | 4.1-4.3 (420-440), 5.1 (883-910), 13.8 (1508), S.84 (7375-7408), 22.6 (3705) | Ya cumple |
| viewDuct → propuestaHtml('load>duct') | 20943 | totals() y LOADS (tarjeta) | texto | No | 4.2 (426-429), 5.1 (895) | Se queda |

## 9. hidro · MOTOR_VER 8

computeHidro (10677-10841) y las 16 funciones que alcanza no leen SITE ni ningún resultado ajeno. Con captura real, en 3 sitios
distintos, la salida es idéntica (CDT 32.666 m).

| Función | Línea | Qué lee | Tipo | Mueve cifras | Prueba que lo cubre | Cómo independizarlo |
|---|---|---|---|---|---|---|
| ENTRADAS.hidro | 19132 | S.site | huella | No. Cambiar db marca «desactualizado» con HIDRO idéntico (sobre-marcado deliberado, Bitacora-rev-2.9.14.md §2) | S.21 no lo detecta | Quitar site |
| validateAll, balance de agua | 4139 | FUEGO.reserva (fuego>hidro con permiso) | texto | No | N.2 (4494-4511) | Se queda |
| tarjetaCosto (viewHidro 22453) | 6527 | linkAllowed('hidro>quote'), QUOTE, S.quote (plaza) | texto (sentido de salida) | No | 12.2 (1290), indirecta | Se queda |
| buildHidroPdf → pdfDocHeaderMeta | 2514 (1406) | SITE.label | entregable, sólo encabezado | No | Ninguna | Se queda |

---

## 10. Hallazgos que harían falta (H-274, luego H-278 en adelante)

Números: H-275 y H-276 están reservados (mutantes de civil y load) y H-277 ya está usado (elec, `6b31f85`). Después de H-274
sigue H-278. Va uno por motor.

Patrones comunes que usan los hallazgos:
- **Migración «misma cifra al abrir»:** una bandera en sanearEstado (23915) que recompute consume una sola vez, después de calcular el origen, igual que `S.equip.tomarDeCarga` (23948 → 11607).
  - Toma la instantánea con lo que hoy entra en vivo: sólo de los cruces que hoy entran, es decir, con el permiso dado o sin compuerta.
  - Registra `registrarVinculo(id, "aceptado")` con `origen` + « (migración rev …)».
  - El `ts` no debe entrar a cifrasMotor ni al esperado de R.1, porque no se usa Date.now en fixtures.
- **Re-sello de migración:** no existe hoy (selloDe 19257 sólo compara la huella). Cuando un hallazgo sólo cambia la fórmula de ENTRADAS, se propone:
  - en sanearEstado, si `st.huella === huellaAnterior(id)` (la fórmula vieja se conserva sólo ahí), se reescribe con la huella nueva;
  - si no coincide, queda «desactualizado» como hoy.
  - Sin esto, cada proyecto sellado abre «desactualizado» una vez, aunque ninguna cifra cambie.

### H-274 · equip · presión de ductos sólo como propuesta duct>equip aceptada; huella y memoria sin lecturas vivas
- **Qué se retira:**
  - La lectura de `DUCT.path` en requisitoFam (11357-11361) y `cotaDuctTexto(DUCT)` en 11303.
  - `duct: ENTRADAS.duct()` en ENTRADAS.equip (19129).
  - §8 de buildSeleccionPdf (2109-2114), que lee LOADS[i].eq.
  - El sello de load en la trazabilidad (2138, 1719).
  - El código muerto SYS_HOUR_HINT (4502).
- **Qué se captura en la pestaña:** `S.equip.espCaptura`, la presión estática externa en in.wg, opcional. Sin ella ni instantánea, esp queda «pendiente» y no se evalúa. El aviso de 20683 lo dice, sin castigar ni suponer.
- **Propuesta aceptada:** sí, **PROPUESTAS['duct>equip']** (origen duct, destino equip, permisos ["duct>equip"]).
  - Firma: `Math.round(DUCT.path)`.
  - aplicar: `S.equip.espDucto = {inwg: path·1.15/249.089, pathPa, cota, ts, rev}`.
  - REQUIERE_CAPTURA_PROP: ["duct"].
- **Migración:** si el proyecto tiene S.perms['duct>equip'] y DUCT.path > 0, la bandera `S.equip.tomarEspDucto` toma la instantánea al abrir. Salen el mismo esp, el mismo fit y el mismo rec. Sin permiso no hay nada que migrar (hoy esp = 0). La huella cambia, así que va con re-sello.
- **Versión:** equip 2 → 3, porque el fit y la esp de pantalla cambian para quien tenía el permiso y no acepta. cifrasMotor('equip') no lleva fit: hay que comprobar que el esperado de R.1 no se mueva y regenerarlo por la versión.
- **Pruebas viejas que se reescriben:**
  - 22.6 (3621, 3647, 3664, 3688): conceder y además `propAceptar("duct>equip")`, y la fórmula se lee de `S.equip.espDucto`.
  - O.1 (4533): el permiso ya no basta.
  - S.104 (7970-7972): la trazabilidad sin load.
- **Prueba nueva que falla hoy:** `S.nn (H-274) la selección no se mueve sola con ductos`. Con el permiso concedido y la propuesta aceptada, se alarga el troncal de 20 a 400 m y se revisa que `selPorFamilia("rtu").fit` y esp sigan iguales. Hoy falla: esp va de 0.246 a 1.703 y el fit de 100 a 94. Se suman dos asserts:
  - con duct>equip negado, renombrar un tramo no cambia huellaMotor('equip') (hoy cambia);
  - buildSeleccionPdf no contiene «Preseleccion por zona (motor de carga» (hoy lo contiene).

### H-278 · quote · la cotización sólo con instantáneas aceptadas (x>quote), nada en vivo
- **Qué se retira:** toda lectura de DUCT, LOADS/totals(), VENT, CLEAN, ELEC, HIDRO, FUEGO, CIVIL, SOPORTE, AIRE, S.elec.sistema, S.fuego.fuente y S.duct.meta.material dentro de computeQuote (8648-8959). También las de buildCotizacionPdf (1590-1591, 1614), viewCotizacion (20427-20441) y ENTRADAS.quote (19140-19142). Los «faltan» se arman desde estadoPropuesta.
- **Qué se captura en la pestaña:** además de lo que ya tiene (precios, plaza, partidas), `S.quote.entradas` (forma en §2). Si D4 lo decide, también un número de difusores capturado.
- **Propuestas aceptadas:** sí, de cada origen: `duct>quote` (**nueva también en LINKS**), `load>quote` (TR, m², CFM), `vent>quote`, `clean>quote`, `elec>quote`, `hidro>quote`, `fuego>quote`, `civil>quote`, `soporte>quote`, `aire>quote` y `equip>quote`. Para equip, q-fromsys (23791) y sel-modelo (23580) pasan a ser su `aplicar`, con firma de SYS.chosen. LINKS queda como permiso para proponer.
- **Migración:** la bandera `S.quote.tomarEntradas` toma, al abrir y una sola vez:
  - la instantánea de cada `x>quote` con permiso dado;
  - siempre `duct>quote` y los CFM de difusores, porque hoy entran sin permiso.
  - Resultado: los mismos renglones, importes, pendientes y porCotizar.
  - Los proyectos sin permiso no ganan nada.
- **Versión:** quote 24 → 25. En proyectos nuevos, sin aceptar, lámina y difusores quedan «pendiente/Por cotizar». Se regenera el esperado de R.1: con la migración, las cifras deben salir iguales.
- **Pruebas viejas que se reescriben** (conceder el permiso y además aceptar la propuesta; un helper `aceptarCot(m)` en el bloque de quote):
  - S.83 (7323, 7355), S.85 (7412-7433), 12.2.1 (1311, 1315; el «duct>quote» fantasma pasa a ser real), S.24 (5965), S.7 (5328), S.86 (7451).
  - 22.11 (3899, 3925), S.57 (6599), S.39 (6462), S.41 (8462), S.59 (6673), S.61 (6741), S.72-S.74 (7018-7055), R.11 (8716), R.12 (8755), C.7 (4173), GC.5 (9172).
- **Prueba nueva que falla hoy:** `S.nn (H-278) la cotización no se mueve sola`. Con S.perms = {}, SA-1 de 20 a 60 m no debe cambiar QUOTE.direct (hoy sube 175,098.24) y Producción de 400 a 800 m² no debe cambiar el número de difusores (hoy de 9 a 11). Con vent>quote concedido y aceptado, subir de 6 a 12 cambios/h no debe mover el directo (hoy 1,444,225 → 2,826,800).

### H-279 · kaizen · oportunidades sólo sobre instantáneas aceptadas y captura propia de tarifa, horas y precios
- **Qué se retira:**
  - Las lecturas vivas de S.zones, LOADS, simZone sobre la zona actual, SYS (17378-17418, 17527-17549), S.bldDiv, DUCT.segs, QUOTE.mxnTRequipo, ELEC y S.elec.Ltablero (17588-17623), HIDRO.tramos (17627) y FUEGO (17640).
  - VALID.rows (17517-17524), que pasa al semáforo.
  - Los respaldos 2.85, 3500, 1350 y 30 m.
- **Qué se captura en la pestaña Kaizen:** `tarifaKWh`, `horasAno` y `alimM`, cada una como `{valor, fuente, fecha}`. Sin captura, opex y retorno salen «pendiente» (regla 6, **D3**).
- **Propuestas aceptadas:** sí: `load>kaizen`, `equip>kaizen` (nueva), `duct>kaizen`, `quote>kaizen`, `elec>kaizen` (nueva), `hidro>kaizen` (nueva) y `fuego>kaizen` (nueva). Forma en §3. Esto aplica si **D2** elige instantáneas; si elige la excepción, sólo se agregan compuertas a elec, hidro, fuego y equip.
- **Migración:**
  - Al abrir se toma la instantánea de cada fuente que hoy entra: las de permiso concedido, y elec, hidro, fuego y SYS, que hoy entran sin permiso.
  - Tarifa, horas y alimM se copian de S.quote si el archivo las trae, con fuente «archivo del proyecto». Si no, según D3.
  - Se corrige la firma de kaizenLazy (17330-17344, hoy `segments.length`) para que firme las instantáneas.
- **Versión:** kaizen 1 → 2.
- **Pruebas viejas que se reescriben:** 12.2 (1290; ya no hace falta aislar ELEC vaciando las cargas), 12.2.1 (1315), 12.3 (1345), 22.12 (3948), S.14 (5466), S.21 (sello de kaizen), P.3 (4647), P.7 (4705), 18.13 (2384).
- **Prueba nueva que falla hoy:** `S.nn (H-279) Kaizen no se mueve solo`.
  - Con load>kaizen concedido y aceptado, subir el vidrio sur de Producción de 12 a 24 m² no debe cambiar la oportunidad de vidrio (hoy 1.03 → 1.46 TR).
  - Con S.perms = {}, `S.fuego.areaDiseno = 400` no debe hacer aparecer «Contra incendio» (hoy aparece).
  - Sin tarifa capturada, `KAIZEN.ops[*].mxnOpex` no debe valer un número que salga de 2.85 (hoy sale).

### H-280 · valor · medidas sólo sobre instantáneas; sin dependencia de la pestaña activa
- **Qué se retira:**
  - SYS (19992-20053), QUOTE.mxnTRequipo (19961) y S.quote.tarifaKWh/horasAno (19959-19960).
  - La lectura de KAIZEN.ops a través de kaizenLazy y VZ_CACHE (20065-20074, 20195-20200).
  - El bucle de HEREDA en desviacionesVivas (19936).
- **Qué se captura en la pestaña:** tarifa y horas propias, o las de Kaizen si D2 las une; sin ellas, «pendiente» (D3).
- **Propuestas aceptadas:** `equip>valor`, `quote>valor` y `kaizen>valor` (forma en §4). Si D2 junta Kaizen y Valor en una sola disciplina de gestión, `kaizen>valor` desaparece y Valor lee KAIZEN, que ya no se mueve solo tras H-279.
- **Migración:** al abrir, con `S.tab` forzado a valor (como hace buildValorPdf), se toman las instantáneas con lo que hoy da computeIngValor. Salen las mismas medidas, TR, capex y opex. VZ_CACHE firma las instantáneas.
- **Versión:** valor 1 → 2.
- **Pruebas viejas que se reescriben:** 12.2.1 (1311), 12.2.2 (1333), 12.3 (1345), 12.5 (1361), 12.6 (1370), 12.9 (1420), P.7 (4705), 22.12 (3982), S.14, S.21, GC.5 (9172).
- **Prueba nueva que falla hoy:** `S.nn (H-280) Valor no se mueve solo`. Con perms = {} y S.sysForce fijo, las zonas de selección ×3 no deben cambiar las medidas (hoy sis-vrf 1.06 → 2.18 TR y sis-split → sis-chiller). Pasar la partida de 100k a 200k no debe cambiar el capex (hoy 334,645 → 669,289). Con S.tab = "carga", VALOR.medidas.length debe ser igual que con S.tab = "valor" (hoy 0 contra 3).

### H-281 · load · los cuartos limpios entran a la carga sólo como propuesta clean>load aceptada
- **Qué se retira:**
  - La escritura directa de cl-handoff (23509-23525) y clean-to-zone (23527-23545).
  - El argumento bldDiv de computeLoad (11572, 3436, 3444).
  - La cédula y la presión de ductos de buildMemoriaPdf (1518-1520): se mueven a la memoria de ductos o se rotulan (regla 8).
- **Qué se captura en la pestaña:** nada nuevo. z.oaFixed sigue siendo captura propia editable. Si el usuario la cambia, la propuesta queda «propio».
- **Propuesta aceptada:** sí, **PROPUESTAS['clean>load']** (origen clean, destino load). clean y load son del cluster «termico», así que no hace falta permiso, pero sí aceptar.
  - Dos modos: «reposición a zona vinculada» (c.zonaId) y «zona nueva desde el cuarto».
  - Guarda `z.origenOA` o `z.origen = {motor:"clean", cuarto, makeup, ach, ts, firma}`, fuera de ENTRADAS.load (sinClaves) para no mover la huella.
  - Registra `registrarVinculo("clean>load")`. Si el cuarto cambia, estadoPropuesta da «desactualizado».
- **Migración:** las zonas con `c.zonaId` y `z.oaFixed === Math.round(makeup)` se marcan como aceptadas, con fecha de migración. Las demás quedan como captura propia. Cifra idéntica.
- **Versión:** no mueve números, así que load no sube.
- **Pruebas viejas que se reescriben:** S.67 (6918-6939) y S.68 (6941-6957), para que acepten la propuesta y comprueben vínculo y origen; 22.6 (3674, fraseMem) si sale la presión de la memoria de carga; S.69 (6960) si se quita el argumento.
- **Prueba nueva que falla hoy:** `S.nn (H-281) el traspaso de cuartos limpios deja origen y fecha`. Después de cl-handoff, `S.vinculos["clean>load"].estado === "aceptado"`. Con el cuarto ×2, `estadoPropuesta("clean>load") === "desactualizado"` y z.oaFixed no cambia. Hoy falla porque no existe la propuesta ni el vínculo (S.vinculos sólo tiene load>equip).
- **Sitio (SITE):** queda sujeto a **D1**. Si el dueño decide captura por pestaña, se agrega aquí la captura del sitio en Carga, con migración que copie S.site.

### H-282 · aire · presión atmosférica con procedencia; sin lectura viva del sitio (según D1)
- **Qué se retira:**
  - La lectura de `SITE.pAtm` en computeAire (7031) y en buildAirePdf (7277).
  - Los 101.325 por omisión en 7031 y en rhoAire (7026) (regla 6).
  - `site: S.site` en ENTRADAS.aire (19134).
- **Qué se captura en la pestaña (D1, opción a):** `S.aire.pAtm = {kPa, altitud, origen, ts}`. Sin captura, el tanque y la ΔP de la red salen «pendiente» y el FAD y el compresor siguen. Con la opción (b) no se captura nada: pAtm sale del sitio común y la huella lleva sólo `SITE.pAtm`.
- **Propuesta aceptada:** con la opción (a), **PROPUESTAS['proyecto>aire']** (instantánea de pAtmOf(alt) con sitio y altitud). Proyecto no es motor: hay que decidir si puede ser origen de PROPUESTAS (**D1**).
- **Migración:** al abrir, `S.aire.pAtm` toma el SITE.pAtm con que se calculó, con origen «sitio de Proyecto (migración)». El tanque y la ΔP salen iguales.
- **Versión:** aire 5 → 6 en la opción (a), porque sin captura el tanque queda pendiente. En la opción (b) no hay cambio de versión; sólo se ajustan los textos y la huella.
- **Entregables:** la memoria (7116-7118 y 7194), el PDF y la pantalla (22458-22534) dicen kPa, altitud, sitio y fórmula. La cita ASHRAE queda «BLOQUEADO: requiere texto de norma» hasta que esté en `parches/normas-texto/`. buildAirePdf llama a pdfDocHeaderMeta.
- **Pruebas viejas que se reescriben:** CM.aire (aire.calc.mjs:42-43 fija `S.aire.pAtm` explícito), R.1 (el fixture regresion-motores.emp.json usa tijuana y se agrega pAtm), S.21 (5677).
- **Prueba nueva que falla hoy:** `S.nn (H-282) el sitio no mueve el aire`. Opción (a): con pAtm aceptada, pasar la altitud de 149 a 2240 m no cambia `AIRE.tanque` (hoy 10,000 → 4,000 L). En las dos opciones, la memoria de aire contiene los kPa y la altitud usados (hoy no los tiene).

### H-283 · clean · huella sin sitio y memoria con procedencia
- **Qué se retira:** `site: S.site` de ENTRADAS.clean (19128). En buildLimpioSuitePdf (1636), el «Margen de error HAP», y el sitio queda rotulado «dato del proyecto, no entra al cálculo».
- **Qué se captura en la pestaña:** nada nuevo.
- **Propuesta aceptada:** no. La salida hacia carga va en H-281; hacia elec ya es cedula>elec; hacia cotización, en H-278.
- **Migración:** con re-sello; ninguna cifra cambia. clean no sube.
- **Pruebas viejas que se reescriben:** ninguna.
- **Prueba nueva que falla hoy:** `S.nn (H-283) el sitio no marca cuartos limpios`. Con key custom, db 40 y alt 1500, `huellaMotor("clean")` no cambia. Hoy cambia.

### H-284 · duct · huella sin sitio
- **Qué se retira:** `site: S.site` de ENTRADAS.duct (19130). Al quitarlo también se limpian las huellas de equip (H-274) y kaizen, que la anidan.
- **Qué se captura en la pestaña:** nada; rho, mu y eps ya se capturan.
- **Propuesta aceptada:** no. La salida hacia equip, cotización y kaizen va en H-274, H-278 y H-279.
- **Migración:** con re-sello; duct no sube.
- **Pruebas viejas que se reescriben:** ninguna.
- **Prueba nueva que falla hoy:** `S.nn (H-284) el sitio no marca ductos`. Con el sitio cambiado, `huellaMotor("duct")` no cambia y DUCT sigue idéntico (rho 1.2). Hoy la huella cambia.

### H-285 · hidro · huella sin sitio
- **Qué se retira:** `site: S.site` de ENTRADAS.hidro (19132). Se revierte el sobre-marcado de Bitacora-rev-2.9.14.md §2 con evidencia: computeHidro (10677-10841) no lee SITE y la salida es idéntica en 3 sitios.
- **Qué se captura en la pestaña:** nada.
- **Propuesta aceptada:** no.
- **Migración:** con re-sello; hidro no sube.
- **Pruebas viejas que se reescriben:** ninguna. S.21 sigue igual.
- **Prueba nueva que falla hoy:** `S.nn (H-285) el sitio no marca hidráulico`. Con S.site.db cambiado (key custom), `selloDe("hidro").estado` sigue «calculado». Hoy pasa a «desactualizado».

### Defectos aparte (fuera del inventario de cruces; asignar número después de H-285)
- **X-1** kaizen: MISSING_MATS (3286-3292) nunca se vacía. El defecto «material inexistente» sigue después de corregirlo, hasta recargar (exp6).
- **X-2** kaizen/valor: kaizenLazy (17329) devuelve un cascarón según S.tab, y VZ_CACHE (20195-20200) sólo firma `ops.length`. Valor se queda viejo. Se cierra con H-280 si se hace como allí se propone.
- **X-3** valor: kwTRde (19970-19973) le pasa el **nombre** a corrKeyOf, que espera la ficha. Siempre resuelve DX_split, así que `dkW` de la fuente a vale 0. **Corregirlo mueve cifras**: aparece el kW y el opex de las alternativas de sistema.
- **X-4** aire: dimRed (7172) mezcla 101.325 (referencia del FAD) con la pAtm del sitio. Va junto con H-219.

### Orden sugerido para el integrador
1. H-283, H-284 y H-285: sólo huella; nada de cifras ni de versión. Antes hay que hacer el re-sello.
2. H-274.
3. H-281.
4. H-278 (quote, el mayor).
5. H-279 y luego H-280 (valor depende de kaizen).
6. H-282, cuando esté la decisión D1.

## 11. Decisiones del dueño que cambian resultados

- **D1 · Sitio (S.site) y diversidad (S.bldDiv): ¿dato común de Proyecto o captura de cada pestaña?**
  - Hoy entran en vivo en load (SITE: de Tijuana a Mexicali, 5.46 → 9.10 TR), equip (capOf: instPlant 7.941 → 8.431, 4 → 9 unidades; bldDiv: plantTarget 7.793 → 6.234), aire (altitud: tanque 10,000 → 4,000 L), kaizen y valor.
  - Opción (b), declararlos dato común con procedencia: no mueve cifras. Sólo recorta huellas y rotula entregables.
  - Opción (a), captura por pestaña: pide captura o propuesta `proyecto>aire`, `proyecto>load` y `proyecto>equip`. Sin captura, tanque, carga y capacidad en sitio salen «pendiente».
  - Sub-decisión: ¿S.bldDiv se muda a Selección (`S.equip.div`), la única disciplina donde mueve cifras?
- **D2 · Kaizen y Valor: ¿instantáneas aceptadas, o excepción declarada «lectores en vivo con permiso»?**
  - Con instantáneas: las oportunidades y medidas dejan de actualizarse solas hasta aceptar, y aparecen propuestas nuevas (`equip>`, `elec>`, `hidro>`, `fuego>kaizen`, `*>valor`).
  - Con la excepción: basta con poner compuerta a las lecturas sin permiso (elec, hidro, fuego y SYS en Kaizen; SYS y $/TR en Valor). Aun así, Valor sin quote>kaizen pasa de capex 334,645 a 0.
  - Sub-decisión: ¿Kaizen y Valor son una sola disciplina de gestión, con una captura (tarifa, horas) y sin `kaizen>valor`?
- **D3 · Semillas sin fuente:** tarifa 2.85 MXN/kWh, 3500 h/año, cobre alimM 1350 MXN/m y Ltablero 30 m.
  - Al abrir un proyecto que no las capturó, ¿se conservan rotuladas «semilla sin fuente (migración)», con la misma cifra, o pasan a «pendiente», con el opex en pendiente y la oportunidad del alimentador fuera?
  - La regla 6 pide lo segundo; «misma cifra al abrir» pide lo primero.
- **D4 · Difusores y lámina en la cotización.**
  - En proyectos nuevos, sin propuesta aceptada, la lámina (hoy siempre en vivo) y los difusores quedan «Por cotizar». ¿Está bien?
  - ¿De dónde salen los difusores: de las bocas de ductos (`duct>quote`), de los CFM de carga (`load>quote`, como hoy, 1 por 400 CFM, criterio de la casa) o de una captura en Cotización?
- **D5 · Corregir kwTRde (X-3):** aparece el ahorro por kW en las alternativas de sistema de Valor, que hoy vale siempre 0. Es un defecto, pero cambia los resultados que el dueño ya ha visto.
