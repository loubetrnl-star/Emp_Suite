# Bitácora de trabajo

Un renglón por tarea, sólo se agrega al final.

| Fecha y hora (UTC) | Motor | Archivo tocado | Qué cambió | Banco de pruebas | Números |
|---|---|---|---|---|---|
| 2026-09-29 01:38 | todos | continuacion/revision-motores-2026-09-29/ | Reportes de los analistas (eléctrico, hidrosanitario, ductos) en una carpeta, un archivo por motor; commit 3a4e7a7 | sin cambio de código (bancos de 05f5e86: 564/564, 570/570) | idénticos |
| 2026-09-29 01:45 | todos | index.html, pruebas.mjs | H-304 (f7a0d24): la cotización por disciplina (tarjeta y PDF) sale de la cotización de su propio motor con su bloque comercial; ya no depende del permiso hacia la Cotización general ni del catálogo; PDF sin el % de la consolidada. Prueba S.184; S.7 adaptada | 565/565 y 571/571 (base) | idénticos (R.1 sin cambio) |
| 2026-09-29 01:53 | duct | index.html, pruebas.mjs, pruebas-motores/duct.mjs, parches/casos-a-mano/duct.calc.mjs, duct.csv | H-305 (54d8d22): se retiran la propuesta load>duct, los cruces load>duct y duct>load, chainToDuct, el botón «Generar tramos» y el aviso «Cruce carga → ductos»; ductos calcula sólo con sus tramos capturados; proyectos guardados conservan sus tramos. Prueba S.185; adaptadas 2.0.7, 4.1–4.3, 5.1–5.5 (con load>equip), 13.8, 22.6, S.84, CM.duct.8, P.2, S.A11Y.1 | 566/566 y 572/572 (base) | idénticos (R.1 sin cambio) |
| 2026-09-29 02:04 | elec | index.html, pruebas.mjs | H-306 (e5a5e2d): se retiran la propuesta cedula>elec, sus flechas y los seis cruces hacia el eléctrico; el eléctrico calcula sólo con su cuadro; se conserva la migración de proyectos anteriores en vivo (registro de origen escrito ahí: sin eso tronaba). Prueba S.186; adaptadas 2.0.6, 4.4–4.6, 13.6, S.24, S.48, S.51, S.52, M.2–M.4, Q.5, S.103 | 567/567 y 573/573 (base) | idénticos (R.1 sin cambio) |
