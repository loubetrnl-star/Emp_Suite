# Revisión adversarial de H-264…H-266 (sobre 63a2794) · general

## U6 · SIN VERIFICAR (verificar con prueba primero) · baja · lente reglas
**genera.mjs ya no reproduce el fixture versionado, y los casos a mano siguen justificando con la herencia y el conteo en vivo que se retiraron**
Dónde: parches/regresion-motores/genera.mjs:74

Escenario: Una copia de genera.mjs corrida sobre 63a2794 escribe un fixture con civil.areas, soporte.alturaEstructura y snap (además de equip.zonas y elec.h268). El versionado no trae nada de eso. En el próximo aumento de versión (regla 3), el fixture cambia por algo más que timestamps y no se revierte. Entonces S.101 (pruebas.mjs:7750), S.102 (7800), S.103 (7869) y S.104 (7983) lanzan «el caso no aísla…» y R.1 deja de probar la migración al abrir.

Detalle: La excepción de mantener el fixture viejo no quedó en CLAUDE.md ni en genera.mjs (líneas 50, 54 y 63 capturan el formato nuevo). Los casos a mano tampoco se actualizaron. soporte.calc.mjs:275/283 (CM.soporte.11.d) justifica 7.2 m con «criterio de la casa (index.html:7982): zona mayor + 1.2», pero esa fórmula ya no existe (7982 es otra línea). 11.g cita «bases de equipo en vivo (index.html:8160-8163)». pruebas-motores/soporte.mjs:118 afirma «en vivo» cuando el fixture ya abre con instantánea, así que 11d ya no prueba la transición de H-231. fuego.csv:13-14/38-39 y fuego.calc.mjs:158-160 siguen diciendo «altura MÁXIMA heredada». Hoy estos casos verifican la migración, no el motor. Además, CHANGELOG-motores.md:169-171 deja la fila v12 de soporte fuera de la tabla por dos renglones en blanco.

