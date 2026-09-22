# Parche · Contingencia en la configuración comercial

Aplicado el 14-sep-2026 sobre la 2.9.6, que queda como **rev 2.9.6.1**.
Respaldo previo: `respaldo-rev-2.9.6/index-2.9.6-antes-de-contingencia-20260914-233741.html` (y su `pruebas`).

## Decisiones del dueño
- La contingencia se calcula **solo sobre el costo directo**. No genera indirectos ni utilidad.
- Valor de arranque: **15 %** (`QUOTE_SEED.contingencia = 0.15`).
- Entra en la **cotización privada** y en la **licitación**.
- Un proyecto guardado antes de que existiera la contingencia abre con **0 %**, así su total no cambia.
- **Con contingencia en 0 % el renglón se oculta** (decisión del dueño, 14-sep-2026, 23:47). Aplica a pantalla, PDF de cotización, propuesta PDF y Excel, y licitación (tabla, tarjetas y párrafo). La perilla y el campo de captura siguen visibles para poder subirla. En el Excel, las filas se recorren solas y el SUM del subtotal sigue contiguo.
- Respaldo de la versión anterior con la fila siempre visible: `respaldo-rev-2.9.6/index-2.9.6.1-fila-visible-20260914-234708.html`.

## Cascada resultante
- Privada: Directo + Indirectos + Utilidad + **Contingencia** + Flete + Fianzas + Financiamiento = Antes de IVA; + IVA = Total.
- Licitación: Directo → Indirectos → Financiamiento → Utilidad → **+ Contingencia (sobre el directo)** → Cargos adicionales.

## Dónde aparece
- Pantalla de cotización: renglón "Del costo al precio", barra de composición, perilla y campo de captura. En la tarjeta de licitación se muestra en solo lectura.
- PDF de cotización.
- Propuesta integral en PDF, en español e inglés.
- Libro Excel, en español e inglés: fila con fórmula `=C<directo>*0.15` dentro del SUM del subtotal.
- PDF de licitación: tabla de sobrecosto y tarjetas.
- Ayuda del campo.

## Reaplicar (por ejemplo, sobre la 2.9.7 al desplegarla)
```
node contingencia.mjs index.html index-nuevo.html             # REV x.y.z → x.y.z.1
node pruebas-contingencia.mjs pruebas.mjs pruebas-nuevo.mjs
```
Cada ancla debe aparecer exactamente una vez; si no, el script no escribe nada. Ya reconoce las variantes de la 2.9.7 (`pctPolitica`/`pctQ`). En la 2.9.7 además agrega `contingencia` a `POLITICA_D` y pone `"contingencia":0` en el caso de verificación embebido.

## Verificación en la 2.9.6.1
- Banco: 229 de 229. Son las 222 anteriores más las 7 nuevas de la sección C.
- Control: el banco nuevo contra la 2.9.6 sin parche falla exactamente en las 7 de la sección C.
- Pruebas ajustadas:
  - 8.5 y 22.1 comparan con la contingencia en 0 %.
  - 11.7 buscaba el texto literal `RESUMEN_EJECUTIVO!C14` y ahora verifica que la portada apunte a la fila real del total. Con la fila nueva, el total cae justo en C14.
- Diferencial de 40 estados, original contra parchada:
  - Con 0 %: cero diferencias numéricas en QUOTE, LOADS, DUCT, ELEC, HIDRO, FUEGO, AIRE, CIVIL, SOPORTE, VENT y CLEAN.
  - Con 15 %: solo cambian contingencia, subtotal, IVA, total y los indicadores, con la fórmula exacta.

- Diferencial de documentos con 0 %: el texto del PDF de cotización, la propuesta ES/EN, la licitación y los libros ES/EN es idéntico a la 2.9.6 original, salvo la marca de revisión.

## Pendiente al reaplicar sobre la 2.9.7
Resultado en una copia: 287 de 295. Las fallas de "sin ceros" se resolvieron al ocultar el renglón. Quedan 8:
1. **Líneas base congeladas** (23.23, 23.32, 23.39, 23.44, 23.57, 23.60). El corpus trae las llaves nuevas `QUOTE.cont`/`QUOTE.contPct`, y los documentos cambian por la marca de revisión 2.9.7 → 2.9.7.1. Es un cambio intencional: hay que regenerar esas líneas base.
2. **Fixture del caso** `fixtures/caso-verificacion*.json` sin `quote.contingencia` (23.22). Hay que agregar `"contingencia": 0`.
3. **Migración legado → vacío** (23.58). Un legado con contingencia en 0 % migra, pasa a la semilla de 15 % y su cotización cambia sin que la ventana lo reporte. Falta decidir si conserva el 0 % o lo reporta.
