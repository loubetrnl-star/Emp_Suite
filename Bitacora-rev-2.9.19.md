# Bitácora · SuiteEmp rev 2.9.19

**Fecha:** 21-sep-2026 · **Base:** rev 2.9.18 · **Regla:** todo número que se mueve lleva norma, antes/después y prueba.

## 1. Qué es esta revisión

Revisión adversarial de lo que cambió en las revs 2.9.16, 2.9.17 y 2.9.18 (esas revisiones movieron números con banco y comparador, pero sin la revisión independiente que sí tuvo la 2.9.14). Cuatro revisores, solo lectura, cada uno con un frente: conductor e hidro; pisos internos; Hunter y Tijuana; interfaz y paleta. Cada hallazgo se verificó contra el código antes de corregirlo.

**Resultado:** sin errores de cálculo en conductor, Hunter, Tijuana ni interfaz. 24 hallazgos corregidos, 4 de peso.

## 2. Corregido

### De peso
| # | Qué pasaba | Qué hace ahora | Mueve números |
|---|---|---|---|
| 1 | Las partidas «pendientes» de la red hidráulica (sin precio o sin longitud) no salían en el **Excel de la propuesta** ni en la **licitación**: el cliente leía «Sanitario e hidráulica: INCLUIDO, 1 partida» sin saber que la tubería no estaba cotizada | La matriz de alcance del Excel dice «PENDIENTE, sin cotizar: …» por sección (es/en); la licitación trae el párrafo de pendientes; la tarjeta de costo de la pantalla hidro también | No |
| 2 | Con aire comprimido sin demanda (0 unidades desde la 2.9.16) el eléctrico seguía metiendo **un compresor** al cuadro de cargas por `aire>elec` | Sin unidades en servicio no entra compresor | Sí, solo en ese caso (antes 1 compresor de 7.5 kW; ahora 0). Norma: no aplica; es coherencia con la decisión de pisos |
| 3 | Contra incendio sin área y fuente municipal disparaba el **error falso** «la red municipal no alcanza: se necesitan 16.3 m» y la memoria imprimía «bomba nominal 0 L/min, 0 HP» | Sin área: sin avisos y la memoria solo dice que no se calcula | No (solo avisos y texto) |
| 4 | Un tramo de agua con longitud pero **sin unidades mueble** se cotizaba como tubería de 1/2" (el primer diámetro del catálogo) | Queda «pendiente de unidades mueble» y no se cotiza | Sí, solo en ese caso |

### Menores
- Nota interna «SIN VERIFICAR, CTS/SDR-11 no llega aquí» del diámetro CPVC ≥ 2 1/2" salía en la descripción de la partida; al cliente ahora solo llega el diámetro.
- Obra civil contaba como área clasificada un cuarto limpio que el motor declara vacío (área sin altura). Ya no.
- Hunter: se agregaron los renglones 2500, 3000, 4000 y 5000 UM de la Table E103.3(3) (380, 433, 525, 593 gpm). Antes se extrapolaba: a 5000 UM daba 661 gpm, 11 % de más.
- El sitio por omisión de un proyecto nuevo y «Personalizado» partían de 35/24 °C y 0 m; ahora parten de Tijuana ASHRAE 2021 y «Personalizado» tiene campo de rango diario.
- Aviso informativo en carga térmica cuando el exterior de diseño es más seco que el interior (Tijuana ASHRAE 2021: la carga latente por aire exterior queda en el piso de 0.5 g/kg).
- Fecha del sello de los documentos: decía 19-sep-2026 desde la 2.9.14; ahora 21-sep-2026.
- Azul de las gráficas de carga térmica `#1F4FD8` → `#7B9BFF` (tono del isométrico): sobre el fondo oscuro contrastaba 2.8:1, ahora ≈7:1.
- Kaizen y Valor sin proyecto abierto pintaban punto de semáforo en el menú; ya no.
- Excel de cuartos limpios exportaba `dp` con respaldo 0 mientras el motor usa 12.5 Pa; ahora exporta el dP que rige.
- Memoria de cuarto limpio con fracción de aire exterior capturada en 0 decía «10 %».
- Memoria de soportería imprimía «Elevación: …» aunque la renta ya no se cotice.
- Memoria hidro duplicaba la línea de Hunter; ahora una sola, con la cita del IPC.
- Base de la memoria eléctrica del Excel ahora dice el tipo de conductor.
- Texto del cruce `hidro>quote` seguía diciendo «50 m supuestos».
- Comentarios de código desactualizados (pisos de 1 m² y 2.2 m, Tijuana «protegida», arcilla en PDF, zona de carga con role=button) y CSS muerto de `.cxz-drop:focus-visible`.

## 3. Verificación
- **Banco:** 342/342 sin `--base`; 347/347 con `--base` (inicio de la 2.9.19). Prueba nueva S.35; S.A11Y.5 ajustada (la zona de carga ya no recibe foco).
- **Comparador contra la 2.9.18** (56 escenarios × 2 modos): **ningún total de cotización cambia** en ningún escenario. Las diferencias son el campo nuevo `secoExterior`, el aviso informativo nuevo en `VALID`, las líneas de memoria retiradas o reescritas (incendio, hidro, soportería), el sitio por omisión y la fila del compresor que ya no va en la propuesta eléctrica sin demanda. La ida y vuelta solo marca el campo nuevo en `sin-zonas-con-datos`.

## 4. Para decisión del dueño
- **Sello y versión del motor:** la huella del sello es de las entradas, no del motor. Un proyecto sellado en la 2.9.17 abre en la 2.9.18/2.9.19 como «Calculado <fecha vieja>» aunque Hunter y Tijuana ya den otros números (sí hay aviso de revisión distinta al abrir). Opciones: (a) incluir la revisión del motor en la huella, con lo que todo proyecto anterior abre «Desactualizado» al cambiar de rev; (b) dejarlo como está.
- **Latente en Tijuana:** con BH coincidente 17.5 °C el exterior es más seco que el interior y la latente por aire exterior queda en el piso. Es lo que dice ASHRAE; para cuartos con control de humedad convendría una condición de deshumidificación (punto de rocío 0.4 %, ≈19–20 °C). Hoy solo se avisa.

## 5. Pendiente
1. Capturar los precios de tubería hidráulica por diámetro.
